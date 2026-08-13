import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reports & Archive — Page Crank',
  description: 'Past editions and annual reports for the Reader Respect Index.',
};

export default function ReportsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">
      <header className="border-b-4 border-double border-ink pb-6">
        <h1 className="font-display text-4xl mb-4">Reports & Archive</h1>
        <p className="font-body text-lg italic text-inkSoft">
          Past editions, historical data, and annual retrospectives.
        </p>
      </header>
      
      <section className="space-y-4">
        <div className="border border-ink/20 p-6 bg-paperDark text-center">
          <p className="font-mono text-[15px] uppercase tracking-widest text-inkSoft">
            No Archives Yet
          </p>
          <p className="font-body text-sm mt-2">
            This is the inaugural edition of Page Crank. Past reports will appear here as they are published.
          </p>
        </div>
      </section>
    </main>
  );
}
