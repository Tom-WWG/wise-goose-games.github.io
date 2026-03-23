import { isGenreTag } from './tag-names.js';
import type { ReportFile } from './fetch-report.js';

export interface TagStats {
  tagId: string;
  name: string;
  total_games: number;
  hits: number;
  success_rate: number;        // 0–100
  avg_revenue: number;         // USD / month (raw from report)
  revenue_potential: number;   // normalized 0–100
  trend_momentum: number;      // normalized 0–100
  composite: number;           // final composite score 0–100 (includes momentum)
  baseComposite: number;       // composite with neutral TM=50 — stored in markdown for next-week delta
  delta: number;               // pts vs previous week (signed integer)
  trend: 'rising' | 'stable' | 'declining';
  isGenre: boolean;
  top_games: Array<{
    app_id: number;
    title: string;
    classification: 'hit' | 'promising' | 'niche' | 'miss';
    revenue_estimate: number;
  }>;
}

export interface ComputedReport {
  total_releases: number;
  hit_count: number;
  promising_count: number;
  niche_count: number;
  hit_rate: number;
  genres: TagStats[];    // top 5 genre tags by composite, descending
  tags: TagStats[];      // top 5 non-genre tags by composite, descending
  rising: Array<{ tag: string; delta: number }>;
  saturating: Array<{ tag: string; delta: number }>;
  niches: Array<{ tag: string; success_rate: number; game_count: number }>;
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.round(((value - min) / (max - min)) * 100);
}

function mapHitClass(hitClass: string): 'hit' | 'promising' | 'niche' | 'miss' {
  switch (hitClass.toUpperCase()) {
    case 'HIT':       return 'hit';
    case 'PROMISING': return 'promising';
    case 'NICHE':     return 'niche';
    default:          return 'miss';
  }
}

export function computeScores(
  report: ReportFile,
  previousScores: Record<string, number>
): ComputedReport {
  // Use pre-computed tag stats from the CloudFront report
  const tagEntries = Object.values(report.tags).filter(t => t.total_games >= 2);

  // Normalize avg_revenue across all qualifying tags
  const revenues = tagEntries.map(t => t.avg_revenue);
  const minRev = Math.min(...revenues);
  const maxRev = Math.max(...revenues);

  const withScores: TagStats[] = tagEntries.map(t => {
    const revenue_potential = normalize(t.avg_revenue, minRev, maxRev);
    const prevScore = previousScores[t.tag_name] ?? null;

    // Bootstrap composite using neutral TM=50 to get a stable base for delta.
    // Delta compares this neutral-momentum composite against the stored prevScore,
    // which was also computed with TM=50 when it was first written (or the actual
    // prior-week composite). We use the neutral base on BOTH sides so the comparison
    // is apples-to-apples: pure SR+RP signal without momentum compounding.
    const baseComposite = Math.round(t.success_rate * 0.5 + revenue_potential * 0.3 + 50 * 0.2);
    const delta = prevScore !== null ? baseComposite - prevScore : 0;
    const clampedDelta = Math.max(-100, Math.min(100, delta));
    const trend_momentum = Math.round((clampedDelta + 100) / 2); // 0–100

    // Final composite with momentum factored in
    const composite = Math.round(
      t.success_rate * 0.5 + revenue_potential * 0.3 + trend_momentum * 0.2
    );
    const trend: 'rising' | 'stable' | 'declining' =
      delta > 5 ? 'rising' : delta < -5 ? 'declining' : 'stable';

    // Top games from example_list: [title, hit_class, revenue, appid]
    const top_games = t.example_list.slice(0, 3).map(([title, hit_class, revenue, appid]) => ({
      app_id: appid,
      title,
      classification: mapHitClass(hit_class),
      revenue_estimate: Math.round(revenue),
    }));

    return {
      tagId: String(t.tag_id),
      name: t.tag_name,
      total_games: t.total_games,
      hits: t.hits,
      success_rate: t.success_rate,
      avg_revenue: t.avg_revenue,
      revenue_potential,
      trend_momentum,
      composite,
      // baseComposite is stored in markdown as the "score" field so that next
      // week's delta compares neutral-momentum values on both sides (apples-to-apples).
      baseComposite,
      delta,
      trend,
      isGenre: isGenreTag(t.tag_name),
      top_games,
    };
  });

  // Sort descending by composite
  const sorted = [...withScores].sort((a, b) => b.composite - a.composite);

  const genres = sorted.filter(t => t.isGenre).slice(0, 5);
  const tags   = sorted.filter(t => !t.isGenre).slice(0, 5);

  // Rising: delta > 5, top 3
  const rising = sorted
    .filter(t => t.delta > 5)
    .slice(0, 3)
    .map(t => ({ tag: t.name, delta: t.delta }));

  // Saturating: composite dropped at least 5pts WoW, minimum 3 games.
  // NOTE: threshold intentionally mirrors rising (>5) — total_games >= 3 matches
  // the minimum qualifying floor used elsewhere, since 7-day windows rarely produce
  // more than 4–6 games per tag even in busy weeks.
  const saturating = sorted
    .filter(t => t.delta < -5 && t.total_games >= 3)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 3)
    .map(t => ({ tag: t.name, delta: t.delta }));

  // Emerging niches: success_rate >= 50, total_games <= 15
  const niches = sorted
    .filter(t => t.success_rate >= 50 && t.total_games <= 15)
    .slice(0, 3)
    .map(t => ({ tag: t.name, success_rate: t.success_rate, game_count: t.total_games }));

  // Overall stats from report meta
  const { total: total_releases, hits: hit_count, promising: promising_count, niche: niche_count } = report.meta.stats;
  const hit_rate = Math.round((hit_count / total_releases) * 100);

  return {
    total_releases,
    hit_count,
    promising_count,
    niche_count,
    hit_rate,
    genres,
    tags,
    rising,
    saturating,
    niches,
  };
}
