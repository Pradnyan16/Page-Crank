/**
 * blocklists/match.ts — Adblock filter rule matcher
 *
 * WHY: Matching requests against EasyList/EasyPrivacy gives us an objective,
 * community-maintained signal for tracker detection rather than a hand-curated
 * list. We parse only domain-level blocking rules (||domain.com^) and simple
 * URL substring rules — the most reliable patterns for our use case.
 * Element hiding rules (##) are irrelevant for network-level measurement.
 */

import type { NetworkRequest, BlocklistResult } from '../types.js';

export interface ParsedBlocklists {
  /** Compiled set of registrable domains from EasyList (ads) */
  adDomains: Set<string>;
  /** Compiled set of registrable domains from EasyPrivacy (trackers) */
  trackerDomains: Set<string>;
  /** Raw URL substring rules (partial path matching) */
  urlRules: string[];
}

/**
 * Parses EasyList/EasyPrivacy filter text into lookup structures.
 * Only processes domain-blocking rules (||domain.com^) and URL rules.
 * Ignores element-hiding rules (##), comments (!), and options we don't use.
 */
export function parseBlocklist(text: string): { domains: Set<string>; urlRules: string[] } {
  const domains = new Set<string>();
  const urlRules: string[] = [];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();

    // Skip comments, empty lines, element hiding rules, and whitelist rules
    if (!trimmed || trimmed.startsWith('!') || trimmed.includes('##') || trimmed.startsWith('@@')) {
      continue;
    }

    // Domain-level block: ||domain.com^ or ||domain.com/
    const domainMatch = trimmed.match(/^\|\|([a-z0-9][a-z0-9._-]+\.[a-z]{2,})[/^]/);
    if (domainMatch?.[1]) {
      domains.add(domainMatch[1].toLowerCase());
      continue;
    }

    // Simple URL substring rules (no special chars) — used for path matching
    if (!trimmed.startsWith('|') && !trimmed.includes('$') && trimmed.length > 8 && trimmed.length < 100) {
      urlRules.push(trimmed.toLowerCase());
    }
  }

  return { domains, urlRules };
}

/**
 * Builds a combined lookup structure from both blocklists.
 */
export function buildParsedBlocklists(easylist: string, easyprivacy: string): ParsedBlocklists {
  const ad = parseBlocklist(easylist);
  const tracker = parseBlocklist(easyprivacy);

  return {
    adDomains: ad.domains,
    trackerDomains: tracker.domains,
    urlRules: [...ad.urlRules, ...tracker.urlRules],
  };
}

/**
 * Extracts registrable domain from a hostname (eTLD+1).
 */
function getRegistrableDomain(hostname: string): string {
  const parts = hostname.split('.');
  const twoPartTLDs = new Set(['co.uk', 'com.au', 'co.nz', 'co.jp', 'org.uk']);
  if (parts.length >= 3 && twoPartTLDs.has(parts.slice(-2).join('.'))) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

/**
 * Matches a list of network requests against parsed blocklists.
 * Updates the `isTracker` flag on matching requests in place.
 * Returns a BlocklistResult summary for the PageScan.
 */
export function matchRequests(
  requests: NetworkRequest[],
  blocklists: ParsedBlocklists,
): BlocklistResult {
  const trackerDomains = new Set<string>();
  const adDomains = new Set<string>();
  const analyticsDomains = new Set<string>();
  let trackerRequestCount = 0;

  for (const req of requests) {
    let hostname = '';
    try {
      hostname = new URL(req.url).hostname.replace(/^www\./, '');
    } catch {
      continue;
    }

    const registrable = getRegistrableDomain(hostname);
    const urlLower = req.url.toLowerCase();

    const isAd = blocklists.adDomains.has(hostname) || blocklists.adDomains.has(registrable);
    const isTracker = blocklists.trackerDomains.has(hostname) || blocklists.trackerDomains.has(registrable);
    const urlMatch = !isAd && !isTracker && blocklists.urlRules.some((rule) => urlLower.includes(rule));

    if (isAd || isTracker || urlMatch) {
      req.isTracker = true;
      trackerRequestCount++;

      if (isAd) adDomains.add(registrable);
      else if (isTracker) analyticsDomains.add(registrable);
      else trackerDomains.add(registrable);
    }
  }

  return {
    trackerRequestCount,
    trackerDomains: [...trackerDomains],
    adDomains: [...adDomains],
    analyticsDomains: [...analyticsDomains],
  };
}
