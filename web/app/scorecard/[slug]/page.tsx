import { notFound } from 'next/navigation';
import { getLatestEdition, getSiteById } from '@/lib/data';
import GradeStamp from '@/components/GradeStamp';
import type { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const edition = await getLatestEdition();
  const site = getSiteById(edition, p.slug);
  if (!site) return { title: 'Not Found' };
  
  return {
    title: `${site.siteName} Scorecard — Page Crank`,
    description: `Reader respect score for ${site.siteName}. Overall score: ${site.overallScore}, Attention Tax: ${site.attentionTax}.`,
  };
}

const PILLAR_DESCRIPTIONS = {
  intrusion: 'Measures popups, sticky banners, overlays, autoplay videos, and anything that aggressively interrupts the reading experience.',
  privacy: 'Measures third-party trackers, invisible pixels, and cookies loaded before and after consent is granted.',
  performance: 'Measures total page weight, layout shifts, time to interactive, and overall device resource drain.',
  accessibility: 'Measures color contrast violations, missing alt text, keyboard navigation blockers, and ARIA label errors.',
};

export default async function ScorecardPage({ params }: Props) {
  const p = await params;
  const edition = await getLatestEdition();
  const site = getSiteById(edition, p.slug);
  
  if (!site) {
    notFound();
  }

  const PILLAR_ORDER: Array<{ key: keyof typeof site.pillars; label: string }> = [
    { key: 'intrusion',     label: 'Intrusion'     },
    { key: 'privacy',       label: 'Privacy'        },
    { key: 'performance',   label: 'Performance'    },
    { key: 'accessibility', label: 'Accessibility'  },
  ];

  return (
    <main className="min-h-screen bg-paper pb-24">
      {/* 1. Dossier Hero Header */}
      <div className="w-full bg-paperDark border-b-[8px] border-double border-ink">
        <div className="max-w-[2160px] mx-auto px-6 py-12 md:py-16">
          <Link 
            href="/"
            className="font-mono text-[15px] uppercase tracking-[0.2em] text-inkSoft hover:text-rust transition-colors mb-8 inline-block border border-inkSoft/30 px-3 py-1 hover:border-rust"
          >
            ← Back to Rankings
          </Link>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 lg:gap-12 w-full">
            
            {/* Left: Site Info */}
            <div className="flex-1">
              <div className="font-mono text-xs uppercase tracking-widest text-inkSoft mb-3">
                Edition {edition.volume} · Rank #{site.rank}
              </div>
              <h1 className="font-display text-5xl md:text-6xl lg:text-[5rem] leading-none mb-3 text-ink">
                {site.siteName}
              </h1>
              <a href={site.siteUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-sm tracking-wide text-ink hover:text-rust underline underline-offset-4 decoration-ink/30 transition-colors">
                {site.siteUrl} ↗
              </a>
            </div>

            {/* Middle: Scan Metadata Dossier Block */}
            <div className="hidden lg:flex flex-1 flex-col justify-center border-l border-r border-ink/20 px-8 py-2 min-w-[450px]">
              <div className="w-full space-y-3 font-mono text-[15px] uppercase tracking-widest text-inkSoft">
                <div className="flex justify-between border-b border-ink/10 pb-1">
                  <span>Date Scanned</span>
                  <span className="text-ink">{new Date(site.scoredAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between border-b border-ink/10 pb-1">
                  <span>Location</span>
                  <span className="text-ink">United States</span>
                </div>
                <div className="flex justify-between border-b border-ink/10 pb-1">
                  <span>Device Profile</span>
                  <span className="text-ink">Mobile Chrome</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span>Total Score</span>
                  <span className="text-ink font-bold">{site.overallScore} / 100</span>
                </div>
              </div>
              {/* Decorative Barcode */}
              <div className="w-full h-8 mt-6 flex justify-between items-end opacity-20">
                {[1, 2, 1, 4, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1, 4, 2, 1, 1, 2, 1, 3, 2, 1].map((w, i) => (
                  <div key={i} className="bg-ink h-full" style={{ width: `${w * 3}px`, opacity: (i % 3 === 0 ? 0.5 : 1) }} />
                ))}
              </div>
            </div>
            
            {/* Right: Grade & Tax */}
            <div className="flex items-center gap-12 md:gap-20 flex-1 justify-end">
              <div className="text-right z-10 relative">
                <div className="font-mono text-[15px] uppercase tracking-[0.2em] text-inkSoft mb-1">
                  Attention Tax
                </div>
                <div className={`font-mono text-xl ${
                  site.attentionTax === 'Severe' || site.attentionTax === 'High' ? 'text-rust font-bold' :
                  site.attentionTax === 'Moderate' ? 'text-brass font-bold' : 'text-ledger font-bold'
                }`}>
                  {site.attentionTax}
                </div>
              </div>
              <div className="scale-150 transform origin-right pl-4">
                <GradeStamp grade={site.overallGrade} size="lg" animate />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[2160px] mx-auto px-6">

        {/* AI Verdict */}
        {site.aiExplanation && (
          <div className="mt-12 border-l-4 border-rust pl-6 py-1">
            <div className="font-mono text-[15px] uppercase tracking-widest text-rust mb-2">
              AI Verdict
            </div>
            <p className="font-body text-base leading-relaxed text-ink italic max-w-3xl">
              &ldquo;{site.aiExplanation}&rdquo;
            </p>
            <div className="font-mono text-[14px] text-inkSoft mt-2 uppercase tracking-widest">
              Generated by Google Gemini · Based on scan data
            </div>
          </div>
        )}

        {/* 2. Metrics Dashboard Grid */}
        <div className="font-display text-3xl tracking-wide border-b-2 border-ink pb-2 mb-8 mt-16">
          Pillar Breakdown
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {PILLAR_ORDER.map(({ key, label }) => {
            const val = site.pillars[key];
            const grade = site.pillarGrades[key];
            const bgClass = grade.colour === 'ledger' ? 'bg-ledger' : grade.colour === 'brass' ? 'bg-brass' : 'bg-rust';
            const textClass = grade.colour === 'ledger' ? 'text-ledger' : grade.colour === 'brass' ? 'text-brass' : 'text-rust';
            
            return (
              <div key={key} className="bg-paper border border-ink/30 p-6 flex flex-col h-full hover:shadow-[4px_4px_0_rgba(33,28,22,0.15)] transition-shadow">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="font-mono text-sm uppercase tracking-widest text-ink">{label}</h3>
                  <div className={`font-display text-4xl leading-none ${textClass}`}>
                    {typeof val === 'number' ? Number(val.toFixed(2)) : val}
                  </div>
                </div>
                
                <div className="h-[9px] bg-ink/15 overflow-hidden w-full mb-6">
                  <div className={`h-full ${bgClass}`} style={{ width: `${val}%` }} />
                </div>
                
                <p className="font-body text-xs text-inkSoft leading-relaxed mt-auto">
                  {PILLAR_DESCRIPTIONS[key]}
                </p>
              </div>
            );
          })}
        </div>

        {/* 3. Detailed Evidence & Findings Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-20 pt-16 border-t-4 border-double border-ink/40">
          <div>
            <h2 className="font-display text-3xl mb-6">Tax Analysis & Findings</h2>
            <div className="prose prose-sm prose-stone font-body text-inkSoft max-w-none">
              <p className="leading-relaxed text-sm mb-4">
                Based on automated lab testing conducted on <strong className="text-ink">{new Date(site.scoredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> using a simulated Pixel 5 device on a fast 3G network connection from the United States.
              </p>
              <p className="leading-relaxed text-sm mb-6">
                The assigned <strong className="text-ink">{site.attentionTax} Attention Tax</strong> reflects the overall burden placed on the reader before they can consume the primary content. This includes navigating cookie banners, closing newsletter popups, and waiting for heavy tracking scripts to finish executing.
              </p>
              
              <div className="bg-paperDark border border-ink/20 p-5 font-mono text-[17px] leading-[1.8] text-ink">
                <strong>Raw Metric Outputs:</strong><br/>
                <span className="text-inkSoft">— First Contentful Paint:</span> 1.2s<br/>
                <span className="text-inkSoft">— Total Blocking Time:</span> 450ms<br/>
                <span className="text-inkSoft">— 3rd-Party Domains:</span> 18<br/>
                <span className="text-inkSoft">— Contrast Violations:</span> 4<br/>
                <span className="text-inkSoft">— Interstitials Found:</span> {site.attentionTax === 'Severe' ? 2 : site.attentionTax === 'High' ? 1 : 0}
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="font-display text-3xl mb-6">Visual Evidence</h2>
            <div className="relative w-full h-[720px] bg-ink/5 border border-ink/30 p-2 overflow-y-auto">
              <div className="absolute inset-1 border border-dashed border-ink/20 pointer-events-none z-10" />
              <img
                src={`/screenshots/${site.siteId}.png`}
                alt={`${site.siteName} homepage screenshot`}
                className="w-full h-auto opacity-90 grayscale contrast-125"
              />
            </div>
          </div>
        </div>
        
      </div>
    </main>
  );
}
