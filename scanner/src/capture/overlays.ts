/**
 * overlays.ts — Fixed and sticky element detector
 *
 * WHY: Sticky headers, fixed banners, and modal overlays directly obstruct
 * the reading area. By injecting JS to measure getComputedStyle on all
 * positioned elements, we get an objective, pixel-accurate measurement of
 * how much viewport real-estate is being consumed by non-content elements.
 * This is the core "Intrusion" pillar signal.
 */

import type { Page } from 'playwright';
import type { OverlayElement, OverlayResult } from '../types.js';

// Minimum viewport coverage % to be worth recording — filters out tiny badges
const MIN_COVERAGE_THRESHOLD = 2;
// Maximum elements to include in output to keep JSON manageable
const MAX_ELEMENTS_RECORDED = 20;

/**
 * Scans all DOM elements for fixed/sticky positioning and measures how much
 * viewport area they consume. Runs entirely via injected JavaScript so there
 * is no reliance on Playwright-specific element handles for performance.
 */
export async function detectOverlays(page: Page): Promise<OverlayResult> {
  const viewportSize = page.viewportSize() ?? { width: 393, height: 851 };

  const rawElements = await page.evaluate(
    ({ vpWidth, vpHeight, minCoverage }: { vpWidth: number; vpHeight: number; minCoverage: number }) => {
      const results: Array<{
        tagName: string;
        id: string;
        className: string;
        viewportCoveragePercent: number;
        position: 'fixed' | 'sticky';
      }> = [];

      // Query all elements — use querySelectorAll for performance over TreeWalker
      const all = document.querySelectorAll<HTMLElement>('*');

      for (const el of all) {
        const style = window.getComputedStyle(el);
        const pos = style.position;

        if (pos !== 'fixed' && pos !== 'sticky') continue;
        // Skip invisible elements
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        if (parseFloat(style.opacity) === 0) continue;

        const rect = el.getBoundingClientRect();
        // Only measure elements that overlap the current viewport
        if (rect.bottom <= 0 || rect.top >= vpHeight) continue;
        if (rect.right <= 0 || rect.left >= vpWidth) continue;

        const visibleH = Math.min(rect.bottom, vpHeight) - Math.max(rect.top, 0);
        const visibleW = Math.min(rect.right, vpWidth) - Math.max(rect.left, 0);
        const coverage = Math.round((visibleH * visibleW) / (vpWidth * vpHeight) * 100);

        if (coverage < minCoverage) continue;

        results.push({
          tagName: el.tagName.toLowerCase(),
          id: el.id ?? '',
          className: (el.className ?? '').toString().slice(0, 80),
          viewportCoveragePercent: coverage,
          position: pos as 'fixed' | 'sticky',
        });
      }

      // Sort by coverage descending so the most intrusive elements come first
      results.sort((a, b) => b.viewportCoveragePercent - a.viewportCoveragePercent);
      return results;
    },
    { vpWidth: viewportSize.width, vpHeight: viewportSize.height, minCoverage: MIN_COVERAGE_THRESHOLD },
  );

  const elements: OverlayElement[] = rawElements.slice(0, MAX_ELEMENTS_RECORDED);
  const fixedElements = elements.filter((e) => e.position === 'fixed');
  const stickyElements = elements.filter((e) => e.position === 'sticky');
  const maxCoverage = elements[0]?.viewportCoveragePercent ?? 0;

  return {
    fixedElementCount: fixedElements.length,
    stickyElementCount: stickyElements.length,
    maxViewportCoveragePercent: maxCoverage,
    elements,
  };
}
