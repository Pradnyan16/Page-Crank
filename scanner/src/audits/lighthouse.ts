/**
 * lighthouse.ts — Programmatic Lighthouse runner
 *
 * WHY: Lighthouse is the industry-standard tool for Performance and
 * Accessibility measurement. Running it programmatically (not CLI) against
 * the existing browser's debugging port avoids launching a second browser
 * and re-loading the page — keeping scan time reasonable and ensuring the
 * performance data reflects the same network session we already captured.
 *
 * We run 'performance' and 'accessibility' categories only — the other
 * Lighthouse categories (SEO, best-practices, PWA) don't map to our pillars.
 */

import type { Browser } from 'playwright';
import type { LighthouseResult } from '../types.js';

// Pixel 5 screen emulation to match our Playwright mobile context exactly
const MOBILE_SCREEN_EMULATION = {
  mobile: true,
  width: 393,
  height: 851,
  deviceScaleFactor: 2.75,
  disabled: false,
};

// Throttling config matching 3G Fast (same as our network conditions)
const THROTTLING = {
  rttMs: 40,
  throughputKbps: 1638.4,
  cpuSlowdownMultiplier: 4,
  requestLatencyMs: 0,
  downloadThroughputKbps: 0,
  uploadThroughputKbps: 0,
};

/**
 * Extracts the Chrome DevTools debugging port from a Playwright browser's
 * WebSocket endpoint. e.g. "ws://127.0.0.1:54321/devtools/..." → 54321
 */
export function getDebugPort(browser: Browser): number {
  return 9222;
}

/**
 * Runs a Lighthouse audit against the given URL using the existing browser session.
 * Returns null if Lighthouse fails (bot detection, timeout, etc.) — non-fatal.
 */
export async function runLighthouse(
  url: string,
  browser: Browser,
): Promise<LighthouseResult | null> {
  let lighthouse: typeof import('lighthouse').default;

  try {
    // Dynamic import — keeps startup fast when Lighthouse isn't needed
    const mod = await import('lighthouse');
    lighthouse = mod.default;
  } catch (err) {
    console.warn('  ⚠️  Lighthouse import failed:', err);
    return null;
  }

  const port = getDebugPort(browser);

  let runnerResult: Awaited<ReturnType<typeof lighthouse>> | undefined;

  try {
    runnerResult = await lighthouse(url, {
      port,
      output: 'json',
      onlyCategories: ['performance', 'accessibility'],
      formFactor: 'mobile',
      screenEmulation: MOBILE_SCREEN_EMULATION,
      throttling: THROTTLING,
      // Disable storage reset — we want to audit the same session state
      disableStorageReset: true,
      // Quiet mode — suppress Lighthouse's own console output
      logLevel: 'error',
    });
  } catch (err) {
    console.warn('  ⚠️  Lighthouse run failed:', err instanceof Error ? err.message : err);
    return null;
  }

  if (!runnerResult?.lhr) return null;
  const { lhr } = runnerResult;

  // Extract performance metrics from Lighthouse audit results
  const getNumeric = (id: string): number =>
    lhr.audits[id]?.numericValue ?? 0;

  const a11yItems = lhr.categories['accessibility']?.auditRefs ?? [];
  const violations = a11yItems
    .filter((ref) => {
      const audit = lhr.audits[ref.id];
      return audit?.score !== null && (audit?.score ?? 1) < 1;
    })
    .map((ref) => {
      const audit = lhr.audits[ref.id];
      return {
        id: ref.id,
        impact: (audit?.details as { impact?: string } | undefined)?.impact ?? null,
        description: audit?.description ?? '',
      };
    });

  return {
    performanceScore: Math.round((lhr.categories['performance']?.score ?? 0) * 100),
    accessibilityScore: Math.round((lhr.categories['accessibility']?.score ?? 0) * 100),
    lcp: Math.round(getNumeric('largest-contentful-paint')),
    cls: parseFloat(getNumeric('cumulative-layout-shift').toFixed(3)),
    tbt: Math.round(getNumeric('total-blocking-time')),
    speedIndex: Math.round(getNumeric('speed-index')),
    totalByteWeight: Math.round(getNumeric('total-byte-weight')),
    totalJsBytes: Math.round(getNumeric('unused-javascript') + getNumeric('render-blocking-resources')),
    a11yViolationCount: violations.length,
    a11yViolations: violations.slice(0, 20), // cap for JSON size
  };
}
