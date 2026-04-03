import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { ComputedReport } from './compute-scores.js';

const CONTENT_DIR = path.resolve('src/content/steam-pulse');

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
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
  const base = `  - name: ${g.name}\n    score: ${g.baseComposite}\n    trend: ${g.trend}\n    game_count: ${g.total_games}`;
  if (!g.top_games?.length) return base;
  const gamesYaml = g.top_games.map(tg => {
    const fields = `app_id: ${tg.app_id}, title: "${tg.title.replace(/"/g, '\\"')}", classification: ${tg.classification}, revenue_estimate: ${tg.revenue_estimate}`;
    return tg.capsule
      ? `      - { ${fields}, capsule: "${tg.capsule}" }`
      : `      - { ${fields} }`;
  }).join('\n');
  return `${base}\n    top_games:\n${gamesYaml}`;
}).join('\n')}
tags:
${computed.tags.map(t => {
  const base = `  - name: ${t.name}\n    score: ${t.baseComposite}\n    trend: ${t.trend}\n    game_count: ${t.total_games}`;
  if (!t.top_games?.length) return base;
  const gamesYaml = t.top_games.map(tg => {
    const fields = `app_id: ${tg.app_id}, title: "${tg.title.replace(/"/g, '\\"')}", classification: ${tg.classification}, revenue_estimate: ${tg.revenue_estimate}`;
    return tg.capsule
      ? `      - { ${fields}, capsule: "${tg.capsule}" }`
      : `      - { ${fields} }`;
  }).join('\n');
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
---`;

  const outputPath = path.join(CONTENT_DIR, `week-${weekNumber}.md`);

  // Preserve existing editorial body (everything after the frontmatter) if the
  // file already exists. This lets us re-run the pipeline without wiping copy.
  let body = `\n## WEEKLY TAKE\n<!-- 2-3 sentences. Your editorial read on the data.\n     Audience: indie devs. Tone: informed, collegial, not hype.\n     Do NOT name specific games. Genre/tag level only. -->\n\n\n## TREND TAKE\n<!-- 2-3 sentences. What does the multi-week trajectory suggest?\n     What's accelerating, decelerating, or worth watching? -->\n\n\n## SITE SUBTITLE\n<!-- One punchy line used as the subheading on the web page. ~10 words max. -->\n\n\n## SOCIAL CAPTION (Instagram / Threads / Bluesky)\n<!-- 150-220 chars. Ends with: wisegoosegames.com/steam-pulse/week-${weekNumber} -->\n\n\n## REDDIT TITLE\n<!-- Factual headline. ~80 chars max. No clickbait. -->\n\n\n## REDDIT HOOK\n<!-- 2-3 sentence opener for the community post body. Analytical tone. -->\n\n\n## YOUTUBE SHORT HOOK\n<!-- 1 spoken sentence. Stop-scroll in the first 3 words. -->\n`;

  if (fs.existsSync(outputPath)) {
    const existing = matter(fs.readFileSync(outputPath, 'utf-8'));
    if (existing.content.trim()) {
      body = '\n' + existing.content.trimStart();
      console.log(`  Preserving existing editorial body from ${path.basename(outputPath)}`);
    }
  }

  const output = frontmatter + body;

  if (dryRun) {
    console.log('\n--- DRY RUN OUTPUT ---');
    console.log(output);
    console.log('--- END DRY RUN ---\n');
    console.log(`Would write to: ${outputPath}`);
  } else {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
    fs.writeFileSync(outputPath, output, 'utf-8');
    console.log(`Written: ${outputPath}`);
  }

  return outputPath;
}
