/**
 * consent.ts — Cookie/consent banner detector
 *
 * WHY: The consent banner is one of the most measurable forms of reader
 * intrusion. We detect it objectively (selector match + viewport coverage)
 * rather than relying on human judgement. The asymmetry check — whether
 * reject is harder to reach than accept — is a key Privacy pillar signal
 * that CMP dark patterns create measurable friction for readers.
 *
 * Phase 2: detection + screenshot only. Active rejection clicking is Phase 3.
 */

import type { Page } from 'playwright';
import type { ConsentResult } from '../types.js';

// Known CMP (Consent Management Platform) selectors in priority order.
const CMP_SELECTORS: Array<{ name: string; selector: string }> = [
  { name: 'OneTrust',     selector: '#onetrust-consent-sdk, #onetrust-banner-sdk' },
  { name: 'Cookiebot',    selector: '#CybotCookiebotDialog, #cookiebanner' },
  { name: 'Sourcepoint',  selector: '[id^="sp_message_container"], .sp_choice_type_ACCEPT_ALL' },
  { name: 'Quantcast',    selector: '.qc-cmp2-container, [class*="qc-cmp"]' },
  { name: 'TrustArc',     selector: '#truste-consent-content, .truste_overlay' },
  { name: 'Didomi',       selector: '#didomi-popup, .didomi-consent-popup' },
  { name: 'Usercentrics', selector: '[data-testid="uc-banner"]' },
  { name: 'Generic',      selector: '[id*="cookie-banner"], [id*="consent-banner"], [class*="cookie-consent"], [class*="cookie-notice"]' },
];

const ACCEPT_SELECTORS = [
  '[id*="accept"], [class*="accept"]',
  'button[id*="agree"], button[class*="agree"]',
  '.sp_choice_type_ACCEPT_ALL',
].join(', ');

const REJECT_SELECTORS = [
  '[id*="reject"], [class*="reject"]',
  'button[id*="decline"], button[class*="decline"]',
  '[aria-label*="Reject"], [aria-label*="Decline"]',
  '.sp_choice_type_REJECT_ALL',
].join(', ');

export async function detectConsent(page: Page): Promise<ConsentResult> {
  for (const { name, selector } of CMP_SELECTORS) {
    const element = page.locator(selector).first();
    const isVisible = await element.isVisible().catch(() => false);
    if (!isVisible) continue;

    const bbox = await element.boundingBox().catch(() => null);
    const viewportSize = page.viewportSize();
    let viewportCoveragePercent = 0;

    if (bbox && viewportSize) {
      const visibleH = Math.min(bbox.y + bbox.height, viewportSize.height) - Math.max(bbox.y, 0);
      const visibleW = Math.min(bbox.x + bbox.width, viewportSize.width) - Math.max(bbox.x, 0);
      const area = Math.max(0, visibleH) * Math.max(0, visibleW);
      viewportCoveragePercent = Math.round(
        (area / (viewportSize.width * viewportSize.height)) * 100,
      );
    }

    const hasAcceptButton = await page.locator(ACCEPT_SELECTORS).first().isVisible().catch(() => false);
    const hasRejectButton = await page.locator(REJECT_SELECTORS).first().isVisible().catch(() => false);
    // Asymmetric: accept prominent but no visible reject = dark pattern
    const asymmetric = hasAcceptButton && !hasRejectButton;

    return {
      detected: true,
      cmpName: name,
      selectorMatched: selector,
      viewportCoveragePercent,
      hasAcceptButton,
      hasRejectButton,
      asymmetric,
    };
  }

  return {
    detected: false,
    cmpName: null,
    selectorMatched: null,
    viewportCoveragePercent: 0,
    hasAcceptButton: false,
    hasRejectButton: false,
    asymmetric: false,
  };
}
