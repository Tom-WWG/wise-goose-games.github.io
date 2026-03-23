# Steam Pulse Pipeline — Report Generator Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan.

**Goal:** Build the weekly report generator script that fetches the latest CloudFront scraper data, computes composite scores for all genres and tags, and writes a pre-filled markdown file to the content collection for the human to complete with editorial copy.

**Architecture:** A TypeScript script run via `tsx` (Node.js, no Astro runtime). It fetches `index.json` from CloudFront to identify the latest report, downloads the full report JSON, loads the most recent existing content collection file to obtain previous-week scores for delta calculation, computes composite scores per tag and genre, and writes a new `week-{N}.md` file with fully auto-filled frontmatter and blank editorial placeholder sections. A cron entry invokes this script every Sunday at midnight.

**Tech Stack:** Node.js, TypeScript, `tsx` (script runner), `node-fetch` or native `fetch` (Node 18+), `gray-matter` (read existing markdown frontmatter), fs/path (Node built-ins), `dotenv` (env var loading)

---

## Prerequisites

- Node 18+ (native `fetch` available — no `node-fetch` needed).
- `tsx` must be installed: `npm install --save-dev tsx`.
- `gray-matter` must be installed: `npm install --save-dev gray-matter`.
- `dotenv` must be installed: `npm install --save-dev dotenv`.
- `.env` file must contain `CLOUDFRONT_REPORT_URL=https://d1017lpxhotn9a.cloudfront.net/reports` (no trailing slash).
- The Zod content collection schema from Plan 1 is the source of truth for the markdown frontmatter shape.

---

## Environment Variables

Add to `.env` (and document here for future reference):

| Variable | Example Value | Notes |
|---|---|---|
| `CLOUDFRONT_REPORT_URL` | `https://d1017lpxhotn9a.cloudfront.net/reports` | Base URL, no trailing slash |

Add to `CLAUDE.md` env vars table:
```
| `CLOUDFRONT_REPORT_URL` | `scripts/steam-pulse/fetch-report.ts` | Base CDN URL for report JSON files |
```

---

## Tag ID to Name Mapping

The CloudFront report JSON uses numeric Steam tag IDs. The generator needs a `TAG_NAMES` map to convert them to display names. This map is maintained manually and lives in `scripts/steam-pulse/tag-names.ts`. A starter set is included in Task 2 below.

---

### Task 1: Install Dependencies and Add npm Script

**Files:**
- Modify: `package.json`

- [ ] Step 1: Install required dev dependencies:
  ```bash
  npm install --save-dev tsx gray-matter dotenv @types/gray-matter
  ```

- [ ] Step 2: Add the following script entries to the `"scripts"` section of `package.json`:
  ```json
  "steam-pulse:generate": "tsx scripts/steam-pulse/generate-report.ts",
  "steam-pulse:generate:dry": "tsx scripts/steam-pulse/generate-report.ts --dry-run"
  ```
  The `--dry-run` flag (handled in `generate-report.ts`) prints the computed data to stdout without writing any file — useful for testing.

- [ ] Step 3: Create the directory structure:
  ```bash
  mkdir -p scripts/steam-pulse
  ```

- [ ] Step 4: Commit — `git commit -m "chore: add tsx/gray-matter deps and steam-pulse:generate script"`

---

### Task 2: Create Tag Names Map

**Files:**
- Create: `scripts/steam-pulse/tag-names.ts`

- [ ] Step 1: Create `scripts/steam-pulse/tag-names.ts` with the following content. Add additional tag IDs as they appear in CloudFront reports.

