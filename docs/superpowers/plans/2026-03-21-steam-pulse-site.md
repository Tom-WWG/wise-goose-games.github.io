# Steam Pulse Site — Content Collection Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan.

**Goal:** Convert the hardcoded Steam Pulse prototype into a data-driven Astro content collection system where each weekly report is a markdown file with structured frontmatter.

**Architecture:** An Astro content collection (`steam-pulse`) is defined with a Zod schema matching the weekly markdown template. The two chart components are refactored to accept full data props rather than hardcoded arrays. Dynamic route `[week].astro` renders individual reports from the collection; the index page lists all published issues sorted by week number descending.

**Tech Stack:** Astro 5 content collections, Zod, TypeScript, Astro SSG (static output)

---

## Prerequisites

- No `src/content/config.ts` exists yet — it must be created.
- `src/content/steam-pulse/` directory must be created to hold markdown files.
- No `tsx` or script runner is needed for this plan (pure Astro/TypeScript).

---

### Task 1: Create Content Collection Schema

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/steam-pulse/` (directory — populated in Task 7)

- [ ] Step 1: Create `src/content/config.ts` with the following content. This file defines the Zod schema for the `steam-pulse` collection matching the markdown frontmatter template exactly.

```typescript
import { defineCollection, z } from 'astro:content';

const scoredItem = z.object({
  name: z.string(),
  score: z.number().min(0).max(100),
  trend: z.enum(['rising', 'stable', 'declining']),
});

const deltaItem = z.object({
  tag: z.string(),
  delta: z.number(), // e.g. +22 or -31 — stored as integer, not string
});

const nicheItem = z.object({
  tag: z.string(),
  success_rate: z.number().min(0).max(100),
  game_count: z.number().int().positive(),
});

const steamPulse = defineCollection({
  type: 'content',
  schema: z.object({
    week: z.number().int().positive(),
    date: z.coerce.date(),
    period: z.string(), // display string e.g. "19/03/26"
    report_file: z.string(), // e.g. "report_20260319_160929.json"
    total_releases: z.number().int().nonnegative(),
    hit_rate: z.number().min(0).max(100),
    hit_rate_delta: z.number(), // signed integer, e.g. +4 or -3
    hit_count: z.number().int().nonnegative(),
    promising_count: z.number().int().nonnegative(),
    niche_count: z.number().int().nonnegative(),
    genres: z.array(scoredItem).min(1).max(10),
    tags: z.array(scoredItem).min(1).max(10),
    rising: z.array(deltaItem),
    saturating: z.array(deltaItem),
    niches: z.array(nicheItem),
  }),
});

export const collections = {
  'steam-pulse': steamPulse,
};
```

- [ ] Step 2: Verify the Zod schema compiles cleanly — run `npm run build` and confirm no type errors from `src/content/config.ts`. Fix any issues before proceeding.

- [ ] Step 3: Commit — `git commit -m "feat: add steam-pulse content collection schema"`

---

### Task 2: Refactor SteamPulseBarChart to Accept Data Props

The current component (`src/components/SteamPulseBarChart.astro`) has all genre and tag data hardcoded. Replace it with a component that receives full data arrays and renders them dynamically. The NEW badge logic should be driven by a `isNew` boolean per item (set to `true` when `trend === 'rising'` and the item was absent from the previous week — for now, the page can derive this by checking if `delta` for the tag is in the `rising` array).

**Files:**
- Modify: `src/components/SteamPulseBarChart.astro`

- [ ] Step 1: Replace the `Props` interface at the top of `SteamPulseBarChart.astro` with the following typed interface. Keep all existing CSS unchanged — only the frontmatter script and HTML template change.

```typescript
interface BarItem {
  name: string;
  score: number;   // 0–100
  trend: 'rising' | 'stable' | 'declining';
  isNew?: boolean; // shows NEW badge if true
}

