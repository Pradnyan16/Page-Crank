'use client';

import { useState, useEffect } from 'react';
import type { ScoredSite } from '@/lib/types';
import ScorecardModal from './ScorecardModal';

interface SiteCardGridProps {
  sites: ScoredSite[];
}

const PILLAR_ORDER: Array<{ key: keyof ScoredSite['pillars']; label: string }> = [
  { key: 'intrusion',     label: 'Intrusion'     },
  { key: 'privacy',       label: 'Privacy'        },
  { key: 'performance',   label: 'Performance'    },
  { key: 'accessibility', label: 'Accessibility'  },
];

export default function SiteCardGrid({ sites }: SiteCardGridProps) {
  const [selectedSite, setSelectedSite] = useState<ScoredSite | null>(null);
  const [mounted, setMounted] = useState(false);

  // Trigger animation after mount
  useEffect(() => {
    // Small delay to ensure CSS transitions trigger after initial 0% width render
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sites.map((site) => (
          <button
            key={site.siteId}
            onClick={() => setSelectedSite(site)}
            className="group relative bg-paperDark border border-ink/35 p-5 text-left cursor-pointer transition-all duration-200 hover:-translate-y-[5px] hover:shadow-[4px_4px_0_rgba(33,28,22,0.15)] focus:outline-none focus:ring-2 focus:ring-rust"
          >
            {/* Inner inset border (pseudo-element equivalent) */}
            <div className="absolute inset-[8px] border border-ink/30 pointer-events-none" />
            
            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <h3 className="font-display text-[29px] leading-tight m-0 text-ink">{site.siteName}</h3>
                <div className="font-mono text-[17px] text-inkSoft mt-1">#{site.rank}</div>
              </div>
              <span className={`font-display text-base px-2.5 py-0.5 border-2 border-current ${
                site.overallGrade.colour === 'ledger' ? 'text-ledger' :
                site.overallGrade.colour === 'brass' ? 'text-brass' : 'text-rust'
              }`}>
                {site.overallGrade.letter}
              </span>
            </div>

            {/* Stats */}
            <div className="space-y-2 relative z-10">
              {PILLAR_ORDER.map(({ key, label }) => {
                const val = site.pillars[key];
                const grade = site.pillarGrades[key];
                const bgClass = grade.colour === 'ledger' ? 'bg-ledger' : grade.colour === 'brass' ? 'bg-brass' : 'bg-rust';
                
                return (
                  <div key={key} className="mb-2.5 last:mb-0">
                    <div className="flex justify-between font-mono text-[15px] tracking-[0.5px] uppercase text-inkSoft mb-[5px]">
                      {label} <b className="font-mono text-[17px] text-ink">{typeof val === 'number' ? Number(val.toFixed(2)) : val}</b>
                    </div>
                    <div className="h-[8px] bg-ink/15 overflow-hidden">
                      <div 
                        className={`h-full transition-[width] duration-1000 ease-out ${bgClass}`}
                        style={{ width: mounted ? `${val}%` : '0%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hint */}
            <div className="font-mono text-[14px] text-inkSoft text-center mt-3 tracking-widest opacity-70 relative z-10">
              CLICK FOR FULL SCORECARD
            </div>
          </button>
        ))}
      </div>

      <ScorecardModal 
        site={selectedSite} 
        onClose={() => setSelectedSite(null)} 
      />
    </>
  );
}
