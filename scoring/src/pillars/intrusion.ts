/**
 * intrusion.ts — Intrusion pillar scoring
 *
 * Measures the burden placed on the reader through popups, overlays,
 * autoplay, and consent friction. Starts at 100, deducts for each signal.
 * Weights are tunable without touching the scanner.
 */

import type { PageScan } from '../../scanner-types.js';
import { clamp } from '../grade.js';

export function scoreIntrusion(pages: PageScan[]): number {
  let score = 100;

  for (const page of pages) {
    const { consent, overlays, media } = page;

    // Consent banner: presence costs points, asymmetry (dark pattern) costs more
    if (consent?.detected) {
      score -= 5;
      if (consent.asymmetric) score -= 10;
      // High viewport coverage = modal/full-screen takeover
      if (consent.viewportCoveragePercent > 60) score -= 8;
      else if (consent.viewportCoveragePercent > 30) score -= 4;
    }

    // Overlays: fixed elements covering significant viewport are intrusive
    if (overlays) {
      score -= Math.min(overlays.fixedElementCount * 2, 10);
      if (overlays.maxViewportCoveragePercent > 50) score -= 15;
      else if (overlays.maxViewportCoveragePercent > 20) score -= 8;
    }

    // Autoplay media: severe intrusion — steals audio/bandwidth without consent
    if (media?.autoplayVideoDetected) score -= 15;
    if (media?.autoplayAudioDetected) score -= 12;
    if (media?.videoPlayingOnLoad) score -= 5; // additional deduction if actually playing
  }

  // Average across pages so multi-page scans don't over-penalise
  return clamp(pages.length > 0 ? score / pages.length + score * (1 - 1 / pages.length) : score);
}
