'use client';

/**
 * RankingTable.tsx — Sortable, filterable ranking table
 *
 * WHY: A table is the correct layout for comparative ranked data — not cards,
 * not a grid. Tables communicate relative ordering clearly. Radix ToggleGroup
 * handles filter button keyboard navigation automatically (arrow keys, focus).
 * Sortable column headers use tabIndex + onKeyDown so keyboard users can sort.
 *
 * Pillar filter is a category filter, not a step selector — no numbering.
 */

import { useState } from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import type { ScoredSite } from '@/lib/types';
import GradeStamp from './GradeStamp';
import Link from 'next/link';

type SortKey = 'rank' | 'intrusion' | 'privacy' | 'performance' | 'accessibility';
type SortDir = 'asc' | 'desc';

interface RankingTableProps {
  sites: ScoredSite[];
}

const TIER_FILTERS = [
  { value: 'all',  label: 'ALL'  },
  { value: 'good', label: 'GOOD' },
  { value: 'mid',  label: 'FAIR' },
  { value: 'bad',  label: 'POOR' },
] as const;

type FilterValue = typeof TIER_FILTERS[number]['value'];

const TIER_ROW_CLASS: Record<string, string> = {
  good: 'border-l-2 border-ledger',
  mid:  'border-l-2 border-brass',
  bad:  'border-l-2 border-rust',
};

export default function RankingTable({ sites }: RankingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filter, setFilter] = useState<FilterValue>('all');

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'rank' ? 'asc' : 'desc'); }
  }

  const filtered = sites.filter(site => {
    if (filter === 'all') return true;
    return site.overallGrade.tier === filter;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aVal = sortKey === 'rank' ? (a.rank ?? 99) : a.pillars[sortKey as keyof typeof a.pillars];
    const bVal = sortKey === 'rank' ? (b.rank ?? 99) : b.pillars[sortKey as keyof typeof b.pillars];
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  function colHeader(key: SortKey, label: string, align: 'left' | 'center' | 'right' = 'left') {
    const active = sortKey === key;
    const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
    return (
      <th
        key={key}
        className={`
          px-3 py-2 font-mono text-[15px] uppercase tracking-widest cursor-pointer
          hover:text-rust transition-colors select-none ${alignClass}
          ${active ? 'text-rust' : 'text-ink'}
        `}
        tabIndex={0}
        onClick={() => handleSort(key)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSort(key); }}
        aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
        scope="col"
      >
        {label} {active ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    );
  }

  return (
    <section className="space-y-4" aria-label="Site ranking table">
      
      {/* Tier filter */}
      <div className="flex mb-6 font-mono text-[17px]">
        <ToggleGroup.Root
          type="single"
          value={filter}
          onValueChange={(v) => { if (v) setFilter(v as FilterValue); }}
          className="flex gap-2"
          aria-label="Filter by tier"
        >
          {TIER_FILTERS.map(({ value, label }) => (
            <ToggleGroup.Item
              key={value}
              value={value}
              className={`
                border border-inkSoft px-6 py-2 uppercase tracking-widest transition-colors
                data-[state=on]:bg-rust data-[state=on]:text-paper data-[state=on]:border-rust
                data-[state=off]:text-inkSoft data-[state=off]:hover:bg-ink/5 cursor-pointer
              `}
              aria-label={`Filter by ${label}`}
            >
              {label}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>

      {/* Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse text-sm" aria-label="Reader Respect Rankings">
          <thead>
            <tr className="border-b-2 border-ink">
              {colHeader('rank', 'Rank #')}
              <th className="px-3 py-2 font-mono text-[15px] uppercase tracking-widest text-left text-ink" scope="col">Publication</th>
              {colHeader('intrusion',     'Intrusion', 'center')}
              {colHeader('privacy',       'Privacy', 'center')}
              {colHeader('performance',   'Performance', 'center')}
              {colHeader('accessibility', 'Accessibility', 'center')}
              <th className="px-3 py-2 font-mono text-[15px] uppercase tracking-widest text-center text-ink" scope="col">Overall</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((site, i) => (
              <tr
                key={site.siteId}
                className={`
                  border-b border-ink/15 transition-colors
                  hover:bg-ink/5 ${TIER_ROW_CLASS[site.overallGrade.tier] ?? ''}
                  ${i % 2 === 1 ? 'bg-paper/30' : ''}
                `}
              >
                <td className="px-3 py-4 font-mono text-xs text-inkSoft w-16">{site.rank}</td>
                <td className="px-3 py-4 min-w-[300px]">
                  <div>
                    <a href={site.siteUrl} target="_blank" rel="noopener noreferrer" className="font-body font-bold text-ink text-sm hover:text-rust transition-colors hover:underline">
                      {site.siteName}
                    </a>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`font-mono text-[15px] ${
                        site.attentionTax === 'Severe' || site.attentionTax === 'High' ? 'text-rust' :
                        site.attentionTax === 'Moderate' ? 'text-brass' : 'text-ledger'
                      }`}>
                        {site.attentionTax} tax
                      </span>
                      <span className="text-inkSoft/30">•</span>
                      <Link href={`/scorecard/${site.siteId}`} className="font-mono text-[15px] tracking-widest uppercase text-rust hover:underline">
                        SCORECARD →
                      </Link>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 font-mono text-xs font-bold text-center" style={{ color: `var(--color-${site.pillarGrades.intrusion.colour})` }}>
                  {Number(site.pillars.intrusion.toFixed(2))}
                </td>
                <td className="px-3 py-4 font-mono text-xs font-bold text-center" style={{ color: `var(--color-${site.pillarGrades.privacy.colour})` }}>
                  {Number(site.pillars.privacy.toFixed(2))}
                </td>
                <td className="px-3 py-4 font-mono text-xs font-bold text-center" style={{ color: `var(--color-${site.pillarGrades.performance.colour})` }}>
                  {Number(site.pillars.performance.toFixed(2))}
                </td>
                <td className="px-3 py-4 font-mono text-xs font-bold text-center" style={{ color: `var(--color-${site.pillarGrades.accessibility.colour})` }}>
                  {Number(site.pillars.accessibility.toFixed(2))}
                </td>
                <td className="px-3 py-4 w-24">
                  <div className="flex justify-center">
                    <GradeStamp grade={site.overallGrade} size="sm" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
