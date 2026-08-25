import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Page Crank — The Reader Respect Index',
  description:
    'An independent benchmark measuring how respectfully major news websites treat their visitors. Scores for intrusion, privacy, performance, and accessibility.',
  keywords: ['web benchmarking', 'reader experience', 'privacy', 'ad blocking', 'news websites'],
  openGraph: {
    title: 'Page Crank — The Reader Respect Index',
    description: 'Ranking the web by how it treats you.',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

import { getLatestEdition } from '@/lib/data';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { Analytics } from '@vercel/analytics/react';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const edition = await getLatestEdition();

  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Nav edition={edition} />
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
