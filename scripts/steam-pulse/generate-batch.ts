/**
 * generate-batch.ts
 *
 * Fetches all 7-day weekly reports from CloudFront and generates markdown files
 * for each one in chronological order, chaining WoW deltas correctly between weeks.
 *
 *   npm run steam-pulse:generate:batch
 *
 * Flags:
 *   --start-week N   Override the starting week number (default: 9)
 *   --days N         Only process reports with exactly N days (default: 7)
 *   --dry-run        Print frontmatter without writing files
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { fetchIndexEntries, fetchReport } from './fetch-report.js';
import { computeScores } from './compute-scores.js';
import { writeMarkdown } from './write-markdown.js';

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getFlag(name: string): string | null {
  const idx = args.indexOf(name);
  return idx !== -1 ? (args[idx + 1] ?? null) : null;
}

const isDryRun    = args.includes('--dry-run');
const targetDays  = parseInt(getFlag('--days') ?? '7', 10);
const startWeek   = parseInt(getFlag('--start-week') ?? '9', 10);

// ── Helpers ───────────────────────────────────────────────────────────────────

const CONTENT_DIR = path.resolve('src/content/steam-pulse');

function loadScoresFromMarkdown(weekNum: number): Record<string, number> {
  const mdPath = path.join(CONTENT_DIR, `week-${weekNum}.md`);
  if (!fs.existsSync(mdPath)) return {};
  const { data } = matter(fs.readFileSync(mdPath, 'utf-8'));
  const scores: Record<string, number> = {};
  for (const g of (data.genres ?? [])) {
    if (g.name && typeof g.score === 'number') scores[g.name] = g.score;
  }
  for (const t of (data.tags ?? [])) {
    if (t.name && typeof t.score === 'number') scores[t.name] = t.score;
  }
  return scores;
}

function loadHitRateFromMarkdown(weekNum: number): number | null {
  const mdPath = path.join(CONTENT_DIR, `week-${weekNum}.md`);
  if (!fs.existsSync(mdPath)) return null;
  const { data } = matter(fs.readFileSync(mdPath, 'utf-8'));
  return typeof data.hit_rate === 'number' ? data.hit_rate : null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Steam Pulse — Batch Generator (CloudFront)');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'WRITE'}`);
  console.log(`Filtering to: ${targetDays}-day reports\n`);

  // 1. Fetch index and filter to target period length
  console.log('Fetching index from CloudFront...');
  const allEntries = await fetchIndexEntries(); // sorted oldest-first
  const entries = allEntries.filter(e => e.days === targetDays);

  if (!entries.length) {
    throw new Error(`No ${targetDays}-day reports found in index.json`);
  }

  console.log(`Found ${entries.length} report(s) matching ${targetDays} days:`);
  entries.forEach(e => console.log(`  ${e.filename}  (${e.date})`));
  console.log(`\nAssigning week numbers ${startWeek}–${startWeek + entries.length - 1}`);
  console.log('');

  // 2. Process each report in chronological order
  let previousWeekNum: number | null = startWeek > 1 ? startWeek - 1 : null;

  for (let i = 0; i < entries.length; i++) {
    const entry  = entries[i];
    const weekNumber = startWeek + i;

    console.log(`──────────────────────────────────────`);
    console.log(`Fetching: ${entry.filename}`);
    console.log(`  Week ${weekNumber} / ${entry.date}`);

    const report = await fetchReport(entry.filename);
    console.log(`  Games in report: ${report.games.length}`);

    // Load previous week scores for delta calculation
    const previousScores  = previousWeekNum !== null ? loadScoresFromMarkdown(previousWeekNum) : {};
    const previousHitRate = previousWeekNum !== null ? loadHitRateFromMarkdown(previousWeekNum) : null;

    if (Object.keys(previousScores).length) {
      console.log(`  Using week-${previousWeekNum}.md for WoW deltas`);
    } else {
      console.log(`  No prior week found — deltas will be 0`);
    }

    const computed = computeScores(report, previousScores);
    console.log(`  Genres: ${computed.genres.length}  Tags: ${computed.tags.length}`);
    console.log(`  Hit rate: ${computed.hit_rate}%  Releases: ${computed.total_releases}`);

    writeMarkdown({
      weekNumber,
      reportFilename: entry.filename,
      periodDate: report.period_end,
      computed,
      previousHitRate,
      dryRun: isDryRun,
    });

    previousWeekNum = weekNumber;
  }

  console.log('\n──────────────────────────────────────');
  console.log(`Done. ${entries.length} week(s) ${isDryRun ? 'previewed' : 'written'}.`);

  if (!isDryRun) {
    console.log('\nNext steps:');
    console.log('  1. Open each generated week-N.md and fill in the editorial sections');
    console.log('  2. Run `npm run dev` and visit /steam-pulse/ to review all pages');
  }
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