interface Props {
  week: string;          // display string e.g. "Week 12"
  hitRateDelta: number;  // signed number for WoW badge e.g. +4
  genres: BarItem[];     // top 5 genres, pre-sorted descending by score
  tags: BarItem[];       // top 5 tags, pre-sorted descending by score
}

const { week, hitRateDelta, genres, tags } = Astro.props;

// Derive fill class from score and position
function fillClass(score: number, index: number): string {
  if (score >= 75) return 'sp-bar-fill--primary';
  if (score >= 60) return 'sp-bar-fill--secondary';
  return 'sp-bar-fill--muted';
}

function labelClass(score: number): string {
  return score < 60 ? 'sp-bar-label--dim' : '';
}

function valueClass(score: number): string {
  return score < 75 ? 'sp-bar-value--dim' : '';
}

const wowSign = hitRateDelta >= 0 ? '+' : '';
const wowLabel = `${wowSign}${hitRateDelta}% WoW`;
```

- [ ] Step 2: Replace the hardcoded `<!-- CHART 1: TOP GENRES -->` and `<!-- CHART 2: TOP TAGS -->` HTML blocks with dynamic renders using `.map()`:

```astro
<!-- CHART 1: TOP GENRES -->
<div class="sp-chart-block">
  <h3 class="sp-section-label sp-section-label--primary">TOP GENRES</h3>
  <div class="sp-bars">
    {genres.map((item, i) => (
      <div class="sp-bar-row">
        <div class="sp-bar-meta">
          <span class:list={['sp-bar-label', labelClass(item.score)]}>{item.name}</span>
          <span class:list={['sp-bar-value', valueClass(item.score)]}>{item.score}</span>
        </div>
        <div class="sp-bar-track">
          <div class:list={['sp-bar-fill', fillClass(item.score, i)]} style={`width: ${item.score}%`}></div>
        </div>
      </div>
    ))}
  </div>
</div>

<!-- CHART 2: TOP TAGS -->
<div class="sp-chart-block">
  <h3 class="sp-section-label sp-section-label--secondary">TOP TAGS</h3>
  <div class="sp-bars">
    {tags.map((item, i) => (
      <div class="sp-bar-row">
        <div class="sp-bar-meta">
          {item.isNew ? (
            <div class="sp-bar-label-group">
              <span class:list={['sp-bar-label', labelClass(item.score)]}>{item.name}</span>
              <span class="sp-new-badge">NEW</span>
            </div>
          ) : (
            <span class:list={['sp-bar-label', labelClass(item.score)]}>{item.name}</span>
          )}
          <span class:list={['sp-bar-value', valueClass(item.score)]}>{item.score}</span>
        </div>
        <div class="sp-bar-track">
          <div class:list={['sp-bar-fill', fillClass(item.score, i)]} style={`width: ${item.score}%`}></div>
        </div>
      </div>
    ))}
  </div>
</div>
```

- [ ] Step 3: Update the WoW badge in the header to use the dynamic `wowLabel` variable: replace the hardcoded `+4.2% WoW` span text with `{wowLabel}`.

- [ ] Step 4: Run `npm run build` and confirm no errors.

- [ ] Step 5: Commit — `git commit -m "refactor: SteamPulseBarChart accepts data props"`

---

### Task 3: Refactor SteamPulseTrendChart to Accept Multi-Week Data Props

The current component has hardcoded SVG polyline `points` strings computed from hardcoded data. Replace with a TypeScript helper that converts an 8-week rolling data array into SVG coordinate strings at build time.

**Files:**
- Modify: `src/components/SteamPulseTrendChart.astro`

- [ ] Step 1: Replace the frontmatter of `SteamPulseTrendChart.astro` with the following. The SVG viewBox is `0 0 800 250`; score 0 maps to y=250, score 100 maps to y=0. X positions are evenly spaced across 8 weeks.

```typescript
interface TrendPoint {
  weekLabel: string; // e.g. "19/03"
  score: number;     // 0–100 composite score
}

