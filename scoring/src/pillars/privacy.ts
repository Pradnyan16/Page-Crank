/**
 * privacy.ts — Privacy pillar scoring
 *
 * Measures third-party tracking burden: tracker domains, ad networks,
 * analytics pixels. Uses blocklist match results from Phase 2.
 * Lower tracker counts = higher privacy score.
 */

import type { PageScan } from '../../scanner-types.js';
import { clamp, mapRange } from '../grade.js';

export function scorePrivacy(pages: PageScan[]): number {
  let totalTrackerDomains = 0;
  let totalAdDomains = 0;
  let totalAnalyticsDomains = 0;
  let consentBeforeTracking = false;

  for (const page of pages) {
    if (!page.blocklist) continue;
    totalTrackerDomains += page.blocklist.trackerDomains.length;
    totalAdDomains += page.blocklist.adDomains.length;
    totalAnalyticsDomains += page.blocklist.analyticsDomains.length;

    // If consent was present but tracking still fired, that's a violation
    if (page.consent?.detected && page.blocklist.trackerRequestCount > 0) {
      consentBeforeTracking = true;
    }
  }

  const pageCount = Math.max(pages.length, 1);
  const avgAdDomains = totalAdDomains / pageCount;
  const avgTrackerDomains = totalTrackerDomains / pageCount;
  const avgAnalytics = totalAnalyticsDomains / pageCount;

  // Map tracker counts to score penalties (logarithmic — first trackers hurt most)
  // 0 ad domains = no penalty, 20+ = full penalty
  const adPenalty = mapRange(Math.min(avgAdDomains, 20), 0, 20, 0, 40);
  // 0 tracker domains = no penalty, 15+ = full penalty
  const trackerPenalty = mapRange(Math.min(avgTrackerDomains, 15), 0, 15, 0, 30);
  // Analytics: smaller penalty — some first-party analytics is expected
  const analyticsPenalty = mapRange(Math.min(avgAnalytics, 10), 0, 10, 0, 15);
  // Consent-before-tracking dark pattern
  const consentPenalty = consentBeforeTracking ? 15 : 0;

  return clamp(100 - adPenalty - trackerPenalty - analyticsPenalty - consentPenalty);
}
