/**
 * score.ts — Main scoring entry point
 *
 * Pure function: RawScan → ScoredResult. No I/O, no side effects.
 * Run from CLI to score a raw JSON file, or import as a library.
 *
 * Usage: npx tsx src/score.ts path/to/raw.json
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// Load .env from scoring directory
config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

import { gradeScore } from './grade.js';
import { scoreIntrusion } from './pillars/intrusion.js';
import { scorePrivacy } from './pillars/privacy.js';
import { scorePerformance } from './pillars/performance.js';
import { scoreAccessibility } from './pillars/accessibility.js';
import { generateExplanation } from './explain.js';
import type { RawScan } from './scanner-types.js';
import type { GradeResult } from './grade.js';

// ── Output types ─────────────────────────────────────────────────────────────

export interface PillarScores {
  intrusion: number;
  privacy: number;
  performance: number;
  accessibility: number;
}

export interface ScoredResult {
  siteId: string;
  siteName: string;
  siteUrl: string;
  scannerVersion: string;
  runStartedAt: string;
  /** Pillar scores 0–100 each */
  pillars: PillarScores;
  /** Graded results for each pillar */
  pillarGrades: {
    intrusion: GradeResult;
    privacy: GradeResult;
    performance: GradeResult;
    accessibility: GradeResult;
  };
  /** Weighted overall Reader Respect Score */
  overallScore: number;
  overallGrade: GradeResult;
  /**
   * Attention Tax label — qualitative summary of total reader burden.
   * Derived from intrusion + privacy combined.
   */
  attentionTax: 'Low' | 'Moderate' | 'High' | 'Severe';
  /** ISO timestamp of when this score was computed */
  scoredAt: string;
  /** AI-generated human-readable explanation of the score */
  aiExplanation?: string;
}

// ── Weights (must sum to 1.0) ─────────────────────────────────────────────────

const WEIGHTS = {
  intrusion:     0.30,
  privacy:       0.30,
  performance:   0.20,
  accessibility: 0.20,
} as const;

function getAttentionTax(intrusion: number, privacy: number): ScoredResult['attentionTax'] {
  const combined = (intrusion + privacy) / 2;
  if (combined >= 80) return 'Low';
  if (combined >= 60) return 'Moderate';
  if (combined >= 40) return 'High';
  return 'Severe';
}

// ── Core scoring function ─────────────────────────────────────────────────────

export function scoreScan(raw: RawScan): ScoredResult {
  const homepage = raw.pages.find(p => p.role === 'homepage');
  const isFailed = (homepage?.totalBytes ?? 0) < 50 * 1024; // Less than 50KB

  if (isFailed) {
    const zeroPillars: PillarScores = { intrusion: 0, privacy: 0, performance: 0, accessibility: 0 };
    return {
      siteId:         raw.site.id,
      siteName:       raw.site.name,
      siteUrl:        raw.site.url,
      scannerVersion: raw.scannerVersion,
      runStartedAt:   raw.runStartedAt,
      pillars:        zeroPillars,
      pillarGrades: {
        intrusion:     gradeScore(0),
        privacy:       gradeScore(0),
        performance:   gradeScore(0),
        accessibility: gradeScore(0),
      },
      overallScore:  0,
      overallGrade:  gradeScore(0),
      attentionTax:  'Severe',
      scoredAt:      new Date().toISOString(),
    };
  }
  const pillars: PillarScores = {
    intrusion:     scoreIntrusion(raw.pages),
    privacy:       scorePrivacy(raw.pages),
    performance:   scorePerformance(raw.pages),
    accessibility: scoreAccessibility(raw.pages),
  };

  const overallScore =
    pillars.intrusion     * WEIGHTS.intrusion +
    pillars.privacy       * WEIGHTS.privacy +
    pillars.performance   * WEIGHTS.performance +
    pillars.accessibility * WEIGHTS.accessibility;

  return {
    siteId:         raw.site.id,
    siteName:       raw.site.name,
    siteUrl:        raw.site.url,
    scannerVersion: raw.scannerVersion,
    runStartedAt:   raw.runStartedAt,
    pillars,
    pillarGrades: {
      intrusion:     gradeScore(pillars.intrusion),
      privacy:       gradeScore(pillars.privacy),
      performance:   gradeScore(pillars.performance),
      accessibility: gradeScore(pillars.accessibility),
    },
    overallScore:  Math.round(overallScore),
    overallGrade:  gradeScore(overallScore),
    attentionTax:  getAttentionTax(pillars.intrusion, pillars.privacy),
    scoredAt:      new Date().toISOString(),
  };
}

// ── CLI runner ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const scannerOutput = path.resolve(__dirname, '../../scanner/output');

  // Find all raw.json files in scanner output
  const rawFiles: string[] = [];
  const siteDirs = await fs.readdir(scannerOutput).catch(() => []);
  for (const siteId of siteDirs) {
    const runDirs = await fs.readdir(path.join(scannerOutput, siteId)).catch(() => []);
    // Take the most recent run (sorted alphabetically = timestamp order)
    const latest = runDirs.sort().at(-1);
    if (latest) rawFiles.push(path.join(scannerOutput, siteId, latest, 'raw.json'));
  }

  if (rawFiles.length === 0) {
    console.error('No scan output found. Run the scanner first.');
    process.exit(1);
  }

  const results: ScoredResult[] = [];
  for (const file of rawFiles) {
    const raw = JSON.parse(await fs.readFile(file, 'utf-8')) as RawScan;
    const result = scoreScan(raw);

    // Generate AI explanation
    process.stdout.write(`  🤖 Generating AI explanation for ${result.siteName}...`);
    const aiExplanation = await generateExplanation(result);
    if (aiExplanation) {
      result.aiExplanation = aiExplanation;
      console.log(' ✓');
    } else {
      console.log(' skipped');
    }

    results.push(result);
    console.log(
      `${result.siteName.padEnd(30)} ` +
      `Overall: ${result.overallScore.toString().padStart(3)} (${result.overallGrade.letter.padEnd(2)}) · ` +
      `Intrusion: ${Math.round(result.pillars.intrusion)} · ` +
      `Privacy: ${Math.round(result.pillars.privacy)} · ` +
      `Perf: ${Math.round(result.pillars.performance)} · ` +
      `A11y: ${Math.round(result.pillars.accessibility)} · ` +
      `Attention Tax: ${result.attentionTax}`,
    );
  }

  // Write combined scores file for the web app
  const outPath = path.resolve(__dirname, '../../data/editions/latest/scores.json');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(results, null, 2), 'utf-8');
  
  // Copy screenshots to web app public directory
  const screenshotsDir = path.resolve(__dirname, '../../web/public/screenshots');
  await fs.mkdir(screenshotsDir, { recursive: true });
  for (const file of rawFiles) {
    const raw = JSON.parse(await fs.readFile(file, 'utf-8')) as RawScan;
    const siteId = raw.site.id;
    const screenshotSrc = path.join(path.dirname(file), 'screenshots', `${siteId}__homepage__after-load.png`);
    const screenshotDest = path.join(screenshotsDir, `${siteId}.png`);
    await fs.copyFile(screenshotSrc, screenshotDest).catch(() => console.warn(`⚠️ Could not copy screenshot for ${siteId}`));
  }

  console.log(`\n✅ Scores written → ${outPath}`);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
