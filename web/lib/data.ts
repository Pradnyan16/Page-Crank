/**
 * lib/data.ts — Data loader for the web app
 * Reads from the scored JSON produced by scoring/src/score.ts.
 * Falls back to mock data during development.
 *
 * PRODUCTION NOTE: scores.json is stored at web/public/data/scores.json
 * so that it is accessible on Vercel (filesystem reads only work within
 * the project directory). After each daily scan, run_daily_scan.sh copies
 * the fresh scores here and pushes to GitHub so Vercel redeploys.
 */

import type { Edition, ScoredSite } from './types';
import mockData from './mock-data.json';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export async function getLatestEdition(): Promise<Edition> {
  try {
    // Reads from web/public/data/scores.json — inside the project dir,
    // so this works both locally and on Vercel.
    const scoresPath = path.resolve(process.cwd(), 'public/data/scores.json');
    const content = await fs.readFile(scoresPath, 'utf-8');
    const sites = JSON.parse(content) as ScoredSite[];

    // Determine the scan date from the first site's scoredAt timestamp
    const scanDate = sites[0]?.scoredAt
      ? new Date(sites[0].scoredAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'Aug 2026';

    return {
      editionLabel: scanDate,
      volume: 'Vol. I — No. 1',
      category: '50 Most-Visited English News Sites',
      publishedAt: sites[0]?.scoredAt ?? new Date().toISOString(),
      sites,
    };
  } catch {
    // Fall back to mock data if no real scan has been run yet
    return mockData as Edition;
  }
}

export function getSiteById(edition: Edition, siteId: string) {
  return edition.sites.find((s) => s.siteId === siteId) ?? null;
}

/** Sorts sites by overall score descending and assigns ranks */
export function rankSites(edition: Edition): Edition {
  const ranked = [...edition.sites]
    .sort((a, b) => b.overallScore - a.overallScore)
    .map((site, i) => ({ ...site, rank: i + 1 }));
  return { ...edition, sites: ranked };
}
