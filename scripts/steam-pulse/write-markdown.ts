import fs from 'node:fs';
import path from 'node:path';
import type { ComputedReport } from './compute-scores.js';

const CONTENT_DIR = path.resolve('src/content/steam-pulse');

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

export function writeMarkdown(opts: {
  weekNumber: number;
  reportFilename: string;
  periodDate: string; // ISO date string (period_end from report)
  computed: ComputedReport;
  previousHitRate: number | null;
  dryRun?: boolean;
}): string {
  const { weekNumber, reportFilename, periodDate, computed, previousHitRate, dryRun } = opts;

  const period = formatDate(periodDate);
  const hit_rate_delta = previousHitRate !== null
    ? computed.hit_rate - previousHitRate
    : 0;

  const frontmatter = `---
week: ${weekNumber}
date: ${periodDate.slice(0, 10)}
period: "${period}"
report_file: "${reportFilename}"
total_releases: ${computed.total_releases}
hit_rate: ${computed.hit_rate}
hit_rate_delta: ${hit_rate_delta}
hit_count: ${computed.hit_count}
promising_count: ${computed.promising_count}
niche_count: ${computed.niche_count}
genres:
${computed.genres.map(g => {
  // Emit baseComposite (neutral-TM) as score so next week's delta is apples-to-apples.
  // The display score (composite, which includes momentum) is shown to users.
  const base = `  - name: ${g.name}\n    score: ${g.baseComposite}\n    trend: ${g.trend}`;
  if (!g.top_games?.length) return base;
  const gamesYaml = g.top_games.map(tg =>
    `      - { app_id: ${tg.app_id}, title: "${tg.title.replace(/"/g, '\\"')}", classification: ${tg.classification}, revenue_estimate: ${tg.revenue_estimate} }`
  ).join('\n');
  return `${base}\n    top_games:\n${gamesYaml}`;
}).join('\n')}
tags:
${computed.tags.map(t => {
  const base = `  - name: ${t.name}\n    score: ${t.baseComposite}\n    trend: ${t.trend}`;
  if (!t.top_games?.length) return base;
  const gamesYaml = t.top_games.map(tg =>
    `      - { app_id: ${tg.app_id}, title: "${tg.title.replace(/"/g, '\\"')}", classification: ${tg.classification}, revenue_estimate: ${tg.revenue_estimate} }`
  ).join('\n');
  return `${base}\n    top_games:\n${gamesYaml}`;
}).join('\n')}
rising:${computed.rising.length ? '\n' + computed.rising.map(r =>
  `  - { tag: ${r.tag}, delta: ${r.delta} }`
).join('\n') : ' []'}
saturating:${computed.saturating.length ? '\n' + computed.saturating.map(s =>
  `  - { tag: ${s.tag}, delta: ${s.delta} }`
).join('\n') : ' []'}
niches:${computed.niches.length ? '\n' + computed.niches.map(n =>
  `  - { tag: ${n.tag}, success_rate: ${n.success_rate}, game_count: ${n.game_count} }`
).join('\n') : ' []'}
---

## WEEKLY TAKE
<!-- 2-3 sentences. Your editorial read on the data.
     Audience: indie devs. Tone: informed, collegial, not hype.
     Do NOT name specific games. Genre/tag level only. -->


## TREND TAKE
<!-- 2-3 sentences. What does the multi-week trajectory suggest?
     What's accelerating, decelerating, or worth watching? -->


## SITE SUBTITLE
<!-- One punchy line used as the subheading on the web page. ~10 words max. -->


## SOCIAL CAPTION (Instagram / Threads / Bluesky)
<!-- 150-220 chars. Ends with: wisegoosegames.com/steam-pulse/week-${weekNumber} -->


## REDDIT TITLE
<!-- Factual headline. ~80 chars max. No clickbait. -->


## REDDIT HOOK
<!-- 2-3 sentence opener for the community post body. Analytical tone. -->


## YOUTUBE SHORT HOOK
<!-- 1 spoken sentence. Stop-scroll in the first 3 words. -->
`;

  const outputPath = path.join(CONTENT_DIR, `week-${weekNumber}.md`);

  if (dryRun) {
    console.log('\n--- DRY RUN OUTPUT ---');
    console.log(frontmatter);
    console.log('--- END DRY RUN ---\n');
    console.log(`Would write to: ${outputPath}`);
  } else {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
    fs.writeFileSync(outputPath, frontmatter, 'utf-8');
    console.log(`Written: ${outputPath}`);
  }

  return outputPath;
}
