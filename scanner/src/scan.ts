/**
 * scan.ts — Page Crank scanner entry point (Phase 2 complete)
 *
 * Orchestrates: mobile Chrome session → network logging → screenshots →
 * consent detection → overlay detection → media detection → Lighthouse →
 * blocklist matching → timestamped raw.json output.
 *
 * Each run is idempotent: timestamped output directory, nothing overwrites.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createMobileSession, MOBILE_VIEWPORT, MOBILE_USER_AGENT } from './capture/browser.js';
import { attachNetworkLogger, summariseRequests } from './capture/network.js';
import { captureFullSequence } from './capture/screenshots.js';
import { detectConsent } from './capture/consent.js';
import { detectOverlays } from './capture/overlays.js';
import { detectMedia } from './capture/media.js';
import { runLighthouse } from './audits/lighthouse.js';
import { loadAllBlocklists } from './blocklists/fetch.js';
import { buildParsedBlocklists, matchRequests } from './blocklists/match.js';
import type {
  SiteConfig, RawScan, PageScan, PageRole, ScanEnvironment,
} from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITES_FILE = path.join(ROOT, 'sites.json');
const OUTPUT_DIR = path.join(ROOT, 'output');
const SCANNER_VERSION = '0.2.0';

// 3G Fast network conditions (applied per-page via CDP)
const NETWORK_CONDITIONS = {
  offline: false,
  downloadThroughput: (1.5 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
  latency: 40,
};

function getSiteFilter(): string | null {
  const idx = process.argv.indexOf('--site');
  return idx !== -1 ? (process.argv[idx + 1] ?? null) : null;
}

async function scanPage(
  context: import('playwright').BrowserContext,
  url: string,
  role: PageRole,
  siteId: string,
  screenshotDir: string,
): Promise<PageScan> {
  const page = await context.newPage();
  const pageStart = Date.now();
  const captureErrors: string[] = [];

  // Apply 3G Fast throttle directly — cleaner than going through browser.ts
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.emulateNetworkConditions', NETWORK_CONDITIONS);
  await cdp.detach();

  const getRequests = attachNetworkLogger(page, siteId);

  console.log(`\n  → ${role}: ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    captureErrors.push(`navigation: ${msg}`);
    console.warn(`    ⚠️  Navigation: ${msg}`);
  }

  // Screenshot sequence + consent/overlay/media detection run after load
  const [screenshots, consent, overlays, media] = await Promise.all([
    captureFullSequence(page, { outputDir: screenshotDir, siteId, pageRole: role })
      .catch((e) => { captureErrors.push(`screenshots: ${String(e)}`); return []; }),
    detectConsent(page)
      .catch((e) => { captureErrors.push(`consent: ${String(e)}`); return null; }),
    detectOverlays(page)
      .catch((e) => { captureErrors.push(`overlays: ${String(e)}`); return null; }),
    detectMedia(page)
      .catch((e) => { captureErrors.push(`media: ${String(e)}`); return null; }),
  ]);

  const requests = getRequests();
  const summary = summariseRequests(requests);

  if (consent?.detected) {
    console.log(`    🍪 Consent: ${consent.cmpName ?? 'unknown'} · ${consent.viewportCoveragePercent}% viewport · asymmetric: ${consent.asymmetric}`);
  }
  if (overlays && overlays.fixedElementCount > 0) {
    console.log(`    📌 Overlays: ${overlays.fixedElementCount} fixed, ${overlays.stickyElementCount} sticky · max coverage ${overlays.maxViewportCoveragePercent}%`);
  }
  if (media?.autoplayVideoDetected) {
    console.log(`    📹 Autoplay video detected`);
  }

  console.log(`    ✓ ${requests.length} requests · ${(summary.totalBytes / 1024).toFixed(0)}KB · ${summary.thirdParty} third-party · ${Date.now() - pageStart}ms`);

  await page.close();

  return {
    url, role,
    totalBytes: summary.totalBytes,
    requestCount: requests.length,
    requests,
    screenshots,
    consent,
    overlays,
    media,
    lighthouse: null,   // filled in after page closes (below)
    blocklist: null,    // filled in after blocklist matching (below)
    scannedAt: new Date().toISOString(),
    durationMs: Date.now() - pageStart,
    captureErrors,
  };
}

async function scanSite(
  site: SiteConfig,
  blocklists: ReturnType<typeof buildParsedBlocklists>,
): Promise<void> {
  const runStartedAt = new Date().toISOString();
  const timestamp = runStartedAt.replace(/[:.]/g, '-').slice(0, 19);
  const siteOutputDir = path.join(OUTPUT_DIR, site.id, timestamp);
  const screenshotDir = path.join(siteOutputDir, 'screenshots');
  await fs.mkdir(siteOutputDir, { recursive: true });

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📰 Scanning: ${site.name}`);
  console.log(`${'─'.repeat(60)}`);

  const { browser, context, close } = await createMobileSession({ headless: true });

  const environment: ScanEnvironment = {
    device: 'Pixel 5',
    userAgent: MOBILE_USER_AGENT,
    viewport: MOBILE_VIEWPORT,
    networkThrottle: '3G Fast',
    geography: 'US',
    consentState: 'pre-consent',
  };

  const pages: PageScan[] = [];

  try {
    const homePage = await scanPage(context, site.url, 'homepage', site.id, screenshotDir);
    pages.push(homePage);

    // Run Lighthouse against homepage using the same browser's CDP port
    console.log(`\n  🔦 Running Lighthouse...`);
    const lhResult = await runLighthouse(site.url, browser).catch((e) => {
      console.warn(`  ⚠️  Lighthouse failed: ${String(e)}`);
      return null;
    });
    if (lhResult && pages[0]) {
      pages[0].lighthouse = lhResult;
      console.log(`  ✓ Perf: ${lhResult.performanceScore} · A11y: ${lhResult.accessibilityScore} · LCP: ${lhResult.lcp}ms · CLS: ${lhResult.cls}`);
    }
  } finally {
    await close();
  }

  // Blocklist matching runs after browser closes — pure data operation
  for (const pg of pages) {
    pg.blocklist = matchRequests(pg.requests, blocklists);
    const bl = pg.blocklist;
    console.log(`  🚫 Trackers: ${bl.trackerRequestCount} requests · ${bl.adDomains.length} ad domains · ${bl.trackerDomains.length} tracker domains`);
  }

  const runCompletedAt = new Date().toISOString();
  const outputPath = path.join(siteOutputDir, 'raw.json');

  const rawScan: RawScan = {
    scannerVersion: SCANNER_VERSION,
    site, environment,
    runStartedAt, runCompletedAt,
    pages,
    outputPath: path.relative(OUTPUT_DIR, outputPath),
  };

  await fs.writeFile(outputPath, JSON.stringify(rawScan, null, 2), 'utf-8');
  const totalMs = Date.now() - new Date(runStartedAt).getTime();
  console.log(`\n  ✅ ${site.name} done in ${(totalMs / 1000).toFixed(1)}s`);
}

async function main(): Promise<void> {
  const rawSites = JSON.parse(await fs.readFile(SITES_FILE, 'utf-8')) as SiteConfig[];
  const siteFilter = getSiteFilter();
  const sites = siteFilter ? rawSites.filter((s) => s.id === siteFilter) : rawSites;

  if (sites.length === 0) {
    console.error(`No sites matched: "${siteFilter}". IDs: ${rawSites.map((s) => s.id).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🗞️  Page Crank Scanner v${SCANNER_VERSION}`);

  // Download blocklists once — shared across all site scans
  console.log(`\n📋 Loading blocklists...`);
  const { easylist, easyprivacy } = await loadAllBlocklists();
  const blocklists = buildParsedBlocklists(easylist, easyprivacy);
  console.log(`  ✓ ${blocklists.adDomains.size} ad domains · ${blocklists.trackerDomains.size} tracker domains`);

  for (const site of sites) {
    await scanSite(site, blocklists);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ All scans complete → ${path.relative(process.cwd(), OUTPUT_DIR)}/`);
  console.log(`${'═'.repeat(60)}\n`);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
