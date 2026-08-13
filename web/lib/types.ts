/**
 * lib/types.ts — Web app data types
 * These mirror the scoring output shape — the web app reads from scores.json.
 */

export type GradeTier = 'good' | 'mid' | 'bad';
export type ScoreColour = 'ledger' | 'brass' | 'rust';
export type AttentionTax = 'Low' | 'Moderate' | 'High' | 'Severe';
export type LetterGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

export interface GradeResult {
  score: number;
  letter: LetterGrade;
  tier: GradeTier;
  colour: ScoreColour;
  verdict: string;
}

export interface PillarScores {
  intrusion: number;
  privacy: number;
  performance: number;
  accessibility: number;
}

export interface ScoredSite {
  siteId: string;
  siteName: string;
  siteUrl: string;
  runStartedAt: string;
  pillars: PillarScores;
  pillarGrades: {
    intrusion: GradeResult;
    privacy: GradeResult;
    performance: GradeResult;
    accessibility: GradeResult;
  };
  overallScore: number;
  overallGrade: GradeResult;
  attentionTax: AttentionTax;
  scoredAt: string;
  /** Rank position in current edition (1-indexed) */
  rank?: number;
  /** Change in rank since previous edition — positive = improved */
  rankDelta?: number;
  /** AI-generated human-readable editorial explanation */
  aiExplanation?: string;
}

export interface Edition {
  editionLabel: string;    // e.g. "Aug 2026"
  volume: string;          // e.g. "Vol. I — No. 1"
  category: string;        // e.g. "50 Most-Visited English News Sites"
  publishedAt: string;
  sites: ScoredSite[];
}
