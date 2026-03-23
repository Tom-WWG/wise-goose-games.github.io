import { defineCollection, z } from 'astro:content';

const topGame = z.object({
  app_id: z.number().int().positive(),
  title: z.string(),
  classification: z.enum(['hit', 'promising', 'niche', 'miss']),
  revenue_estimate: z.number(),
});

const scoredItem = z.object({
  name: z.string(),
  score: z.number().min(0).max(100),
  trend: z.enum(['rising', 'stable', 'declining']),
  top_games: z.array(topGame).max(5).optional(),
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
