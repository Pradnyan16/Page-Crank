/**
 * scanner-types.ts — Re-exports scanner types for use in scoring package.
 *
 * Scoring is intentionally a separate package from scanning so weights can be
 * recalibrated without touching scanner code. This shim lets scoring import
 * the shared interfaces without a monorepo workspace link in Phase 1–3.
 * Phase 4+ can replace with a proper workspace reference.
 */

export type {
  PageScan,
  RawScan,
  SiteConfig,
  NetworkRequest,
  ConsentResult,
  OverlayResult,
  MediaResult,
  LighthouseResult,
  BlocklistResult,
  GradeTier,
} from '../../scanner/src/types.js';
