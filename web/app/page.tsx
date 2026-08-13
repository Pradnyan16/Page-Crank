import { getLatestEdition, rankSites } from '@/lib/data';
import Ticker from '@/components/Ticker';
import RankingTable from '@/components/RankingTable';
import SiteCardGrid from '@/components/SiteCardGrid';
import Scorecard from '@/components/Scorecard';
import PillarsExplainer from '@/components/PillarsExplainer';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Crank — The Reader Respect Index',
  description: 'An independent benchmark measuring what major news publications cost their readers.',
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const raw = await getLatestEdition();
  const edition = rankSites(raw);

  // Best & Worst (3 good, 3 bad)
  const best = edition.sites.slice(0, 3);
  const worst = edition.sites.slice(-3).reverse();
  
  // Table preview (top 10)
  const top10 = edition.sites.slice(0, 10);
  
  // Featured scorecard
  const featured = edition.sites[0]!;

  return (
    <main className="w-full">
      
      {/* 2. Masthead (Huge H1 + Eyebrow + Tagline) */}
      <div className="text-center py-12 px-6 border-t border-ink border-b-8 border-double border-ink">
        <div className="font-mono text-xs sm:text-sm md:text-base uppercase tracking-[0.2em] sm:tracking-[0.4em] text-ink mb-6">
          Established for the reader, not the advertiser
        </div>
        <h1 className="flex justify-center m-0">
          <Image
            src="/pagecrank-logo.png"
            alt="PAGE CRANK"
            width={800}
            height={80}
            className="mix-blend-multiply h-12 sm:h-16 md:h-20 w-auto object-contain"
            priority
          />
        </h1>
        <div className="font-mono text-xs sm:text-sm md:text-base uppercase tracking-[0.2em] sm:tracking-[0.4em] text-ink mt-6">
          The Reader Respect Index
        </div>
      </div>

      {/* 3. Ticker Wrap */}
      <div className="border-b-8 border-double border-ink py-2 overflow-hidden whitespace-nowrap">
        <Ticker sites={edition.sites} />
      </div>

      {/* Main Content Wrapper (Full Width) */}
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 pb-20">

        {/* 4. Hero Summary */}
        <div className="text-center py-12">
          <div className="inline-block font-mono text-[15px] uppercase tracking-[1.5px] text-rust mb-4">
            Latest Edition — {edition.volume}
          </div>
          <h2 className="font-mono text-lg md:text-xl lg:text-2xl uppercase tracking-[0.2em] my-3 text-ink leading-relaxed">
            {edition.sites.length} news sites, graded on how they treat you
          </h2>
          <p className="font-mono text-xs md:text-sm uppercase tracking-[0.1em] text-inkSoft max-w-3xl mx-auto leading-relaxed mt-4">
            Popups, trackers, load times, and clutter — measured the same way, across every publisher, every month.
          </p>
        </div>

        {/* 5. Best & Worst This Edition */}
        <div className="font-display text-2xl tracking-wide border-b-[5px] border-ink pb-2 mb-6 mt-8">
          Best &amp; Worst This Edition
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          {/* Best */}
          <div>
            <h4 className="font-mono text-[17px] uppercase tracking-[1.5px] text-ledger mb-4">Most respectful</h4>
            {best.map(site => (
              <div key={site.siteId} className="flex justify-between items-center py-2 border-b border-ink/15 font-mono text-sm">
                <span className="font-body font-bold text-ink">{site.siteName}</span>
                <span className={`font-display text-sm px-2 py-px border-2 text-${site.overallGrade.colour} border-${site.overallGrade.colour}`}>
                  {site.overallGrade.letter}
                </span>
              </div>
            ))}
          </div>
          
          {/* Worst */}
          <div>
            <h4 className="font-mono text-[17px] uppercase tracking-[1.5px] text-rust mb-4">Most demanding</h4>
            {worst.map(site => (
              <div key={site.siteId} className="flex justify-between items-center py-2 border-b border-ink/15 font-mono text-sm">
                <span className="font-body font-bold text-ink">{site.siteName}</span>
                <span className={`font-display text-sm px-2 py-px border-2 text-${site.overallGrade.colour} border-${site.overallGrade.colour}`}>
                  {site.overallGrade.letter}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 7. This Week's Ranking */}
        <div className="font-display text-2xl tracking-wide border-b-[5px] border-ink pb-2 mb-5 mt-16">
          This Week's Ranking
        </div>
        

        
        <RankingTable sites={top10} />
        
        <div className="text-center mt-4 mb-16">
          <Link href="/rankings" className="font-mono text-[17px] text-rust tracking-widest uppercase hover:underline">
            VIEW FULL RANKING — ALL {edition.sites.length} SITES →
          </Link>
        </div>

        {/* Site Card Grid (NEW) */}
        <div className="font-display text-2xl tracking-wide border-b-[5px] border-ink pb-2 mb-6 mt-16">
          Site Cards
        </div>
        <SiteCardGrid sites={edition.sites.slice(0, 12)} />

        {/* 8. Featured Scorecard */}
        <div className="font-display text-2xl tracking-wide border-b-[5px] border-ink pb-2 mb-6 mt-8">
          Featured Scorecard
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center max-w-6xl mx-auto bg-paperDark border border-ink/35 p-8 md:p-12">
          <div>
            <div className="inline-block border-2 border-rust text-rust font-display text-xs uppercase tracking-widest px-2 py-1 mb-4">
              Deep Dive
            </div>
            <h3 className="font-display text-3xl md:text-4xl mb-4 leading-tight">Inside the {featured.siteName} Score</h3>
            <p className="font-mono text-sm text-inkSoft mb-6 leading-[1.8]">
              We break down every publication into four core pillars. For our featured scorecard, we take a closer look at the actual run-time metrics driving the overall grade—from third-party tracker counts to raw layout shifts.
            </p>
            <Link href={`/scorecard/${featured.siteId}`} className="inline-block border border-ink bg-ink text-paper px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-paper hover:text-ink transition-colors">
              Read the full report →
            </Link>
          </div>
          <div className="relative">
            {/* We reuse the dense Scorecard component which has progress bars */}
            <Scorecard site={featured} rank={featured.rank || 1} animateStamp={true} />
          </div>
        </div>

        {/* 9. Pillars Explainer */}
        <div className="font-display text-2xl tracking-wide border-b-[5px] border-ink pb-2 mb-6 mt-16">
          What We Measure
        </div>
        
        <PillarsExplainer />

      </div>
    </main>
  );
}
