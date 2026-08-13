/**
 * Shared TypeScript interfaces for the Page Crank scanner.
 * All scan data shapes are defined here — scored separately in /scoring.
 */

// ── Site config ─────────────────────────────────────────────────────────────

export type GradeTier = 'good' | 'mid' | 'bad';

export interface SiteConfig {
  id: string;
  name: string;
  url: string;
  domain: string;
  category: string;
  expectedTier: GradeTier;
}

// ── Network ─────────────────────────────────────────────────────────────────

export type ResourceType =
  | 'document'
  | 'stylesheet'
  | 'image'
  | 'media'
  | 'font'
  | 'script'
  | 'texttrack'
  | 'xhr'
  | 'fetch'
  | 'eventsource'
  | 'websocket'
  | 'manifest'
  | 'other';

export interface NetworkRequest {
  url: string;
  method: string;
  resourceType: ResourceType;
  /** Initiator domain — helps identify third-party origins */
  initiatorDomain: string | null;
  /** Whether this request is to a domain other than the scanned site */
  isThirdParty: boolean;
  status: number | null;
  /** Response body size in bytes, null if not available */
  responseSize: number | null;
  /** Time from navigation start to response end, ms */
  durationMs: number | null;
  /** True if the request matched a blocklist rule (set in Phase 2) */
  isTracker: boolean;
  requestedAt: string; // ISO timestamp
}

// ── Screenshots ──────────────────────────────────────────────────────────────

export type ScreenshotMoment =
  | 'domcontentloaded'   // First paint — before ads/overlays
  | 'after-load'         // 3s after load — ads rendered
  | 'after-consent'      // After cookie banner screenshot (Phase 2)
  | 'scroll-25'          // 25% scroll depth
  | 'scroll-50'          // 50% scroll depth
  | 'scroll-75'          // 75% scroll depth
  | 'scroll-bottom';     // Bottom of page

export interface ScreenshotRecord {
  moment: ScreenshotMoment;
  path: string;          // Relative path inside the scan output directory
  takenAt: string;       // ISO timestamp
}

// ── Page scan ────────────────────────────────────────────────────────────────

export type PageRole = 'homepage' | 'article-1' | 'article-2';

// ── Phase 2 results ──────────────────────────────────────────────────────────

export interface ConsentResult {
  /** True if any consent/cookie banner was detected */
  detected: boolean;
  /** Identified CMP vendor name, null if unknown */
  cmpName: string | null;
  /** The CSS selector that matched the banner */
  selectorMatched: string | null;
  /** Estimated % of viewport the banner occupies (0–100) */
  viewportCoveragePercent: number;
  /** True if an Accept/Yes button was found */
  hasAcceptButton: boolean;
  /** True if a Reject/No button was found */
  hasRejectButton: boolean;
  /**
   * True if the reject option is harder to reach than accept
   * (e.g. reject is smaller, hidden, or requires extra clicks).
   * This is a scoring signal for the Privacy pillar.
   */
  asymmetric: boolean;
}

export interface OverlayElement {
  tagName: string;
  id: string;
  className: string;
  /** Estimated % of viewport covered by this element */
  viewportCoveragePercent: number;
  position: 'fixed' | 'sticky';
}

export interface OverlayResult {
  fixedElementCount: number;
  stickyElementCount: number;
  /** Maximum viewport coverage of any single overlay element */
  maxViewportCoveragePercent: number;
  /** Top overlaying elements for evidence */
  elements: OverlayElement[];
}

export interface MediaResult {
  autoplayVideoDetected: boolean;
  autoplayAudioDetected: boolean;
  /** Total number of video elements on the page */
  videoCount: number;
  /** True if a video was actively playing at capture time */
  videoPlayingOnLoad: boolean;
}

export interface LighthouseResult {
  /** Lighthouse performance score 0–100 */
  performanceScore: number;
  /** Lighthouse accessibility score 0–100 */
  accessibilityScore: number;
  /** Largest Contentful Paint, ms */
  lcp: number;
  /** Cumulative Layout Shift score */
  cls: number;
  /** Total Blocking Time, ms */
  tbt: number;
  /** Speed Index score */
  speedIndex: number;
  /** Total page byte weight across all resources */
  totalByteWeight: number;
  /** Total JavaScript byte weight */
  totalJsBytes: number;
  /** Number of accessibility violations detected */
  a11yViolationCount: number;
  a11yViolations: Array<{
    id: string;
    impact: string | null;
    description: string;
  }>;
}

export interface BlocklistResult {
  /** Number of requests that matched a blocklist rule */
  trackerRequestCount: number;
  /** Unique third-party domains that matched blocklist rules */
  trackerDomains: string[];
  /** Domains matched as advertising/ad networks */
  adDomains: string[];
  /** Domains matched as analytics/tracking */
  analyticsDomains: string[];
}

// ── Page scan ────────────────────────────────────────────────────────────────

export interface PageScan {
  url: string;
  role: PageRole;
  /** Total page weight in bytes across all resources */
  totalBytes: number;
  /** Number of network requests fired */
  requestCount: number;
  requests: NetworkRequest[];
  screenshots: ScreenshotRecord[];
  consent: ConsentResult | null;
  overlays: OverlayResult | null;
  media: MediaResult | null;
  /** Lighthouse runs once per site (homepage), null on article pages */
  lighthouse: LighthouseResult | null;
  blocklist: BlocklistResult | null;
  /** ISO timestamp when this page scan began */
  scannedAt: string;
  /** Wall-clock duration for the full page scan, ms */
  durationMs: number;
  /** Any non-fatal errors encountered during capture */
  captureErrors: string[];
}

// ── Raw scan output ──────────────────────────────────────────────────────────

export interface ScanEnvironment {
  device: string;           // e.g. "Pixel 5"
  userAgent: string;
  viewport: { width: number; height: number };
  networkThrottle: string;  // e.g. "3G Fast"
  geography: string;        // e.g. "US"
  consentState: 'pre-consent' | 'post-consent-reject' | 'post-consent-accept';
}

export interface RawScan {
  /** Semver of the scanner that produced this file — for schema migrations */
  scannerVersion: string;
  site: SiteConfig;
  environment: ScanEnvironment;
  /** ISO timestamp for when the full scan run began */
  runStartedAt: string;
  /** ISO timestamp for when the full scan run ended */
  runCompletedAt: string;
  pages: PageScan[];
  /** Path to this file, relative to the output/ directory */
  outputPath: string;
}
