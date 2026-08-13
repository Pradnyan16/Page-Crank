/**
 * blocklists/fetch.ts — EasyList and EasyPrivacy downloader/cache manager
 *
 * WHY: Using maintained community blocklists (EasyList, EasyPrivacy) rather
 * than a hand-written tracker list gives us coverage of thousands of known
 * ad and tracking domains maintained by the filter-list community. We cache
 * locally to avoid re-downloading on every scan run — lists are refreshed
 * if the cache is older than 24 hours.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.resolve(__dirname, '../../..', '.cache');
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export const BLOCKLISTS = [
  {
    name: 'easylist',
    url: 'https://easylist.to/easylist/easylist.txt',
    file: 'easylist.txt',
  },
  {
    name: 'easyprivacy',
    url: 'https://easylist.to/easylist/easyprivacy.txt',
    file: 'easyprivacy.txt',
  },
] as const;

export type BlocklistName = (typeof BLOCKLISTS)[number]['name'];

/**
 * Returns the cached blocklist text, downloading it first if missing or stale.
 */
export async function fetchBlocklist(name: BlocklistName): Promise<string> {
  await fs.mkdir(CACHE_DIR, { recursive: true });

  const entry = BLOCKLISTS.find((b) => b.name === name);
  if (!entry) throw new Error(`Unknown blocklist: ${name}`);

  const cachePath = path.join(CACHE_DIR, entry.file);

  // Check if cache exists and is fresh
  try {
    const stat = await fs.stat(cachePath);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs < CACHE_MAX_AGE_MS) {
      return fs.readFile(cachePath, 'utf-8');
    }
  } catch {
    // File doesn't exist — fall through to download
  }

  console.log(`  ⬇️  Downloading ${name} blocklist...`);

  const response = await fetch(entry.url);
  if (!response.ok) {
    throw new Error(`Failed to download ${name}: HTTP ${response.status}`);
  }

  const text = await response.text();
  await fs.writeFile(cachePath, text, 'utf-8');
  console.log(`  ✓ ${name} cached (${(text.length / 1024).toFixed(0)}KB)`);

  return text;
}

/**
 * Loads both blocklists, combining them into a single string.
 * Used by match.ts to build the rule set once per scan session.
 */
export async function loadAllBlocklists(): Promise<{ easylist: string; easyprivacy: string }> {
  const [easylist, easyprivacy] = await Promise.all([
    fetchBlocklist('easylist'),
    fetchBlocklist('easyprivacy'),
  ]);
  return { easylist, easyprivacy };
}
