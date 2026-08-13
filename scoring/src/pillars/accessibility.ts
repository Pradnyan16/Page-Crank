/**
 * accessibility.ts — Accessibility pillar scoring
 *
 * Uses the Lighthouse accessibility score directly.
 * A11y is a binary signal — either things work for everyone, or they don't.
 * We report the violation count but the Lighthouse score is the primary signal.
 */

import type { PageScan } from '../../scanner-types.js';
import { clamp } from '../grade.js';

export function scoreAccessibility(pages: PageScan[]): number {
  const homepage = pages.find((p) => p.role === 'homepage');

  if (homepage?.lighthouse?.accessibilityScore !== undefined) {
    return clamp(homepage.lighthouse.accessibilityScore);
  }

  // Without Lighthouse we cannot reliably score accessibility — return null signal
  // scored as 50 (neutral) rather than 0 (penalised) or 100 (assumed good)
  return 50;
}
