'use client';

import { useEffect, useState } from 'react';
import type { ScoredSite } from '@/lib/types';

interface ScorecardModalProps {
  site: ScoredSite | null;
  onClose: () => void;
}

const PILLAR_ORDER: Array<{ key: keyof ScoredSite['pillars']; label: string }> = [
  { key: 'intrusion', label: 'Intrusion' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'performance', label: 'Performance' },
  { key: 'accessibility', label: 'Accessibility' },
];

export default function ScorecardModal({ site, onClose }: ScorecardModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Handle open animation and escape key
  useEffect(() => {
    if (site) {
      // Small delay to allow display:block before opacity transition
      requestAnimationFrame(() => setIsOpen(true));

      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    } else {
      setIsOpen(false);
    }
  }, [site, onClose]);

  // If there's no site and we're fully closed, don't render the DOM overlay
  if (!site && !isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink/55 transition-opacity duration-250 ease-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      onClick={(e) => {
        // Close if clicking the overlay background itself
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative bg-paper border-2 border-ink w-full max-w-[960px] max-h-[88vh] overflow-y-auto p-8 transition-transform duration-[280ms] ease-[cubic-bezier(0.2,0.9,0.3,1.15)] ${isOpen ? 'scale-100 translate-y-0' : 'scale-[0.92] translate-y-3'
          }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-[27px] font-mono text-xs tracking-widest text-inkSoft bg-transparent border border-inkSoft px-3 py-1 cursor-pointer transition-colors hover:bg-ink hover:text-paper z-20"
        >
          CLOSE ✕
        </button>

        {site && (
          <>
            <div className={`absolute top-7 right-[105px] w-[117px] h-[117px] border-[5px] rounded-full flex items-center justify-center text-center font-display text-sm -rotate-[12deg] opacity-[0.88] z-10 ${site.overallGrade.colour === 'ledger' ? 'border-ledger text-ledger' :
              site.overallGrade.colour === 'brass' ? 'border-brass text-brass' : 'border-rust text-rust'
              }`}>
              {site.overallGrade.letter}
            </div>

            <h2 className="font-display text-3xl m-0 pr-24 leading-tight">{site.siteName}</h2>

            <div className="font-mono text-xs text-inkSoft mt-1 mb-6">
              Scanned {new Date(site.scoredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · Mobile Chrome · United States
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {PILLAR_ORDER.map(({ key, label }) => {
                const val = site.pillars[key];
                const grade = site.pillarGrades[key];
                const bgClass = grade.colour === 'ledger' ? 'bg-ledger' : grade.colour === 'brass' ? 'bg-brass' : 'bg-rust';

                return (
                  <div key={key}>
                    <div className="flex justify-between font-mono text-[17px] uppercase tracking-[0.5px] text-inkSoft mb-1">
                      {label} <b className="text-ink text-[20px]">{typeof val === 'number' ? Number(val.toFixed(2)) : val}</b>
                    </div>
                    <div className="h-[9px] bg-ink/15 overflow-hidden">
                      <div className={`h-full ${bgClass}`} style={{ width: `${val}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {site.aiExplanation && (
              <div className="mb-6 border-l-4 border-rust pl-4 py-1">
                <div className="font-mono text-[14px] uppercase tracking-widest text-rust mb-1">AI Verdict</div>
                <p className="font-body text-sm leading-relaxed text-ink italic">&ldquo;{site.aiExplanation}&rdquo;</p>
              </div>
            )}

            <div className="font-mono text-xs leading-[1.9] text-inkSoft border-t border-ink/25 pt-4">
              <b className="text-ink">Findings:</b> Based on automated lab testing. Scorecard values reflect raw performance metrics, intrusion counts, tracker domains, and accessibility violations captured at run-time.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