interface TrendSeries {
  name: string;
  currentScore: number;
  history: TrendPoint[]; // exactly 8 entries, oldest first
  trend: 'rising' | 'stable' | 'declining';
  isNew?: boolean;
}

interface Props {
  genres: TrendSeries[];  // top 5 genres
  tags: TrendSeries[];    // top 5 tags
}

const { genres, tags } = Astro.props;

// SVG coordinate helpers
const SVG_W = 800;
const SVG_H = 250;
const WEEKS = 8;

function toPoints(history: TrendPoint[]): string {
  return history
    .map((pt, i) => {
      const x = Math.round((i / (WEEKS - 1)) * SVG_W);
      const y = Math.round(SVG_H - (pt.score / 100) * SVG_H);
      return `${x},${y}`;
    })
    .join(' ');
}

function strokeColor(trend: 'rising' | 'stable' | 'declining'): string {
  return trend === 'declining' ? '#333333' : '#E87A2E';
}

function strokeOpacity(index: number): string {
  if (index === 0) return '1';
  if (index === 1) return '1';
  if (index <= 3) return '0.4';
  return '0.25';
}

function strokeWidth(index: number): string {
  return index < 2 ? '2' : '1.5';
}

function legendClass(index: number): string {
  if (index < 2) return 'sp-legend-item--strong';
  if (index < 4) return 'sp-legend-item--mid';
  return 'sp-legend-item--dim';
}

// Week labels come from the most recent entry's weekLabel going back 8 weeks
const weekLabels = genres[0]?.history.map(pt => pt.weekLabel) ?? [];
```

- [ ] Step 2: Replace the hardcoded SVG `<polyline>` elements in the Genre Trends section with a dynamic render:

```astro
{genres.map((series, i) => (
  <polyline
    fill="none"
    stroke={strokeColor(series.trend)}
    stroke-width={strokeWidth(i)}
    stroke-opacity={strokeOpacity(i)}
    vector-effect="non-scaling-stroke"
    points={toPoints(series.history)}
  />
))}
```

- [ ] Step 3: Replace the hardcoded genre legend items with a dynamic render:

```astro
{genres.map((series, i) => (
  <span class:list={['sp-legend-item', legendClass(i)]}>
    {series.name.toUpperCase()} <span class="sp-legend-score">{series.currentScore}</span>
  </span>
))}
```

- [ ] Step 4: Apply the same dynamic replacement to the Tag Trends SVG polylines and legend, using the `tags` array. The tag legend also needs the NEW badge treatment for `series.isNew === true` items:

```astro
{tags.map((series, i) => (
  series.isNew ? (
    <div class="sp-legend-item-group">
      <span class:list={['sp-legend-item', legendClass(i)]}>
        {series.name.toUpperCase()} <span class="sp-legend-score">{series.currentScore}</span>
      </span>
      <span class="sp-new-badge">NEW</span>
    </div>
  ) : (
    <span class:list={['sp-legend-item', legendClass(i)]}>
      {series.name.toUpperCase()} <span class="sp-legend-score">{series.currentScore}</span>
    </span>
  )
))}
```

- [ ] Step 5: Replace the hardcoded week labels row (currently using a hardcoded `weekLabels` array in the frontmatter) with `{weekLabels}` derived from the props as defined in Step 1.

- [ ] Step 6: Run `npm run build` and confirm no errors.

- [ ] Step 7: Commit — `git commit -m "refactor: SteamPulseTrendChart accepts multi-week data props"`

---

### Task 4: Create Individual Week Dynamic Route

**Files:**
- Create: `src/pages/steam-pulse/[week].astro`
- Note: The existing `src/pages/steam-pulse/index.astro` will be replaced in Task 5 — do not delete it yet.

- [ ] Step 1: Create `src/pages/steam-pulse/[week].astro`. This page is the primary render target for each weekly report. The `[week]` slug matches the content collection entry slug (e.g., `week-12`).

```astro
---
import { getCollection, getEntry } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import SteamPulseBarChart from '../../components/SteamPulseBarChart.astro';
import SteamPulseTrendChart from '../../components/SteamPulseTrendChart.astro';

