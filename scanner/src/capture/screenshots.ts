/**
 * screenshots.ts — Screenshot orchestration
 *
 * WHY: Screenshots are the primary evidence record — they let human reviewers
 * verify what the scanner actually saw, catch bot-detection responses, and
 * document what the reader experiences at each scroll depth. Timed and
 * scroll-based moments together capture both the initial burden (popups,
 * overlays) and the reading experience (ad density mid-article).
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Page } from 'playwright';
import type { ScreenshotMoment, ScreenshotRecord } from '../types.js';

export interface ScreenshotOptions {
  /** Absolute path to the directory where screenshots will be saved */
  outputDir: string;
  /** Site ID used as filename prefix */
  siteId: string;
  /** Page role used as filename prefix */
  pageRole: string;
}

/**
 * Takes a screenshot at a named moment and saves it to the output directory.
 * Returns a ScreenshotRecord suitable for inclusion in the PageScan output.
 */
export async function takeScreenshot(
  page: Page,
  moment: ScreenshotMoment,
  options: ScreenshotOptions,
): Promise<ScreenshotRecord> {
  await fs.mkdir(options.outputDir, { recursive: true });

  const filename = `${options.siteId}__${options.pageRole}__${moment}.png`;
  const absolutePath = path.join(options.outputDir, filename);

  await page.screenshot({
    path: absolutePath,
    fullPage: false,  // Viewport-only — captures what the reader actually sees
    type: 'png',
  });

  const record: ScreenshotRecord = {
    moment,
    path: path.relative(process.cwd(), absolutePath),
    takenAt: new Date().toISOString(),
  };

  console.log(`  📸 ${moment} → ${filename}`);
  return record;
}

/**
 * Runs the full screenshot sequence for one page:
 * 1. On DOMContentLoaded (first paint state)
 * 2. After 3s wait (ads and overlays have rendered)
 * 3. At 25%, 50%, 75% scroll depths
 * 4. At the very bottom of the page
 *
 * The page is scrolled smoothly to simulate real reading behaviour,
 * then returned to the top after capture.
 */
export async function captureFullSequence(
  page: Page,
  options: ScreenshotOptions,
): Promise<ScreenshotRecord[]> {
  const records: ScreenshotRecord[] = [];

  // ── 1. DOMContentLoaded state ────────────────────────────────────────────
  // Wait for the DOM to be ready but before all resources load.
  // This shows the reader's first visual impression.
  await page.waitForLoadState('domcontentloaded');
  records.push(await takeScreenshot(page, 'domcontentloaded', options));

  // ── 2. After load + 3s settle ────────────────────────────────────────────
  // Third-party ad scripts typically inject within 1–3s of load. Waiting
  // here catches popups, sticky headers, and banner ads in their final state.
  await page.waitForLoadState('load');
  await page.waitForTimeout(3000);
  records.push(await takeScreenshot(page, 'after-load', options));

  // ── 3. Scroll-depth screenshots ──────────────────────────────────────────
  // Scroll to each depth, wait for lazy-loaded content, screenshot.
  // Smooth scroll simulates a real reader — triggers lazy-load logic.
  const scrollDepths: Array<{ depth: number; moment: ScreenshotMoment }> = [
    { depth: 0.25, moment: 'scroll-25' },
    { depth: 0.50, moment: 'scroll-50' },
    { depth: 0.75, moment: 'scroll-75' },
    { depth: 1.00, moment: 'scroll-bottom' },
  ];

  for (const { depth, moment } of scrollDepths) {
    await scrollToDepth(page, depth);
    // Brief pause so lazy-loaded ads and images can render
    await page.waitForTimeout(800);
    records.push(await takeScreenshot(page, moment, options));
  }

  // Return page to top — important if subsequent consent detection runs next
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));

  return records;
}

/**
 * Scrolls the page to a fractional depth (0.0 = top, 1.0 = bottom).
 * Uses smooth scrolling to trigger IntersectionObserver-based lazy loaders.
 */
async function scrollToDepth(page: Page, depth: number): Promise<void> {
  await page.evaluate((targetDepth: number) => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const targetY = Math.round(maxScroll * targetDepth);
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }, depth);

  // Allow scroll animation to complete and content to paint
  await page.waitForTimeout(600);
}