```typescript
/**
 * Maps Steam tag IDs (numeric strings) to human-readable display names.
 * Add new entries as they appear in CloudFront report data.
 * Source: https://store.steampowered.com/tag/browse/
 */
export const TAG_NAMES: Record<string, string> = {
  // Genres
  '1628': 'Puzzle',
  '1741': 'Simulation',
  '3832': 'Roguelite',
  '1695': 'Action RPG',
  '21978': 'Cozy',
  '597': 'Narrative',
  '1684': 'Strategy',
  '1773': 'Platformer',
  '1666': 'Horror',
  '9': 'RPG',
  '4182': 'Adventure',
  '1756': 'Action',
  // Tags
  '3756': 'Logic',
  '7208': 'Atmospheric',
  '5611': 'Word Puzzle',
  '1122': 'Hand-drawn',
  '4136': 'Cozy Mystery',
  '3814': 'Walking Sim',
  '5105': 'Pixel Art',
  '1462': 'Procedural Generation',
  '3859': 'Crafting',
  '3964': 'Base Building',
  '1664': 'Open World',
  '1775': 'FPS',
  '1774': 'Battle Royale',
};

/**
 * Resolves a tag ID to its display name, falling back to the raw ID.
 */
export function resolveTagName(tagId: string): string {
  return TAG_NAMES[tagId] ?? `Tag#${tagId}`;
}
```

- [ ] Step 2: Commit — `git commit -m "feat: add steam-pulse tag names map"`

---

### Task 3: Create fetch-report.ts

**Files:**
- Create: `scripts/steam-pulse/fetch-report.ts`

This module fetches the CloudFront index to identify the latest report filename, then fetches and returns the full report JSON.

- [ ] Step 1: Create `scripts/steam-pulse/fetch-report.ts`:

```typescript
import 'dotenv/config';

const BASE_URL = process.env.CLOUDFRONT_REPORT_URL;
if (!BASE_URL) {
  throw new Error('CLOUDFRONT_REPORT_URL env var is not set. Add it to .env');
}

export interface ReportIndex {
  reports: string[]; // e.g. ["report_20260319_160929.json", ...]
  latest: string;    // filename of the most recent report
}

export interface GameRecord {
  app_id: number;
  title: string;
  tags: string[];         // array of tag ID strings
  price: number;          // USD cents
  classification: 'hit' | 'promising' | 'niche' | 'miss';
  review_count: number;
  review_score: number;   // 0–100
  revenue_estimate: number; // USD
}

export interface ReportFile {
  generated_at: string;   // ISO timestamp
  period_start: string;   // ISO date
  period_end: string;     // ISO date
  games: GameRecord[];
}

/**
 * Fetches the index.json to find the latest report filename.
 */
export async function fetchIndex(): Promise<ReportIndex> {
  const url = `${BASE_URL}/index.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch report index: ${res.status} ${res.statusText} (${url})`);
  }
  const data = await res.json() as unknown;
  // Normalise: index.json may have a `reports` array or a `latest` string directly.
  // Handle both shapes defensively.
  if (typeof data === 'object' && data !== null && 'reports' in data) {
    return data as ReportIndex;
  }
  // Fallback: if index.json is just an array of filenames
  if (Array.isArray(data)) {
    const sorted = [...data].sort().reverse();
    return { reports: sorted, latest: sorted[0] };
  }
  throw new Error(`Unexpected index.json shape: ${JSON.stringify(data).slice(0, 200)}`);
}

/**
 * Fetches a specific report JSON by filename.
 */
export async function fetchReport(filename: string): Promise<ReportFile> {
  const url = `${BASE_URL}/${filename}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch report ${filename}: ${res.status} ${res.statusText}`);
  }
  return await res.json() as ReportFile;
}

/**
 * Fetches the latest report: reads index, then fetches the newest file.
 * Returns both the filename and the parsed report.
 */
export async function fetchLatestReport(): Promise<{ filename: string; report: ReportFile }> {
  const index = await fetchIndex();
  const filename = index.latest;
  if (!filename) {
    throw new Error('index.json has no latest report filename');
  }
  const report = await fetchReport(filename);
  return { filename, report };
}
```

- [ ] Step 2: Commit — `git commit -m "feat: add steam-pulse fetch-report module"`

---

### Task 4: Create load-previous.ts

**Files:**
- Create: `scripts/steam-pulse/load-previous.ts`

This module reads the most recently published `week-{N}.md` from the content collection to extract previous-week composite scores for trend delta computation.

- [ ] Step 1: Create `scripts/steam-pulse/load-previous.ts`:

```typescript
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const CONTENT_DIR = path.resolve('src/content/steam-pulse');