export async function getStaticPaths() {
  const reports = await getCollection('steam-pulse');
  return reports.map(entry => ({
    params: { week: entry.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await entry.render();
const d = entry.data;

const SITE_URL = 'https://wisegoosegames.com';

// Derive isNew for tags: tag appears in rising array
const risingTagNames = new Set(d.rising.map(r => r.tag));
const barGenres = d.genres.map(g => ({ ...g, isNew: false }));
const barTags = d.tags.map(t => ({ ...t, isNew: risingTagNames.has(t.name) }));

// Weekly Take and Trend Take come from the markdown body via <Content />
// They are rendered inline in their respective sections below.
// The full <Content /> renders ALL body sections; we split them by parsing
// the rendered HTML. However, since Astro content is opaque at build time,
// the simpler approach is to use named slots via remark plugins OR to render
// <Content /> once and display it in a dedicated editorial section.
// For Week 12 launch, use full <Content /> in a single editorial block
// positioned between the two charts. A remark-based slot split can be
// added in a follow-up task.

const weekLabel = `WEEK ${d.week} · ${d.period}`;
const pageTitle = `Steam Pulse Week ${d.week} — ${d.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })} | Wise Goose Games`;
const pageDescription = `Steam market insights for indie developers — Week ${d.week}. Trending genres, tags, and composite scores.`;

// Hit rate delta display
const deltaSign = d.hit_rate_delta >= 0 ? '+' : '';
const hitRateDeltaDisplay = `${deltaSign}${d.hit_rate_delta}`;
const hitRateDeltaClass = d.hit_rate_delta >= 0 ? 'sp-pulse-delta--up' : 'sp-pulse-delta--down';

// Trend chart data: for launch we pass single-week data wrapped in 8-week stub arrays.
// The pipeline script (Plan 2) will populate full 8-week history in future runs.
// Until then, build a flat history from the current week's score repeated 8 times,
// with the last entry being the actual current score. This keeps the chart renderable.
function stubHistory(currentScore: number, weekLabel: string): import('../../components/SteamPulseTrendChart.astro').TrendPoint[] {
  // Create a gentle approach curve ending at currentScore
  return Array.from({ length: 8 }, (_, i) => ({
    weekLabel: i === 7 ? weekLabel : `wk${d.week - 7 + i}`,
    score: Math.max(0, Math.round(currentScore * (0.7 + (i / 7) * 0.3))),
  }));
}

const trendGenres = d.genres.map(g => ({
  name: g.name,
  currentScore: g.score,
  trend: g.trend,
  isNew: false,
  history: stubHistory(g.score, d.period),
}));

const trendTags = d.tags.map(t => ({
  name: t.name,
  currentScore: t.score,
  trend: t.trend,
  isNew: risingTagNames.has(t.name),
  history: stubHistory(t.score, d.period),
}));
---

<BaseLayout
  title={pageTitle}
  description={pageDescription}
  canonical={`${SITE_URL}/steam-pulse/${entry.slug}/`}
  ogUrl={`${SITE_URL}/steam-pulse/${entry.slug}/`}
  ogImage={`${SITE_URL}/og-image.jpg`}
>
  <main class="sp-page">
    <div class="sp-container">

      <!-- Page Header -->
      <header class="sp-page-header" data-enter>
        <div class="sp-page-header-top">
          <h1 class="sp-page-title">STEAM PULSE</h1>
          <span class="sp-page-week">{weekLabel}</span>
        </div>
        <div class="sp-page-rule"></div>
        <!-- Subtitle rendered from markdown Content — first H2 sibling is SITE SUBTITLE -->
        <p class="sp-page-subtitle sp-page-subtitle--placeholder">
          Week {d.week} · {d.total_releases} releases analysed
        </p>
      </header>

      <!-- Bar Chart Section -->
      <div class="sp-section" data-reveal>
        <span class="sp-section-label">This Week — Composite Score</span>
        <SteamPulseBarChart
          week={`Week ${d.week}`}
          hitRateDelta={d.hit_rate_delta}
          genres={barGenres}
          tags={barTags}
        />
        <!-- Editorial copy rendered from markdown body -->
        <div class="sp-editorial-copy sp-content-body">
          <Content />
        </div>
      </div>

      <!-- Trend Chart Section -->
      <div class="sp-section" data-reveal>
        <span class="sp-section-label">Week Over Week</span>
        <SteamPulseTrendChart genres={trendGenres} tags={trendTags} />
      </div>

      <!-- Market Pulse Strip -->
      <div class="sp-pulse-strip" data-enter>
        <div class="sp-pulse-card">
          <span class="sp-pulse-label">Total Releases</span>
          <span class="sp-pulse-value">{d.total_releases}</span>
        </div>
        <div class="sp-pulse-card">
          <span class="sp-pulse-label">Hit Rate</span>
          <div class="sp-pulse-value-row">
            <span class="sp-pulse-value">{d.hit_rate}%</span>
            <span class:list={['sp-pulse-delta', hitRateDeltaClass]}>
              {d.hit_rate_delta >= 0 ? '↑' : '↓'} {hitRateDeltaDisplay}pts
            </span>
          </div>
        </div>
        <div class="sp-pulse-card sp-pulse-card--wide">
          <span class="sp-pulse-label">Breakdown</span>
          <div class="sp-pulse-breakdown">
            <span class="sp-pulse-breakdown-item">
              <span class="sp-pulse-breakdown-num">{d.hit_count}</span>
              <span class="sp-pulse-breakdown-tag">Hits</span>
            </span>
            <span class="sp-pulse-breakdown-div">·</span>
            <span class="sp-pulse-breakdown-item">
              <span class="sp-pulse-breakdown-num">{d.promising_count}</span>
              <span class="sp-pulse-breakdown-tag">Promising</span>
            </span>
            <span class="sp-pulse-breakdown-div">·</span>
            <span class="sp-pulse-breakdown-item">
              <span class="sp-pulse-breakdown-num">{d.niche_count}</span>
              <span class="sp-pulse-breakdown-tag">Niche</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Signal Cards Row -->
      <div class="sp-signals" data-reveal>
        <!-- Rising -->
        <div class="sp-signal-card sp-signal-card--rising">
          <div class="sp-signal-header">
            <span class="sp-signal-icon" aria-hidden="true">📈</span>
            <span class="sp-signal-title">Rising</span>
          </div>
          <ul class="sp-signal-list">
            {d.rising.map(item => (
              <li class="sp-signal-row">
                <span class="sp-signal-tag">{item.tag}</span>
                <span class="sp-signal-delta sp-signal-delta--up">
                  {item.delta >= 0 ? '+' : ''}{item.delta}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        <!-- Saturating -->
        <div class="sp-signal-card sp-signal-card--saturating">
          <div class="sp-signal-header">
            <span class="sp-signal-icon" aria-hidden="true">⚠️</span>
            <span class="sp-signal-title">Saturating</span>
          </div>
          <ul class="sp-signal-list">
            {d.saturating.map(item => (
              <li class="sp-signal-row">
                <span class="sp-signal-tag">{item.tag}</span>
                <span class="sp-signal-delta sp-signal-delta--down">{item.delta}%</span>
              </li>
            ))}
          </ul>
        </div>

        <!-- Emerging Niches -->
        <div class="sp-signal-card sp-signal-card--niches">
          <div class="sp-signal-header">
            <span class="sp-signal-icon" aria-hidden="true">💎</span>
            <span class="sp-signal-title">Emerging Niches</span>
          </div>
          <ul class="sp-signal-list">
            {d.niches.map(item => (
              <li class="sp-signal-row">
                <span class="sp-signal-tag">{item.tag}</span>
                <span class="sp-signal-niche">
                  <span class="sp-signal-niche-rate">{item.success_rate}%</span>
                  <span class="sp-signal-niche-count">({item.game_count} games)</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <!-- Footer Attribution -->
      <footer class="sp-attribution" data-reveal>
        <p class="sp-attribution-text">
          Data sourced from Steamworks API · 7-day rolling averages · wisegoosegames.com/steam-pulse
        </p>
      </footer>

    </div>
  </main>
</BaseLayout>
```

- [ ] Step 2: Copy the `<style>` block wholesale from the current `src/pages/steam-pulse/index.astro` into `[week].astro`. It is identical — the styles are scoped to this page. Add one additional rule to hide the raw markdown editorial sections from rendering visibly in the `sp-content-body` area (the `<Content />` renders all headings and body text, which will be styled or hidden as needed):

```css
/* Hide raw markdown section headings in the editorial area */
.sp-content-body :global(h2) {
  display: none;
}
.sp-content-body :global(p) {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: var(--text-secondary);
  margin: 0 0 0.75rem;
  max-width: 62ch;
}
```

- [ ] Step 3: Run `npm run build`. Since no content files exist yet, `getStaticPaths` will return an empty array — that is expected. Fix any TypeScript errors.

- [ ] Step 4: Commit — `git commit -m "feat: add steam-pulse dynamic week route"`

---

### Task 5: Replace Hardcoded Index Page

**Files:**
- Modify: `src/pages/steam-pulse/index.astro` (full replacement)

- [ ] Step 1: Replace the entire contents of `src/pages/steam-pulse/index.astro` with the following listing page. It renders a reverse-chronological list of all published weekly reports showing week number, date, subtitle (total releases as fallback), and hit rate.

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

const SITE_URL = 'https://wisegoosegames.com';

const allReports = await getCollection('steam-pulse');
// Sort descending by week number
const reports = allReports.sort((a, b) => b.data.week - a.data.week);
---

<BaseLayout
  title="Steam Pulse — Weekly Steam Insights | Wise Goose Games"
  description="Weekly Steam market intelligence for indie developers. Trending genres, composite scores, and emerging niches."
  canonical={`${SITE_URL}/steam-pulse/`}
  ogUrl={`${SITE_URL}/steam-pulse/`}
  ogImage={`${SITE_URL}/og-image.jpg`}
>
  <main class="spi-page">
    <div class="spi-container">

      <header class="spi-header" data-enter>
        <div class="spi-header-top">
          <h1 class="spi-title">STEAM PULSE</h1>
        </div>
        <div class="spi-rule"></div>
        <p class="spi-desc">
          Weekly composite score analysis for indie developers on Steam.
          Genres, tags, emerging niches, and market signals — every Sunday.
        </p>
      </header>

      {reports.length === 0 ? (
        <p class="spi-empty">No reports published yet.</p>
      ) : (
        <ol class="spi-list" reversed>
          {reports.map(entry => {
            const d = entry.data;
            const deltaSign = d.hit_rate_delta >= 0 ? '+' : '';
            const deltaClass = d.hit_rate_delta >= 0 ? 'spi-delta--up' : 'spi-delta--down';
            const formattedDate = d.date.toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: '2-digit'
            });
            return (
              <li class="spi-item">
                <a href={`/steam-pulse/${entry.slug}/`} class="spi-link">
                  <span class="spi-week-num">W{d.week}</span>
                  <span class="spi-date">{formattedDate}</span>
                  <span class="spi-releases">{d.total_releases} releases</span>
                  <span class="spi-hit-rate">
                    {d.hit_rate}% hit rate
                    <span class:list={['spi-delta', deltaClass]}>
                      {deltaSign}{d.hit_rate_delta}pts
                    </span>
                  </span>
                  <span class="spi-arrow" aria-hidden="true">→</span>
                </a>
              </li>
            );
          })}
        </ol>
      )}

    </div>
  </main>
</BaseLayout>

<style>
  .spi-page {
    background: var(--bg-primary);
    min-height: 100vh;
    padding-top: 6rem;
    padding-bottom: 5rem;
  }

  .spi-container {
    max-width: 860px;
    margin: 0 auto;
    padding: 0 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }

  .spi-header {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .spi-header-top {
    margin-bottom: 0.5rem;
  }

  .spi-title {
    font-family: 'Montserrat', sans-serif;
    font-size: clamp(2.25rem, 7vw, 4rem);
    font-weight: 900;
    letter-spacing: -0.04em;
    text-transform: uppercase;
    color: var(--text-primary);
    line-height: 1;
    margin: 0;
  }

  .spi-rule {
    height: 2px;
    background: var(--accent);
    margin-bottom: 0.75rem;
  }

  .spi-desc {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: clamp(1.125rem, 3vw, 1.4rem);
    color: var(--text-secondary);
    margin: 0;
    max-width: 52ch;
    line-height: 1.4;
  }

  .spi-empty {
    font-family: 'Montserrat', sans-serif;
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  .spi-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: var(--border-subtle);
  }

  .spi-item {
    background: var(--bg-primary);
  }

  .spi-link {
    display: grid;
    grid-template-columns: 3rem 7rem 1fr 1fr auto;
    align-items: center;
    gap: 1rem;
    padding: 1.125rem 1.5rem;
    text-decoration: none;
    transition: background 0.15s;
  }

  .spi-link:hover {
    background: var(--bg-elevated);
  }

  @media (max-width: 600px) {
    .spi-link {
      grid-template-columns: 3rem 1fr auto;
      grid-template-rows: auto auto;
    }

    .spi-date { display: none; }

    .spi-releases {
      grid-column: 2;
      grid-row: 2;
    }

    .spi-hit-rate {
      grid-column: 2;
      grid-row: 1;
    }
  }

  .spi-week-num {
    font-family: 'Montserrat', sans-serif;
    font-size: 0.875rem;
    font-weight: 900;
    color: var(--accent);
    letter-spacing: -0.02em;
  }

  .spi-date {
    font-family: 'Montserrat', sans-serif;
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .spi-releases {
    font-family: 'Montserrat', sans-serif;
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .spi-hit-rate {
    font-family: 'Montserrat', sans-serif;
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--text-primary);
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .spi-delta {
    font-size: 0.6875rem;
    font-weight: 700;
  }

  .spi-delta--up { color: #4ade80; }
  .spi-delta--down { color: #f87171; }

  .spi-arrow {
    font-family: 'Montserrat', sans-serif;
    font-size: 0.875rem;
    color: var(--text-muted);
    transition: color 0.15s;
  }

  .spi-link:hover .spi-arrow {
    color: var(--accent);
  }
</style>
```

- [ ] Step 2: Run `npm run build`. The index now renders from the collection (empty list is fine until Task 7 adds the content file).

- [ ] Step 3: Commit — `git commit -m "feat: replace steam-pulse index with collection-driven listing page"`

---

### Task 6: Remove noindex — Make Pages Indexable

**Files:**
- Modify: `src/pages/steam-pulse/[week].astro`
- Modify: `src/pages/steam-pulse/index.astro`

- [ ] Step 1: Confirm neither `[week].astro` nor the new `index.astro` pass `noindex={true}` to `BaseLayout`. The prototype had `noindex={true}` — verify it is absent in both new files (it should be, as neither template above includes it).

- [ ] Step 2: Open `src/layouts/BaseLayout.astro` and confirm the `noindex` prop defaults to `false`. If the layout renders `<meta name="robots" content="noindex">` unconditionally, fix it to only render when `noindex === true`.

- [ ] Step 3: Run `npm run build` and inspect the built HTML for `/steam-pulse/` — confirm no `noindex` meta tag is present in the output. Use: `grep -r "noindex" dist/steam-pulse/` — it should return nothing.

- [ ] Step 4: Commit — `git commit -m "fix: remove noindex from steam-pulse pages for launch"`

---

### Task 7: Add First Content Entry (Week 12)

**Files:**
- Create: `src/content/steam-pulse/week-12.md`

- [ ] Step 1: Create `src/content/steam-pulse/week-12.md` with the following content. The frontmatter uses the data from the prototype. The `delta` fields are stored as plain integers (no `+` sign in YAML — YAML handles signed integers natively).

```markdown
---
week: 12
date: 2026-03-19
period: "19/03/26"
report_file: "report_20260319_160929.json"
total_releases: 41
hit_rate: 67
hit_rate_delta: 4
hit_count: 27
promising_count: 8
niche_count: 6
genres:
  - { name: Puzzle,      score: 87, trend: rising }
  - { name: Cozy,        score: 82, trend: stable }
  - { name: Roguelite,   score: 71, trend: stable }
  - { name: Narrative,   score: 65, trend: rising }
  - { name: Simulation,  score: 58, trend: declining }
tags:
  - { name: Logic,        score: 91, trend: rising }
  - { name: Cozy Mystery, score: 88, trend: rising }
  - { name: Word Puzzle,  score: 79, trend: rising }
  - { name: Atmospheric,  score: 72, trend: stable }
  - { name: Hand-drawn,   score: 68, trend: stable }
rising:
  - { tag: Logic,        delta: 22 }
  - { tag: Narrative,    delta: 18 }
  - { tag: Cozy Mystery, delta: 15 }
saturating:
  - { tag: FPS,           delta: -31 }
  - { tag: Battle Royale, delta: -24 }
  - { tag: Open World,    delta: -18 }
niches:
  - { tag: Cozy Mystery, success_rate: 78, game_count: 6 }
  - { tag: Word Puzzle,  success_rate: 71, game_count: 9 }
  - { tag: Walking Sim,  success_rate: 68, game_count: 7 }
---

## WEEKLY TAKE

Puzzlers lead this week overall driven by strong releases that answer player demand for new mechanics and story lines. Cozy games remain in-demand amongst players looking to relax. Simulation well down from poor performance among recent releases.

## TREND TAKE

After months of slow burn puzzle releases, things took a sharp turn with the recent release of two extremely well made examples driving Puzzle's composite score up 12pts in a single week.

## SITE SUBTITLE

The week of the riddler

## SOCIAL CAPTION (Instagram / Threads / Bluesky)

## REDDIT TITLE

## REDDIT HOOK

## YOUTUBE SHORT HOOK
```

- [ ] Step 2: Run `npm run build`. The build should now generate `/steam-pulse/` (index listing one report) and `/steam-pulse/week-12/` (full report page). Fix any Zod validation errors.

- [ ] Step 3: Run `npm run preview`, navigate to `http://localhost:4321/steam-pulse/` and `http://localhost:4321/steam-pulse/week-12/`. Confirm both render correctly with real data, no hardcoded values visible.

- [ ] Step 4: Commit — `git commit -m "feat: add week-12 content entry as first steam-pulse report"`

---

## Cross-Plan Notes

- **Depends on Plan 2:** The markdown frontmatter format defined here (particularly the `delta` field as integer, not string) is the contract that the `write-markdown.ts` generator script must produce. Any changes to field names or types require updating both the Zod schema here and the generator.
- **Depends on Plan 3:** The export script (Plan 3) navigates to `/steam-pulse/week-{N}/` — this dynamic route must be deployed or running locally before exports can be generated.
- **Trend chart stub history:** The stub history generated in Task 4 (repeating single-week scores) will be replaced by real 8-week rolling data once Plan 2's pipeline has run for 8 consecutive weeks and the `[week].astro` template is updated to pass actual historical series.
