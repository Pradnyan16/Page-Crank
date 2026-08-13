import { getLatestEdition, rankSites } from '@/lib/data';
import RankingTable from '@/components/RankingTable';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Full Rankings — Page Crank',
  description: 'The complete Reader Respect Index rankings.',
};

export const dynamic = 'force-dynamic';

export default async function RankingsPage() {
  const raw = await getLatestEdition();
  const edition = rankSites(raw);

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-12 border-b-2 border-double border-ink pb-6">
        <h1 className="font-display text-4xl mb-3">The Reader Respect Index</h1>
        <p className="font-body text-inkSoft">
          Showing all {edition.sites.length} sites in {edition.category}.
        </p>
      </header>

      <RankingTable sites={edition.sites} />
    </main>
  );
}