export interface PreviousWeekScores {
  week: number;
  genres: Record<string, number>; // name -> score
  tags: Record<string, number>;   // name -> score
}

/**
 * Reads all week-*.md files in src/content/steam-pulse, finds the one with
 * the highest week number, and returns its genre/tag scores for delta calc.
 * Returns null if no previous weeks exist (first run).
 */
export function loadPreviousWeek(): PreviousWeekScores | null {
  if (!fs.existsSync(CONTENT_DIR)) {
    return null;
  }

  const files = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.startsWith('week-') && f.endsWith('.md'));

  if (files.length === 0) {
    return null;
  }

  // Sort by week number descending
  const sorted = files
    .map(f => {
      const match = f.match(/^week-(\d+)\.md$/);
      return match ? { file: f, week: parseInt(match[1], 10) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b!.week - a!.week);

  const latest = sorted[0];
  if (!latest) return null;

  const raw = fs.readFileSync(path.join(CONTENT_DIR, latest.file), 'utf-8');
  const { data } = matter(raw);

  // Extract genre scores
  const genres: Record<string, number> = {};
  if (Array.isArray(data.genres)) {
    for (const g of data.genres) {
      if (g.name && typeof g.score === 'number') {
        genres[g.name] = g.score;
      }
    }
  }

  // Extract tag scores
  const tags: Record<string, number> = {};
  if (Array.isArray(data.tags)) {
    for (const t of data.tags) {
      if (t.name && typeof t.score === 'number') {
        tags[t.name] = t.score;
      }
    }
  }

  return { week: latest.week, genres, tags };
}
```

- [ ] Step 2: Commit — `git commit -m "feat: add steam-pulse load-previous module"`

---

### Task 5: Create compute-scores.ts

**Files:**
- Create: `scripts/steam-pulse/compute-scores.ts`

This is the core scoring engine. It implements the composite score formula and classifies each tag/genre as rising, stable, or declining.

**Composite score formula:**
```
composite = (success_rate × 0.5) + (revenue_potential × 0.3) + (trend_momentum × 0.2)
```
- `success_rate`: percentage of games with this tag classified as `hit`, out of total games with this tag (0–100)
- `revenue_potential`: tag's average `revenue_estimate` normalized to 0–100 relative to the max across all tags this week
- `trend_momentum`: delta vs previous week's composite score, normalized to 0–100 (clamped; 0 = no change, 100 = maximum rise)

**Trend classification thresholds:**
- `rising`: delta > +5 points
- `declining`: delta < -5 points
- `stable`: -5 ≤ delta ≤ +5

**Emerging niche criteria:** `success_rate >= 50` AND `game_count <= 15`

- [ ] Step 1: Create `scripts/steam-pulse/compute-scores.ts`:

```typescript
import type { ReportFile, GameRecord } from './fetch-report.ts';
import type { PreviousWeekScores } from './load-previous.ts';
import { resolveTagName } from './tag-names.ts';

export interface ScoredItem {
  name: string;
  score: number;  // 0–100 composite
  trend: 'rising' | 'stable' | 'declining';
  delta: number;  // signed integer, vs previous week
  game_count: number;
  success_rate: number; // 0–100
}

export interface DeltaItem {
  tag: string;
  delta: number;
}

export interface NicheItem {
  tag: string;
  success_rate: number;
  game_count: number;
}

export interface ComputedScores {
  genres: ScoredItem[];    // top 5 by composite score
  tags: ScoredItem[];      // top 5 by composite score
  rising: DeltaItem[];     // top 3 risers
  saturating: DeltaItem[]; // top 3 fallers
  niches: NicheItem[];     // tags meeting niche criteria
  total_releases: number;
  hit_count: number;
  promising_count: number;
  niche_count: number;
  miss_count: number;
  hit_rate: number;        // 0–100, percentage
  hit_rate_delta: number;  // vs previous week's hit_rate (pass 0 if unknown)
}

/** Groups games by a given tag ID and returns per-tag statistics. */
function groupByTag(games: GameRecord[]): Map<string, GameRecord[]> {
  const map = new Map<string, GameRecord[]>();
  for (const game of games) {
    for (const tagId of game.tags) {
      const list = map.get(tagId) ?? [];
      list.push(game);
      map.set(tagId, list);
    }
  }
  return map;
}

/** Normalizes a value within a range to 0–100. Clamps to [0, 100]. */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

/** Classifies delta into trend string. */
function classifyTrend(delta: number): 'rising' | 'stable' | 'declining' {
  if (delta > 5) return 'rising';
  if (delta < -5) return 'declining';
  return 'stable';
}

/**
 * GENRE_TAG_IDS: Steam tag IDs that are considered "genres" vs "tags".
 * Tags not in this set are treated as specific tags (mechanics, aesthetics, etc).
 * Extend this list as needed.
 */
const GENRE_TAG_IDS = new Set([
  '1628', // Puzzle
  '1741', // Simulation
  '3832', // Roguelite
  '21978', // Cozy
  '597',  // Narrative
  '1684', // Strategy
  '1773', // Platformer
  '1666', // Horror
  '9',    // RPG
  '4182', // Adventure
  '1756', // Action
  '1695', // Action RPG
]);

/**
 * Main scoring function. Takes a report and optional previous-week scores,
 * returns fully computed scores ready for the markdown writer.
 */
export function computeScores(
  report: ReportFile,
  previous: PreviousWeekScores | null
): ComputedScores {
  const games = report.games;
  const total = games.length;

  // Classification counts
  const hit_count = games.filter(g => g.classification === 'hit').length;
  const promising_count = games.filter(g => g.classification === 'promising').length;
  const niche_count = games.filter(g => g.classification === 'niche').length;
  const miss_count = games.filter(g => g.classification === 'miss').length;
  const hit_rate = total > 0 ? Math.round((hit_count / total) * 100) : 0;

  // Group by tag
  const byTag = groupByTag(games);

  // Compute per-tag raw stats
  interface RawTagStats {
    tagId: string;
    name: string;
    game_count: number;
    success_rate: number;    // 0–100
    avg_revenue: number;     // raw USD
  }

  const rawStats: RawTagStats[] = [];

  for (const [tagId, tagGames] of byTag.entries()) {
    const name = resolveTagName(tagId);
    const hits = tagGames.filter(g => g.classification === 'hit').length;
    const success_rate = Math.round((hits / tagGames.length) * 100);
    const avg_revenue =
      tagGames.reduce((sum, g) => sum + (g.revenue_estimate ?? 0), 0) / tagGames.length;

    rawStats.push({
      tagId,
      name,
      game_count: tagGames.length,
      success_rate,
      avg_revenue,
    });
  }

  // Normalize avg_revenue across all tags
  const revenues = rawStats.map(s => s.avg_revenue);
  const minRev = Math.min(...revenues);
  const maxRev = Math.max(...revenues);

  // Compute composite scores
  interface ScoredRaw extends RawTagStats {
    revenue_potential: number;
    trend_momentum: number;
    composite: number;
    delta: number;
    trend: 'rising' | 'stable' | 'declining';
  }

  const scored: ScoredRaw[] = rawStats.map(s => {
    const revenue_potential = normalize(s.avg_revenue, minRev, maxRev);

    // Get previous week's composite score for this tag/genre name
    const isGenre = GENRE_TAG_IDS.has(s.tagId);
    const prevScore = isGenre
      ? (previous?.genres[s.name] ?? null)
      : (previous?.tags[s.name] ?? null);

    // Trend momentum: delta vs prev week, normalized to 0–100
    // If no previous data, momentum is neutral (50)
    let delta = 0;
    let trend_momentum = 50; // neutral baseline

    // We need composite to compute delta, but composite needs momentum — bootstrap:
    // First compute without momentum component, then refine.
    const compositeNoMomentum =
      (s.success_rate * 0.5) + (revenue_potential * 0.3) + (50 * 0.2);

    if (prevScore !== null) {
      delta = Math.round(compositeNoMomentum - prevScore);
      // Normalize delta to 0–100 for the momentum input (delta range −100 to +100)
      trend_momentum = normalize(delta, -100, 100);
    }

    const composite = Math.round(
      (s.success_rate * 0.5) + (revenue_potential * 0.3) + (trend_momentum * 0.2)
    );

    return {
      ...s,
      revenue_potential,
      trend_momentum,
      composite,
      delta,
      trend: classifyTrend(delta),
    };
  });

  // Split into genres and tags, sort descending by composite
  const genreScored = scored
    .filter(s => GENRE_TAG_IDS.has(s.tagId))
    .sort((a, b) => b.composite - a.composite)
    .slice(0, 5)
    .map(s => ({
      name: s.name,
      score: Math.min(100, Math.max(0, s.composite)),
      trend: s.trend,
      delta: s.delta,
      game_count: s.game_count,
      success_rate: s.success_rate,
    } satisfies ScoredItem));

  const tagScored = scored
    .filter(s => !GENRE_TAG_IDS.has(s.tagId))
    .sort((a, b) => b.composite - a.composite)
    .slice(0, 5)
    .map(s => ({
      name: s.name,
      score: Math.min(100, Math.max(0, s.composite)),
      trend: s.trend,
      delta: s.delta,
      game_count: s.game_count,
      success_rate: s.success_rate,
    } satisfies ScoredItem));

  // Rising: top 3 items (genre OR tag) with highest positive delta
  const allScored = [...scored].sort((a, b) => b.delta - a.delta);
  const rising: DeltaItem[] = allScored
    .filter(s => s.delta > 0)
    .slice(0, 3)
    .map(s => ({ tag: s.name, delta: s.delta }));

  // Saturating: top 3 items with most negative delta
  const saturating: DeltaItem[] = allScored
    .filter(s => s.delta < 0)
    .sort((a, b) => a.delta - b.delta) // most negative first
    .slice(0, 3)
    .map(s => ({ tag: s.name, delta: s.delta }));

  // Emerging niches: success_rate >= 50% AND game_count <= 15
  const niches: NicheItem[] = scored
    .filter(s => s.success_rate >= 50 && s.game_count <= 15)
    .sort((a, b) => b.success_rate - a.success_rate)
    .slice(0, 5)
    .map(s => ({
      tag: s.name,
      success_rate: s.success_rate,
      game_count: s.game_count,
    }));

  return {
    genres: genreScored,
    tags: tagScored,
    rising,
    saturating,
    niches,
    total_releases: total,
    hit_count,
    promising_count,
    niche_count,
    miss_count,
    hit_rate,
    hit_rate_delta: 0, // computed below in generate-report.ts by comparing to previous week's hit_rate
  };
}
```

- [ ] Step 2: Note that `hit_rate_delta` is set to `0` here — it must be computed in `generate-report.ts` after calling `loadPreviousWeek()` and reading the previous `hit_rate` from the previous content file's frontmatter. Update `load-previous.ts` to also return `hit_rate` from the previous week's frontmatter.

Add to `PreviousWeekScores` interface in `load-previous.ts`:
```typescript
hit_rate: number; // previous week's overall hit rate
```

Update `loadPreviousWeek()` to also extract `data.hit_rate` (default to 0 if missing).

- [ ] Step 3: Commit — `git commit -m "feat: add steam-pulse compute-scores engine"`

---

### Task 6: Create write-markdown.ts

**Files:**
- Create: `scripts/steam-pulse/write-markdown.ts`

This module takes the computed scores plus metadata and writes the new markdown file.

- [ ] Step 1: Create `scripts/steam-pulse/write-markdown.ts`:

```typescript
import fs from 'node:fs';
import path from 'node:path';
import type { ComputedScores, ScoredItem } from './compute-scores.ts';

const CONTENT_DIR = path.resolve('src/content/steam-pulse');

export interface MarkdownInput {
  week: number;
  date: string;        // YYYY-MM-DD
  period: string;      // DD/MM/YY display string
  report_file: string; // original CloudFront filename
  scores: ComputedScores;
}

function formatDate(isoDate: string): string {
  // Convert YYYY-MM-DD to DD/MM/YY
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

function scoredItemYaml(items: ScoredItem[]): string {
  return items
    .map(item => `  - { name: "${item.name}", score: ${item.score}, trend: ${item.trend} }`)
    .join('\n');
}

/**
 * Writes src/content/steam-pulse/week-{N}.md with auto-filled frontmatter
 * and blank editorial placeholder sections.
 * Throws if the file already exists (prevents accidental overwrite).
 */
export function writeMarkdown(input: MarkdownInput, dryRun = false): string {
  const { week, date, period, report_file, scores } = input;
  const filename = `week-${week}.md`;
  const filepath = path.join(CONTENT_DIR, filename);

  if (!dryRun && fs.existsSync(filepath)) {
    throw new Error(
      `${filepath} already exists. Delete it manually if you want to regenerate.`
    );
  }

  const risingYaml = scores.rising
    .map(r => `  - { tag: "${r.tag}", delta: ${r.delta} }`)
    .join('\n');

  const saturatingYaml = scores.saturating
    .map(s => `  - { tag: "${s.tag}", delta: ${s.delta} }`)
    .join('\n');

  const nichesYaml = scores.niches
    .map(n => `  - { tag: "${n.tag}", success_rate: ${n.success_rate}, game_count: ${n.game_count} }`)
    .join('\n');

  const content = `---
week: ${week}
date: ${date}
period: "${period}"
report_file: "${report_file}"
total_releases: ${scores.total_releases}
hit_rate: ${scores.hit_rate}
hit_rate_delta: ${scores.hit_rate_delta}
hit_count: ${scores.hit_count}
promising_count: ${scores.promising_count}
niche_count: ${scores.niche_count}
genres:
${scoredItemYaml(scores.genres)}
tags:
${scoredItemYaml(scores.tags)}
rising:
${risingYaml}
saturating:
${saturatingYaml}
niches:
${nichesYaml}
---

## WEEKLY TAKE

[FILL IN: 2-3 sentences paired with bar chart. What story does this week's composite score tell?]

## TREND TAKE

[FILL IN: 2-3 sentences paired with trend chart. What is the 8-week arc showing?]

## SITE SUBTITLE

[FILL IN: ~10 words, evocative subtitle for the page header]

## SOCIAL CAPTION (Instagram / Threads / Bluesky)

[FILL IN]

## REDDIT TITLE

[FILL IN]

## REDDIT HOOK

[FILL IN]

## YOUTUBE SHORT HOOK

[FILL IN]
`;

  if (dryRun) {
    console.log('--- DRY RUN: would write to', filepath);
    console.log(content);
    return filepath;
  }

  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  fs.writeFileSync(filepath, content, 'utf-8');
  console.log(`Written: ${filepath}`);
  return filepath;
}
```

- [ ] Step 2: Commit — `git commit -m "feat: add steam-pulse write-markdown module"`

---

### Task 7: Create generate-report.ts (Main Entry Point)

**Files:**
- Create: `scripts/steam-pulse/generate-report.ts`

- [ ] Step 1: Create `scripts/steam-pulse/generate-report.ts`:

```typescript
import 'dotenv/config';
import { fetchLatestReport } from './fetch-report.ts';
import { loadPreviousWeek } from './load-previous.ts';
import { computeScores } from './compute-scores.ts';
import { writeMarkdown } from './write-markdown.ts';
import path from 'node:path';
import fs from 'node:fs';
import matter from 'gray-matter';

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  console.log('Steam Pulse Report Generator');
  console.log(isDryRun ? '(DRY RUN — no files will be written)' : '');

  // Step 1: Fetch latest CloudFront report
  console.log('Fetching latest report from CloudFront...');
  const { filename, report } = await fetchLatestReport();
  console.log(`  Fetched: ${filename} (${report.games.length} games)`);

  // Step 2: Load previous week's scores for delta calculation
  const previous = loadPreviousWeek();
  if (previous) {
    console.log(`  Previous week: Week ${previous.week} (hit rate: ${previous.hit_rate}%)`);
  } else {
    console.log('  No previous week found — delta will be 0 for all items');
  }

  // Step 3: Compute scores
  const scores = computeScores(report, previous);

  // Compute hit_rate_delta vs previous week
  scores.hit_rate_delta = previous
    ? scores.hit_rate - previous.hit_rate
    : 0;

  console.log(`  Total releases: ${scores.total_releases}`);
  console.log(`  Hit rate: ${scores.hit_rate}% (delta: ${scores.hit_rate_delta > 0 ? '+' : ''}${scores.hit_rate_delta})`);
  console.log(`  Top genre: ${scores.genres[0]?.name} (${scores.genres[0]?.score})`);
  console.log(`  Top tag: ${scores.tags[0]?.name} (${scores.tags[0]?.score})`);

  // Step 4: Determine week number
  // Derive from previous week + 1, or parse from report filename, or prompt
  let weekNumber: number;
  if (previous) {
    weekNumber = previous.week + 1;
  } else {
    // Extract from filename: report_YYYYMMDD_HHmmss.json
    const match = filename.match(/report_(\d{4})(\d{2})(\d{2})/);
    if (match) {
      // Use ISO week number as fallback
      const d = new Date(`${match[1]}-${match[2]}-${match[3]}`);
      weekNumber = getISOWeekNumber(d);
      console.log(`  Inferred week number from date: ${weekNumber}`);
    } else {
      weekNumber = 1;
      console.log('  Could not infer week number — defaulting to 1');
    }
  }

  // Step 5: Derive date and period from report filename or generated_at
  const reportDate = report.period_end
    ? new Date(report.period_end)
    : extractDateFromFilename(filename);

  const dateStr = reportDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const period = formatPeriod(reportDate); // DD/MM/YY

  // Step 6: Write markdown
  writeMarkdown(
    {
      week: weekNumber,
      date: dateStr,
      period,
      report_file: filename,
      scores,
    },
    isDryRun
  );

  if (!isDryRun) {
    console.log('\nNext steps:');
    console.log(`  1. Open src/content/steam-pulse/week-${weekNumber}.md`);
    console.log('  2. Fill in WEEKLY TAKE, TREND TAKE, SITE SUBTITLE, and social copy');
    console.log('  3. Commit and push — Astro build will pick it up automatically');
  }
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function extractDateFromFilename(filename: string): Date {
  const match = filename.match(/report_(\d{4})(\d{2})(\d{2})/);
  if (match) {
    return new Date(`${match[1]}-${match[2]}-${match[3]}`);
  }
  return new Date();
}

function formatPeriod(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = String(date.getFullYear()).slice(2);
  return `${d}/${m}/${y}`;
}

main().catch(err => {
  console.error('Generator failed:', err.message);
  process.exit(1);
});
```

- [ ] Step 2: Test with dry run:
  ```bash
  npm run steam-pulse:generate:dry
  ```
  Confirm it prints scored data to stdout with no file write errors.

- [ ] Step 3: Commit — `git commit -m "feat: add steam-pulse generate-report main entry point"`

---

### Task 8: Cron Setup

**Files:**
- Create: `cron/steam-pulse.cron`

- [ ] Step 1: Create `cron/steam-pulse.cron` with the following content. This file is documentation + a copy-paste reference — it is not executed directly by the repo.

```
# Steam Pulse Weekly Report Generator
# Runs every Sunday at 00:05 local time
# (5-minute offset avoids exactly-midnight contention)
#
# ┌───────────── minute (0–59)
# │ ┌───────────── hour (0–23)
# │ │ ┌───────────── day of month (1–31)
# │ │ │ ┌───────────── month (1–12)
# │ │ │ │ ┌───────────── day of week (0=Sun, 6=Sat)
# │ │ │ │ │
  5 0 * * 0  cd /path/to/wise-goose-games.github.io && npm run steam-pulse:generate >> logs/steam-pulse.log 2>&1

# ─── SETUP INSTRUCTIONS ───────────────────────────────────────────────────────
#
# LINUX (crontab):
#   1. Run: crontab -e
#   2. Paste the cron line above, replacing /path/to/ with your actual repo path
#   3. Save and exit
#   4. Verify: crontab -l
#
# macOS (launchd plist — recommended over crontab on macOS):
#   Create ~/Library/LaunchAgents/com.wisegoosegames.steampulse.plist:
#
#   <?xml version="1.0" encoding="UTF-8"?>
#   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "...">
#   <plist version="1.0">
#   <dict>
#     <key>Label</key>
#     <string>com.wisegoosegames.steampulse</string>
#     <key>ProgramArguments</key>
#     <array>
#       <string>/usr/local/bin/node</string>
#       <string>/path/to/repo/scripts/steam-pulse/generate-report.ts</string>
#     </array>
#     <key>StartCalendarInterval</key>
#     <dict>
#       <key>Weekday</key><integer>0</integer>
#       <key>Hour</key><integer>0</integer>
#       <key>Minute</key><integer>5</integer>
#     </dict>
#     <key>StandardOutPath</key>
#     <string>/path/to/repo/logs/steam-pulse.log</string>
#     <key>StandardErrorPath</key>
#     <string>/path/to/repo/logs/steam-pulse-error.log</string>
#     <key>EnvironmentVariables</key>
#     <dict>
#       <key>CLOUDFRONT_REPORT_URL</key>
#       <string>https://d1017lpxhotn9a.cloudfront.net/reports</string>
#     </dict>
#   </dict>
#   </plist>
#
#   Load it: launchctl load ~/Library/LaunchAgents/com.wisegoosegames.steampulse.plist
#   Unload:  launchctl unload ~/Library/LaunchAgents/com.wisegoosegames.steampulse.plist
#
# NOTE: The generator only writes the markdown file. The human must:
#   1. Open the written file and fill editorial sections
#   2. Run `git add` and `git commit`
#   3. Push — GitHub Actions (or Netlify/Vercel) will rebuild automatically
```

- [ ] Step 2: Create `logs/` directory with a `.gitkeep`:
  ```bash
  mkdir -p logs && touch logs/.gitkeep
  ```
  Add `logs/*.log` to `.gitignore`.

- [ ] Step 3: Commit — `git commit -m "chore: add steam-pulse cron documentation and logs dir"`

---

## Cross-Plan Notes

- **Plan 1 dependency:** The Zod schema in `src/content/config.ts` (Plan 1) defines the contract this generator must satisfy. If the schema changes (e.g., new required fields), `write-markdown.ts` must be updated to match.
- **Plan 3 dependency:** The export script (Plan 3) depends on the content files generated by this pipeline — run this pipeline first, fill editorial sections, then run exports.
- **`delta` as integer:** The markdown frontmatter stores `delta` as a plain integer (e.g., `delta: 22`, `delta: -31`). The Zod schema uses `z.number()` (not string). Do not add `+` sign to YAML values.
- **First run:** On the very first run with no previous week data, all deltas will be 0 and `hit_rate_delta` will be 0. This is correct behavior — the second run will have real deltas.
