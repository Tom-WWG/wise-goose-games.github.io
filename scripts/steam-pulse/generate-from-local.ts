/**
 * generate-from-local.ts
 *
 * Batch pipeline for processing locally-downloaded CloudFront JSON report files.
 * Place raw report JSON files in scripts/steam-pulse/data/ then run:
 *
 *   npm run steam-pulse:generate:local
 *
 * Files are processed in chronological order (period_end ascending).
 * Week numbers are assigned sequentially starting from --start-week (or auto-detected).
 * Each processed week's output is used as the "previous week" for the next run,
 * so WoW deltas chain correctly across all four weeks.
 *
 * Flags:
 *   --start-week N   Override starting week number (default: auto-detect from
 *                    existing content, or 1 if no prior weeks exist)
 *   --data-dir PATH  Directory containing JSON files (default: scripts/steam-pulse/data)
 *   --dry-run        Print frontmatter without writing files
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { computeScores } from './compute-scores.js';
import { writeMarkdown } from './write-markdown.js';
import type { ReportFile } from './fetch-report.js';

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getFlag(name: string): string | null {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] ?? null : null;
}

const isDryRun  = args.includes('--dry-run');
const dataDir   = getFlag('--data-dir')
  ?? path.resolve('scripts/steam-pulse/data');
const startWeekOverride = getFlag('--start-week')
  ? parseInt(getFlag('--start-week')!, 10)
  : null;

// ── Helpers ───────────────────────────────────────────────────────────────────

const CONTENT_DIR = path.resolve('src/content/steam-pulse');

/** Detect highest existing week number from already-written markdown files. */
function detectLatestWeek(): number {
  if (!fs.existsSync(CONTENT_DIR)) return 0;
  const files = fs.readdirSync(CONTENT_DIR)
    .filter(f => /^week-\d+\.md$/.test(f));
  if (!files.length) return 0;
  return Math.max(...files.map(f => parseInt(f.match(/\d+/)![0])));
}

/** Load composite scores from a just-written markdown file for delta chaining. */
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

/** Load hit_rate from a markdown file for delta chaining. */
function loadHitRateFromMarkdown(weekNum: number): number | null {
  const mdPath = path.join(CONTENT_DIR, `week-${weekNum}.md`);
  if (!fs.existsSync(mdPath)) return null;
  const { data } = matter(fs.readFileSync(mdPath, 'utf-8'));
  return typeof data.hit_rate === 'number' ? data.hit_rate : null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Steam Pulse — Local Batch Generator');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'WRITE'}`);
  console.log(`Data dir: ${dataDir}\n`);

  // 1. Find all JSON files in data dir
  if (!fs.existsSync(dataDir)) {
    throw new Error(`Data directory not found: ${dataDir}\nCreate it and drop your CloudFront JSON files in.`);
  }

  const jsonFiles = fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.json') && !f.startsWith('.'))
    .map(f => {
      const fullPath = path.join(dataDir, f);
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const report = JSON.parse(raw) as ReportFile;
      return { filename: f, report };
    })
    .sort((a, b) => {
      // Sort oldest-first by period_end
      return new Date(a.report.period_end).getTime()
           - new Date(b.report.period_end).getTime();
    });

  if (!jsonFiles.length) {
    throw new Error(
      `No JSON files found in ${dataDir}\n` +
      `Download your CloudFront report files and place them there, then re-run.`
    );
  }

  console.log(`Found ${jsonFiles.length} report file(s):`);
  jsonFiles.forEach(({ filename, report }) => {
    console.log(`  ${filename}  (period_end: ${report.period_end}, games: ${report.games.length})`);
  });
  console.log('');

  // 2. Determine starting week number
  const latestExisting = detectLatestWeek();
  // If we're reprocessing weeks we already have, start from the oldest file's
  // implied week. Otherwise continue from where we left off.
  const startWeek = startWeekOverride
    ?? (latestExisting > 0 ? latestExisting - jsonFiles.length + 1 : 1);

  console.log(`Starting at week ${startWeek} (use --start-week N to override)\n`);

  // 3. Process each file in order
  let previousWeekNum: number | null = startWeek > 1 ? startWeek - 1 : null;

  for (let i = 0; i < jsonFiles.length; i++) {
    const { filename, report } = jsonFiles[i];
    const weekNumber = startWeek + i;

    console.log(`──────────────────────────────────────`);
    console.log(`Processing: ${filename}`);
    console.log(`  Week ${weekNumber} / period_end: ${report.period_end}`);

    // Load previous week scores for delta calculation
    const previousScores = previousWeekNum !== null
      ? loadScoresFromMarkdown(previousWeekNum)
      : {};
    const previousHitRate = previousWeekNum !== null
      ? loadHitRateFromMarkdown(previousWeekNum)
      : null;

    if (Object.keys(previousScores).length) {
      console.log(`  Using week-${previousWeekNum}.md for deltas`);
    } else {
      console.log(`  No prior week — deltas will be 0`);
    }

    // Compute composite scores
    const computed = computeScores(report.games, previousScores);
    console.log(`  Genres: ${computed.genres.length}  Tags: ${computed.tags.length}`);
    console.log(`  Hit rate: ${computed.hit_rate}%  Releases: ${computed.total_releases}`);

    // Write (or print) markdown
    writeMarkdown({
      weekNumber,
      reportFilename: filename,
      periodDate: report.period_end,
      computed,
      previousHitRate,
      dryRun: isDryRun,
    });

    previousWeekNum = weekNumber;
  }

  console.log('\n──────────────────────────────────────');
  console.log(`Done. ${jsonFiles.length} week(s) ${isDryRun ? 'previewed' : 'written'}.`);

  if (!isDryRun) {
    console.log('\nNext steps:');
    console.log('  1. Open each week-N.md and fill in the editorial sections');
    console.log('     (WEEKLY TAKE, TREND TAKE, SITE SUBTITLE, social copy)');
    console.log('  2. Run `npm run dev` and visit /steam-pulse/week-N/ to review');
  }
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
