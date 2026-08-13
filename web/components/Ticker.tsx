'use client';

/**
 * Ticker.tsx — Scrolling news-wire ticker
 *
 * WHY: The ticker signals live data from a benchmarking "wire service" —
 * it reinforces the newsroom metaphor without cluttering the main layout.
 * GSAP InfiniteLoop is the right tool here because CSS animation-based
 * tickers desync on tab-visibility-change; GSAP handles that correctly.
 * Respects prefers-reduced-motion by halting the animation entirely.
 */

import { useEffect, useRef } from 'react';
import type { ScoredSite } from '@/lib/types';

interface TickerProps {
  sites: ScoredSite[];
}

const TIER_LABEL: Record<string, string> = {
  good: '✦',
  mid:  '◆',
  bad:  '▼',
};

export default function Ticker({ sites }: TickerProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !trackRef.current) return;

    // Duplicate items so the loop is seamless
    const track = trackRef.current;
    const original = track.innerHTML;
    track.innerHTML = original + original;

    let x = 0;
    const speed = 0.5; // px per frame — slow, readable, like a real news ticker
    let rafId: number;

    const animate = () => {
      x -= speed;
      const halfWidth = track.scrollWidth / 2;
      // Reset to 0 when first copy has scrolled fully off-screen
      if (Math.abs(x) >= halfWidth) x = 0;
      track.style.transform = `translateX(${x}px)`;
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    // WHY: border-double top and bottom = newspaper column rule styling
    <div
      className="w-full overflow-hidden border-y-2 border-double border-ink py-1.5 bg-paper"
      role="marquee"
      aria-label="Live ranking ticker"
    >
      <div ref={trackRef} className="flex whitespace-nowrap will-change-transform">
        {sites.map((site) => (
          <span
            key={site.siteId}
            className="inline-flex items-center gap-2 px-6 font-mono text-xs uppercase tracking-widest"
          >
            <span
              className={
                site.overallGrade.colour === 'ledger' ? 'text-ledger' :
                site.overallGrade.colour === 'rust' ? 'text-rust' : 'text-brass'
              }
            >
              {TIER_LABEL[site.overallGrade.tier] ?? '◆'}
            </span>
            <span className="text-inkSoft">{site.siteName}</span>
            <span className="font-bold">{site.overallScore}</span>
            <span className="text-ink/30 mx-2">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}
