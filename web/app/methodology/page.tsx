import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Methodology — Page Crank',
  description: 'How we score the Reader Respect Index.',
};

export default function MethodologyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">
      <header className="border-b-4 border-double border-ink pb-6">
        <h1 className="font-display text-4xl mb-4">Methodology</h1>
        <p className="font-body text-lg italic text-inkSoft">
          How we measure the hidden cost of reading the news.
        </p>
      </header>
      
      <section className="space-y-4">
        <h2 className="font-display text-2xl border-b border-ink/20 pb-2">The Lab Environment</h2>
        <p className="font-body text-sm leading-relaxed">
          Every site is evaluated inside a headless Chromium browser running Playwright. The browser emulates a Pixel 5 smartphone connected via a throttled 3G Fast network profile. We originate the requests from a US-based IP address with no prior cookies or login state (a clean "pre-consent" profile).
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-2xl border-b border-ink/20 pb-2">The Four Pillars</h2>
        
        <div className="space-y-2">
          <h3 className="font-mono text-xs uppercase tracking-widest text-ink">Intrusion (30%)</h3>
          <p className="font-body text-sm leading-relaxed">
            Measures visual disruption. We deduct points for full-screen cookie consent walls, modal overlays, autoplaying video or audio, and sticky headers that consume more than 20% of the mobile viewport. Extra penalties apply for "dark patterns" (e.g., an Accept button is present, but Reject is hidden).
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-mono text-xs uppercase tracking-widest text-ink">Privacy (30%)</h3>
          <p className="font-body text-sm leading-relaxed">
            Measures non-consensual tracking. We cross-reference every network request against the community-maintained EasyList and EasyPrivacy blocklists. Sites are penalized heavily if they fire advertising or tracking pixels before the reader has clicked "Accept" on a consent banner.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-mono text-xs uppercase tracking-widest text-ink">Performance (20%)</h3>
          <p className="font-body text-sm leading-relaxed">
            Derived directly from a programmatic Lighthouse performance audit. We measure Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and Total Blocking Time (TBT).
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-mono text-xs uppercase tracking-widest text-ink">Accessibility (20%)</h3>
          <p className="font-body text-sm leading-relaxed">
            Derived from the Lighthouse accessibility audit. Measures critical WCAG violations that prevent screen readers, keyboard users, and low-vision readers from consuming the content.
          </p>
        </div>
      </section>
    </main>
  );
}
