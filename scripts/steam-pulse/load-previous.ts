import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const CONTENT_DIR = path.resolve('src/content/steam-pulse');

export interface PreviousWeekData {
  week: number;
  hit_rate: number | null; // overall hit rate from previous week, for WoW delta
  scores: Record<string, number>; // tag/genre name -> composite score
}

/**
 * Reads the most recent week-N.md file and returns its week number
 * and a map of genre/tag names to composite scores (for delta calculation).
 */
export function loadPreviousWeek(): PreviousWeekData | null {
  if (!fs.existsSync(CONTENT_DIR)) return null;

  const files = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.match(/^week-\d+\.md$/))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] ?? '0');
      const nb = parseInt(b.match(/\d+/)?.[0] ?? '0');
      return nb - na; // descending
    });

  if (files.length === 0) return null;

  const latest = files[0];
  const raw = fs.readFileSync(path.join(CONTENT_DIR, latest), 'utf-8');
  const { data } = matter(raw);

  const scores: Record<string, number> = {};

  // Genres
  if (Array.isArray(data.genres)) {
    for (const g of data.genres) {
      if (g.name && typeof g.score === 'number') {
        scores[g.name] = g.score;
      }
    }
  }
  // Tags
  if (Array.isArray(data.tags)) {
    for (const t of data.tags) {
      if (t.name && typeof t.score === 'number') {
        scores[t.name] = t.score;
      }
    }
  }

  const hit_rate = typeof data.hit_rate === 'number' ? data.hit_rate : null;

  return { week: data.week as number, hit_rate, scores };
}
