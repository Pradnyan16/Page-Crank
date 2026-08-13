/**
 * explain.ts — AI-powered score explanation using Google Gemini
 *
 * Takes a scored result and generates a concise, human-readable editorial
 * paragraph that explains why a site received its score. Falls back gracefully
 * if the API key is missing or the call fails.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ScoredResult } from './score.js';

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  if (genAI) return genAI;
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) {
    console.warn('⚠️  GOOGLE_AI_API_KEY not set — skipping AI explanations');
    return null;
  }
  genAI = new GoogleGenerativeAI(key);
  return genAI;
}

export async function generateExplanation(result: ScoredResult): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const { siteName, overallScore, overallGrade, pillars, attentionTax } = result;

  const prompt = `You are an editorial analyst for Page Crank, a reader-rights publication that scores news websites on how respectful they are to their readers.

Write a 2–3 sentence editorial analysis for ${siteName}. Be direct, factual, and opinionated — like a journalist writing a verdict. Do NOT use bullet points. Do NOT start with "The website" or "This website". Use the site name directly.

Here are the scores (all out of 100, higher = better for the reader):
- Overall Score: ${overallScore}/100 (Grade: ${overallGrade.letter})
- Intrusion (popups, ads, overlays): ${Math.round(pillars.intrusion)}/100
- Privacy (trackers, cookies): ${Math.round(pillars.privacy)}/100  
- Performance (speed, page weight): ${Math.round(pillars.performance)}/100
- Accessibility (contrast, labels): ${Math.round(pillars.accessibility)}/100
- Attention Tax: ${attentionTax}

Write only the explanation paragraph. No intro, no header, no sign-off. Maximum 60 words.`;

  try {
    const model = client.getGenerativeModel({ model: 'gemini-flash-latest' });
    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();
    return text;
  } catch (err) {
    console.warn(`⚠️  AI explanation failed for ${siteName}:`, (err as Error).message);
    return null;
  }
}
