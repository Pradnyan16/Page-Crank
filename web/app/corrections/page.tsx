import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Corrections & Appeals — Page Crank',
  description: 'How publishers can dispute a score or request a rescan.',
};

export default function CorrectionsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">
      <header className="border-b-4 border-double border-ink pb-6">
        <h1 className="font-display text-4xl mb-4">Corrections & Appeals</h1>
        <p className="font-body text-lg italic text-inkSoft">
          How to dispute a score or request a rescan.
        </p>
      </header>
      
      <section className="space-y-4">
        <p className="font-body text-sm leading-relaxed">
          Page Crank is an automated, objective benchmark. However, the web is complex, and automated tools can occasionally misinterpret a site's structure.
        </p>
        
        <h2 className="font-display text-2xl border-b border-ink/20 pb-2 mt-8">Requesting a Rescan</h2>
        <p className="font-body text-sm leading-relaxed">
          If your publication has recently pushed an update that significantly improves the reader experience (e.g., removing a third-party ad network, optimizing layout shifts, or overhauling cookie consent), you may request a mid-cycle rescan.
        </p>
        <p className="font-body text-sm leading-relaxed">
          Rescans are processed at our discretion and are generally limited to one per quarter per publication.
        </p>

        <h2 className="font-display text-2xl border-b border-ink/20 pb-2 mt-8">Filing a Dispute</h2>
        <p className="font-body text-sm leading-relaxed">
          If you believe the scanner incorrectly penalized your site due to a technical error on our end (e.g., classifying a first-party analytics tool as a third-party tracker, or misreading a standard UI element as an intrusive overlay), you can file a dispute.
        </p>
        <p className="font-body text-sm leading-relaxed">
          Please provide specific evidence, such as the exact network request or DOM element in question. If the dispute is valid, we will issue a correction and update the score in the current edition.
        </p>
      </section>
    </main>
  );
}
