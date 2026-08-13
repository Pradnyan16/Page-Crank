/**
 * browser.ts — Mobile Chrome browser context factory
 *
 * WHY: Every scan must be identical in environment so scores are comparable
 * across sites. A fixed device profile (Pixel 5), connection throttle,
 * and fresh context (no cookies, no storage) are the lab conditions that
 * make Page Crank results reproducible and defensible.
 */

import { type BrowserContext, type Browser } from 'playwright';
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());

// Pixel 5 viewport — 393×851 is the most common mid-range Android screen
// used in Lighthouse mobile audits. Matches what real readers use.
const MOBILE_VIEWPORT = { width: 393, height: 851 };

// Chrome 124 Android UA — matches the Pixel 5 device profile in DevTools
const MOBILE_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 11; Pixel 5) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0.0.0 Mobile Safari/537.36';

// 3G Fast throttling — as defined in Chrome DevTools Network presets.
// Deliberately not WiFi: reader-hostile patterns are most visible on slower
// connections where page weight and layout shifts hurt most.
const NETWORK_CONDITIONS = {
  offline: false,
  downloadThroughput: (1.5 * 1024 * 1024) / 8,  // 1.5 Mbps
  uploadThroughput: (750 * 1024) / 8,             // 750 Kbps
  latency: 40,                                     // 40ms RTT
};

export interface MobileContextOptions {
  /** Suppress browser UI output — set false for local debugging */
  headless?: boolean;
}

export interface MobileBrowserSession {
  browser: Browser;
  context: BrowserContext;
  /** Call this to close browser and context cleanly after the scan */
  close: () => Promise<void>;
}

/**
 * Creates a fresh Playwright browser context emulating a Pixel 5 on 3G Fast.
 * No cookies, no localStorage, no auth — every scan is a clean anonymous visit.
 */
export async function createMobileSession(
  options: MobileContextOptions = {},
): Promise<MobileBrowserSession> {
  const { headless = false } = options;

  const browser = await chromium.launch({
    headless,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      // Disable the GPU for headless — avoids crashes in CI environments
      '--disable-gpu',
      '--remote-debugging-port=9222',
    ],
  });

  const context = await browser.newContext({
    viewport: MOBILE_VIEWPORT,
    userAgent: MOBILE_USER_AGENT,
    deviceScaleFactor: 2.75,  // Pixel 5 device pixel ratio
    isMobile: true,
    hasTouch: true,
    locale: 'en-US',
    timezoneId: 'America/New_York',  // US geography as per methodology
    // Fresh session — no prior cookies, no auth state
    storageState: undefined,
  });

  // Apply network throttling via Chrome DevTools Protocol
  const cdpSession = await context.newCDPSession(await context.newPage().then(async (p) => {
    await p.close();
    return context.pages()[0] ?? await context.newPage();
  }));

  // We'll apply throttling per-page via CDP in the scan orchestrator instead,
  // since CDPSession is page-scoped. This factory provides the clean context.
  await cdpSession.detach();

  const close = async (): Promise<void> => {
    await context.close();
    await browser.close();
  };

  return { browser, context, close };
}

/**
 * Applies 3G Fast network throttling to a specific CDP session.
 * Called per-page in scan.ts after opening each new page.
 */
export async function applyNetworkThrottle(
  context: BrowserContext,
  pageIndex: number,
): Promise<void> {
  const pages = context.pages();
  const page = pages[pageIndex];
  if (!page) return;

  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.emulateNetworkConditions', NETWORK_CONDITIONS);
  await cdp.detach();
}

export { MOBILE_VIEWPORT, MOBILE_USER_AGENT };
