'use client';

/**
 * Masthead.tsx — Newspaper masthead with entrance animation
 *
 * WHY: The masthead is the single most important identity moment on the page.
 * The staggered fade-up (eyebrow → title → subhead → edition → rule)
 * replicates how a newspaper's front page "builds" as it comes off the press.
 * GSAP handles this because it's a one-shot orchestrated sequence that's
 * difficult to express cleanly with Framer Motion stagger on static text.
 */

import { useEffect, useRef } from 'react';
import type { Edition } from '@/lib/types';

interface MastheadProps {
  edition: Edition;
  siteCount: number;
}

export default function Masthead({ edition, siteCount }: MastheadProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !containerRef.current) return;

    // Lazy-import GSAP so it doesn't block first paint
    import('gsap').then(({ gsap }) => {
      const els = containerRef.current?.querySelectorAll('[data-anim]');
      if (!els?.length) return;

      // Entrance: staggered fade-up, each element 80ms after the previous
      // Total sequence: ~600ms — within our 600ms scroll-reveal cap
      gsap.fromTo(
        Array.from(els),
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'transform',
        },
      );
    });
  }, []);

  return (
    <header
      ref={containerRef}
      className="text-center px-6 pt-10 pb-6 border-b-4 border-double border-ink"
    >
      {/* Eyebrow — acts as a dateline, a concrete piece of information not filler */}
      <p
        data-anim
        className="font-mono text-xs uppercase tracking-[0.25em] text-inkSoft mb-3 opacity-0"
        style={{ opacity: undefined }}
      >
        {edition.volume} &nbsp;·&nbsp; {edition.category} &nbsp;·&nbsp;{' '}
        {new Date(edition.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      {/* Title — display font used exclusively here + section heads + stamps */}
      <h1
        data-anim
        className="font-display text-4xl sm:text-6xl tracking-tight text-ink leading-none mb-3 opacity-0"
        style={{ opacity: undefined }}
      >
        Page Crank
      </h1>

      {/* Subtitle — concrete claim, not marketing copy */}
      <p
        data-anim
        className="font-body italic text-inkSoft text-base sm:text-lg mb-5 opacity-0"
        style={{ opacity: undefined }}
      >
        Measuring what {siteCount} major news publications cost their readers
      </p>

      {/* Rule pair — hairline + thicker, newspaper column divider style */}
      <div data-anim className="flex items-center gap-3 justify-center opacity-0" style={{ opacity: undefined }}>
        <div className="h-px flex-1 max-w-24 bg-brass" />
        <span className="font-mono text-[15px] uppercase tracking-[0.3em] text-brass">
          {edition.editionLabel}
        </span>
        <div className="h-px flex-1 max-w-24 bg-brass" />
      </div>
    </header>
  );
}
