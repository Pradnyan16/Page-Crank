/**
 * grade.ts — Numeric score → letter grade + tier
 *
 * WHY: Letter grades communicate quality at a glance for editorial use.
 * The tier (good/mid/bad) drives the visual colour system in the web app
 * (ledger green / brass / rust) — keeping colour semantics in one place
 * rather than scattered across components.
 */

export type LetterGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
export type GradeTier = 'good' | 'mid' | 'bad';
export type ScoreColour = 'ledger' | 'brass' | 'rust';

export interface GradeResult {
  score: number;        // 0–100 rounded
  letter: LetterGrade;
  tier: GradeTier;
  colour: ScoreColour;
  /** Human-readable verdict used on scorecard stamps */
  verdict: string;
}

const GRADE_THRESHOLDS: Array<{ min: number; letter: LetterGrade; tier: GradeTier; verdict: string }> = [
  { min: 97, letter: 'A+', tier: 'good', verdict: 'Reader Excellent' },
  { min: 93, letter: 'A',  tier: 'good', verdict: 'Reader Approved' },
  { min: 90, letter: 'A-', tier: 'good', verdict: 'Reader Approved' },
  { min: 87, letter: 'B+', tier: 'good', verdict: 'Reader Friendly' },
  { min: 83, letter: 'B',  tier: 'good', verdict: 'Reader Friendly' },
  { min: 80, letter: 'B-', tier: 'good', verdict: 'Reader Friendly' },
  { min: 77, letter: 'C+', tier: 'mid',  verdict: 'Mixed Experience' },
  { min: 73, letter: 'C',  tier: 'mid',  verdict: 'Mixed Experience' },
  { min: 70, letter: 'C-', tier: 'mid',  verdict: 'Mixed Experience' },
  { min: 50, letter: 'D',  tier: 'mid',  verdict: 'Needs Work' },
  { min: 0,  letter: 'F',  tier: 'bad',  verdict: 'Reader Hostile' },
];

const TIER_COLOUR: Record<GradeTier, ScoreColour> = {
  good: 'ledger',
  mid:  'brass',
  bad:  'rust',
};

export function gradeScore(raw: number): GradeResult {
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const entry = GRADE_THRESHOLDS.find((t) => score >= t.min) ?? GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1]!;
  return {
    score,
    letter: entry.letter,
    tier: entry.tier,
    colour: TIER_COLOUR[entry.tier],
    verdict: entry.verdict,
  };
}

/** Clamps a value to [0, 100] */
export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/** Linearly maps value from [inMin, inMax] to [outMin, outMax] */
export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin;
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}
