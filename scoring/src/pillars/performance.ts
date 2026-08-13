/**
 * performance.ts — Performance pillar scoring
 *
 * Primarily uses the Lighthouse performance score (0–100) as the base.
 * Falls back to network-based estimates (page weight, request count)
 * when Lighthouse results are unavailable.
 */

import type { PageScan } from '../../scanner-types.js';
import { clamp, mapRange } from '../grade.js';

export function scorePerformance(pages: PageScan[]): number {
  const homepage = pages.find((p) => p.role === 'homepage');

  // Use Lighthouse score directly if available — it's the authoritative signal
  if (homepage?.lighthouse?.performanceScore !== undefined) {
    return clamp(homepage.lighthouse.performanceScore);
  }

  // Fallback: estimate from page weight and request count
  const totalBytes = pages.reduce((sum, p) => sum + p.totalBytes, 0) / Math.max(pages.length, 1);
  const requestCount = pages.reduce((sum, p) => sum + p.requestCount, 0) / Math.max(pages.length, 1);

  // > 5MB total = very poor, < 500KB = excellent
  const weightPenalty = mapRange(Math.min(totalBytes, 5_000_000), 0, 5_000_000, 0, 50);
  // > 200 requests = very poor, < 20 = excellent
  const requestPenalty = mapRange(Math.min(requestCount, 200), 0, 200, 0, 30);

  return clamp(100 - weightPenalty - requestPenalty);
}
