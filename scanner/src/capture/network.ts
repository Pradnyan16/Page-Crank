/**
 * network.ts — Network request logger and third-party classifier
 *
 * WHY: Raw network data is the most objective evidence of reader cost —
 * every tracker domain, every byte, every third-party call is a measurable
 * burden imposed on the reader. Capturing the full request list before any
 * blocklist matching lets us separate "what happened" from "how bad is it",
 * keeping scoring logic in scoring/ not here.
 */

import type { Page, Request, Response } from 'playwright';
import type { NetworkRequest, ResourceType } from '../types.js';

/**
 * Attaches request/response listeners to a page and returns a function
 * to retrieve all captured requests once navigation is complete.
 *
 * Usage:
 *   const getRequests = attachNetworkLogger(page, 'nytimes.com');
 *   await page.goto(url);
 *   await page.waitForLoadState('networkidle');
 *   const requests = getRequests();
 */
export function attachNetworkLogger(
  page: Page,
  targetDomain: string,
): () => NetworkRequest[] {
  const navStart = Date.now();

  // Keyed by request URL — responses update the same entry
  const requestMap = new Map<string, NetworkRequest>();
  // Track response timing and size separately since they arrive after request
  const responseData = new Map<string, { status: number; size: number; endTime: number }>();

  page.on('request', (request: Request) => {
    const url = request.url();
    // Skip data URIs — not meaningful for scoring
    if (url.startsWith('data:')) return;

    const initiatorDomain = extractDomain(request.frame()?.url() ?? '');
    const requestDomain = extractDomain(url);

    // Compare registrable domains (eTLD+1) so cdn.site.com isn't flagged as
    // third-party to site.com — we want to detect genuinely external origins
    const isThirdParty =
      requestDomain !== null &&
      targetDomain !== null &&
      getRegistrableDomain(requestDomain) !== getRegistrableDomain(targetDomain);


    const record: NetworkRequest = {
      url,
      method: request.method(),
      resourceType: normaliseResourceType(request.resourceType()),
      initiatorDomain,
      isThirdParty,
      status: null,
      responseSize: null,
      durationMs: null,
      // isTracker is set to false here; blocklist matching runs in Phase 2
      isTracker: false,
      requestedAt: new Date().toISOString(),
    };

    requestMap.set(url, record);
  });

  page.on('response', async (response: Response) => {
    const url = response.url();
    if (url.startsWith('data:')) return;

    const endTime = Date.now();
    let size = 0;

    try {
      // Content-Length header is faster than body(); fall back to body length
      const contentLength = response.headers()['content-length'];
      if (contentLength !== undefined) {
        size = parseInt(contentLength, 10);
      } else {
        const body = await response.body().catch(() => Buffer.alloc(0));
        size = body.length;
      }
    } catch {
      // Some responses (redirects, preflights) have no body — that's fine
      size = 0;
    }

    responseData.set(url, {
      status: response.status(),
      size,
      endTime,
    });
  });

  // Returns a snapshot of all captured requests, merged with response data
  return (): NetworkRequest[] => {
    const results: NetworkRequest[] = [];

    for (const [url, record] of requestMap) {
      const resp = responseData.get(url);
      results.push({
        ...record,
        status: resp?.status ?? null,
        responseSize: resp?.size ?? null,
        durationMs: resp !== undefined ? resp.endTime - navStart : null,
      });
    }

    return results;
  };
}

/**
 * Extracts the registrable domain from a URL string.
 * Returns null if the URL is invalid or has no hostname.
 */
function extractDomain(url: string): string | null {
  try {
    const { hostname } = new URL(url);
    // Strip leading "www." so "www.nytimes.com" matches "nytimes.com"
    return hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Returns the eTLD+1 (registrable domain) of a hostname.
 * e.g. "assets.guim.co.uk" → "guim.co.uk", "cdn.nytimes.com" → "nytimes.com"
 *
 * Simple heuristic: take the last 2 parts for .com/.net/.org,
 * last 3 for known two-part ccTLDs (.co.uk, .com.au, etc.)
 * This covers all 5 prototype sites without needing a full PSL library.
 */
function getRegistrableDomain(hostname: string): string {
  const parts = hostname.split('.');
  const twoPartTLDs = new Set(['co.uk', 'com.au', 'co.nz', 'co.jp', 'org.uk', 'me.uk', 'net.au']);
  if (parts.length >= 3) {
    const lastTwo = parts.slice(-2).join('.');
    if (twoPartTLDs.has(lastTwo)) {
      return parts.slice(-3).join('.');
    }
  }
  return parts.slice(-2).join('.');
}


/**
 * Normalises Playwright's resource type string to our ResourceType union.
 * Playwright occasionally returns types not in our union — map those to 'other'.
 */
function normaliseResourceType(raw: string): ResourceType {
  const allowed: ResourceType[] = [
    'document', 'stylesheet', 'image', 'media', 'font', 'script',
    'texttrack', 'xhr', 'fetch', 'eventsource', 'websocket', 'manifest', 'other',
  ];
  return (allowed as string[]).includes(raw) ? (raw as ResourceType) : 'other';
}

/**
 * Summarises a request array for quick console logging during scans.
 */
export function summariseRequests(requests: NetworkRequest[]): {
  total: number;
  thirdParty: number;
  totalBytes: number;
  byType: Record<string, number>;
} {
  const byType: Record<string, number> = {};
  let totalBytes = 0;
  let thirdParty = 0;

  for (const r of requests) {
    byType[r.resourceType] = (byType[r.resourceType] ?? 0) + 1;
    totalBytes += r.responseSize ?? 0;
    if (r.isThirdParty) thirdParty++;
  }

  return { total: requests.length, thirdParty, totalBytes, byType };
}
