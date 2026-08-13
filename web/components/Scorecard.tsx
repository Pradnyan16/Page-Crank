'use client';

/**
 * Scorecard.tsx — Full single-site scorecard
 *
 * WHY: The scorecard is the primary evidence display — it shows both the
 * verdict (stamp) and the evidence (pillar bars) together. The flat 4px
 * box-shadow on hover is the only shadow on the site — kept because it
 * signals "this is a physical card you can pick up", not generic elevation.
 * Corners are square. No rounded-corner-everything.
 */

import { useState } from 'react';
import GradeStamp from './GradeStamp';
import PillarBar from './PillarBar';
import type { ScoredSite } from '@/lib/types';

interface ScorecardProps {
  site: ScoredSite;
  rank: number;
  animateStamp?: boolean;
}

const PILLAR_ORDER: Array<{ key: keyof ScoredSite['pillars']; label: string }> = [
  { key: 'intrusion',     label: 'Intrusion'     },
  { key: 'privacy',       label: 'Privacy'        },
  { key: 'performance',   label: 'Performance'    },
  { key: 'accessibility', label: 'Accessibility'  },
];

const TAX_COLOUR: Record<string, string> = {
  Low:      'text-ledger',
  Moderate: 'text-brass',
  High:     'text-rust',
  Severe:   'text-rust font-bold',
};

export default function Scorecard({ site, rank, animateStamp = false }: ScorecardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="
        scorecard-inset relative bg-paperDark border border-ink p-5
        transition-shadow duration-150 cursor-pointer
        hover:shadow-scorecard focus-within:shadow-scorecard
      "
      style={{ transition: 'box-shadow 150ms ease' }}
      onClick={() => setExpanded((e) => !e)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded((prev) => !prev); }}
      tabIndex={0}
      role="button"
      aria-expanded={expanded}
      aria-label={`Scorecard for ${site.siteName}, overall score ${site.overallScore}`}
    >
      {/* Header row: rank + name + stamp */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          {/* Rank — concrete number, not decorative */}
          <span className="font-mono text-sm text-inkSoft shrink-0 pt-0.5">#{rank}</span>
          <div className="min-w-0">
            <h2 className="font-body font-bold text-ink text-lg leading-tight">{site.siteName}</h2>
            <a
              href={site.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[17px] text-inkSoft hover:text-rust transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {new URL(site.siteUrl).hostname}
            </a>
          </div>
        </div>

        <GradeStamp grade={site.overallGrade} size="md" animate={animateStamp} />
      </div>

      {/* Attention Tax label — named, concrete signal not filler copy */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-ink/20">
        <span className="font-mono text-[15px] uppercase tracking-widest text-inkSoft">
          Attention Tax
        </span>
        <span className={`font-mono text-xs ${TAX_COLOUR[site.attentionTax] ?? 'text-ink'}`}>
          {site.attentionTax}
        </span>
        {site.rankDelta !== undefined && site.rankDelta !== 0 && (
          <span className={`font-mono text-[15px] ml-auto ${site.rankDelta > 0 ? 'text-ledger' : 'text-rust'}`}>
            {site.rankDelta > 0 ? `▲${site.rankDelta}` : `▼${Math.abs(site.rankDelta)}`}
          </span>
        )}
      </div>

      {/* Pillar bars — always visible */}
      <div className="space-y-3">
        {PILLAR_ORDER.map(({ key, label }, i) => (
          <PillarBar
            key={key}
            label={label}
            score={site.pillars[key]}
            colour={site.pillarGrades[key].colour}
            delay={i * 80}
          />
        ))}
      </div>

      {/* Expanded detail — scan metadata */}
      {expanded && (
        <div className="mt-4 pt-3 border-t border-ink/20 space-y-1">
          <p className="font-mono text-[15px] text-inkSoft uppercase tracking-widest">
            Scanned {new Date(site.runStartedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            &nbsp;·&nbsp; Pixel 5 + 3G Fast &nbsp;·&nbsp; Pre-consent
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            {PILLAR_ORDER.map(({ key, label }) => (
              <div key={key} className="flex justify-between">
                <span className="font-mono text-[15px] text-inkSoft">{label}</span>
                <span className="font-mono text-[15px] font-bold">{Number(site.pillars[key].toFixed(2))}/100</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
