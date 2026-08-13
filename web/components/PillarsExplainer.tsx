'use client';

import { useState, useEffect } from 'react';

const pillarData = {
  intrusion: {
    name: 'Intrusion',
    what: 'How much a page interrupts, blocks, or delays you from reading what you came for — newsletter popups, interstitials, sticky ads, autoplay video, and repeated scroll interference.',
    how: 'An automated browser session loads each page fresh, then scrolls through it at a fixed pace while recording every fixed or modal element that appears, how much of the viewport it covers, and how long it persists.',
    metrics: ['Newsletter popups & interstitials', 'Sticky ads & viewport obstruction', 'Autoplay video on load', 'Notification & app-install prompts', 'Repeated scroll interference'],
    why: 'Intrusion is the most immediate cost a reader feels — before they have read a single sentence, they have already had to dismiss something. It is also the friction users cite most often when they abandon a page.'
  },
  privacy: {
    name: 'Privacy',
    what: 'How much of your browsing is being tracked, sold, or fingerprinted — by the publisher and by third parties riding along with them, including before you have made any consent choice.',
    how: 'All network requests are logged during the session. Domains are cross-referenced against maintained tracker blocklists, and trackers are counted separately before and after a "reject all" consent action where one is available.',
    metrics: ['Third-party tracker domains', 'Advertising & session-replay pixels', 'Third-party cookies set', 'Tracking activity before consent', 'Tracking activity after "reject all"'],
    why: 'Consent banners create an illusion of control. Measuring what actually happens on the network — not just what a banner claims — is the only way to know whether "reject all" really means reject all.'
  },
  performance: {
    name: 'Performance',
    what: 'How fast a page becomes usable, how much data it costs to load, and how stable it stays while you are trying to read or tap something.',
    how: 'Core Web Vitals and resource metrics are captured via Lighthouse on a mobile connection profile, run three times per page to reduce noise from network variance.',
    metrics: ['Time to readable content', 'Largest Contentful Paint (LCP)', 'Cumulative Layout Shift (CLS)', 'Total page weight & request count', 'Interaction responsiveness'],
    why: 'Slow, shifting pages disproportionately punish readers on older phones or weaker connections — the people least able to just close the tab and try another site.'
  },
  accessibility: {
    name: 'Accessibility',
    what: 'Whether a page can actually be used by people relying on screen readers, keyboard navigation, or sufficient color contrast — the detectable baseline, not a full manual audit.',
    how: 'Automated accessibility checks (axe-core via Lighthouse) scan the rendered page for common, machine-detectable failures. Results are labeled as detectable issues, not a complete accessibility certification.',
    metrics: ['Color contrast ratios', 'Missing form & image labels', 'Heading structure', 'Keyboard reachability', 'ARIA & landmark issues'],
    why: 'A highly ranked page that is unusable for a meaningful share of readers is not actually respecting its audience — accessibility is treated as a baseline cost of entry, not a bonus feature.'
  }
};

type PillarKey = keyof typeof pillarData;

export default function PillarsExplainer() {
  const [activePillar, setActivePillar] = useState<PillarKey | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePillar(null);
    };
    if (activePillar) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePillar]);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (activePillar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activePillar]);

  const activeData = activePillar ? pillarData[activePillar] : null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'intrusion', name: 'Intrusion', desc: 'Popups, overlays, autoplay, sticky ads' },
          { key: 'privacy', name: 'Privacy', desc: 'Trackers, pixels, cookies before and after consent' },
          { key: 'performance', name: 'Performance', desc: 'Load time, page weight, layout shift' },
          { key: 'accessibility', name: 'Accessibility', desc: 'Contrast, labels, keyboard navigation' },
        ].map(({ key, name, desc }) => (
          <div 
            key={key} 
            className="group relative bg-paperDark border border-ink/35 p-5 md:p-6 cursor-pointer text-center transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_rgba(33,28,22,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
            tabIndex={0}
            onClick={() => setActivePillar(key as PillarKey)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActivePillar(key as PillarKey);
              }
            }}
          >
            {/* Inner border effect */}
            <div className="absolute inset-[6px] border border-ink/30 pointer-events-none" />
            <h3 className="font-display text-xl mb-2">{name}</h3>
            <p className="font-body text-xs text-inkSoft m-0 leading-[1.5]">{desc}</p>
            <div className="font-mono text-[14px] text-inkSoft text-center mt-4 tracking-widest opacity-70 group-hover:opacity-100 transition-opacity uppercase">
              Click to see details
            </div>
          </div>
        ))}
      </div>

      {/* Overlay / Modal */}
      {activePillar && activeData && (
        <div 
          className="fixed inset-0 bg-ink/55 flex items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-200"
          onClick={() => setActivePillar(null)}
        >
          <div 
            className="relative bg-paper border-2 border-ink w-full max-w-2xl max-h-[88vh] overflow-y-auto p-6 sm:p-8 animate-in zoom-in-95 duration-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button 
              className="absolute top-4 right-4 sm:top-6 sm:right-6 font-mono text-xs tracking-widest text-inkSoft bg-transparent border border-inkSoft px-3 py-1.5 cursor-pointer hover:bg-ink hover:text-paper transition-colors"
              onClick={() => setActivePillar(null)}
              aria-label="Close details"
            >
              CLOSE ✕
            </button>
            
            <h2 id="modal-title" className="font-display text-3xl sm:text-4xl m-0 mb-1">{activeData.name}</h2>
            <div className="font-mono text-[17px] tracking-widest text-inkSoft uppercase mb-6 sm:mb-8">
              One of four Reader Respect pillars
            </div>
            
            <div className="mb-6">
              <h4 className="font-mono text-[17px] tracking-[1.5px] uppercase text-rust m-0 mb-2">What it measures</h4>
              <p className="font-body text-sm leading-[1.7] text-ink m-0">{activeData.what}</p>
            </div>
            
            <div className="mb-6">
              <h4 className="font-mono text-[17px] tracking-[1.5px] uppercase text-rust m-0 mb-2">How it's measured</h4>
              <p className="font-body text-sm leading-[1.7] text-ink m-0">{activeData.how}</p>
            </div>
            
            <div className="mb-6">
              <h4 className="font-mono text-[17px] tracking-[1.5px] uppercase text-rust m-0 mb-2">Key metrics</h4>
              <ul className="m-0 p-0 list-none font-mono text-[17px] sm:text-xs">
                {activeData.metrics.map((m, i) => (
                  <li key={i} className="py-2 border-b border-ink/15 last:border-b-0 text-ink leading-relaxed">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-mono text-[17px] tracking-[1.5px] uppercase text-rust m-0 mb-2">Why it matters</h4>
              <p className="font-body text-sm leading-[1.7] text-ink m-0">{activeData.why}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
