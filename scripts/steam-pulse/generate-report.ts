import 'dotenv/config';
import { fetchIndexEntries, fetchReport } from './fetch-report.js';
import { loadPreviousWeek } from './load-previous.js';
import { computeScores } from './compute-scores.js';
import { writeMarkdown } from './write-markdown.js';

const isDryRun = process.argv.includes('--dry-run');

/**
 * Pulls the CloudFront report index and processes EVERY report that's newer
 * than the latest published week. Reports are handled in chronological order
 * so WoW deltas chain correctly. This prevents "skipped weeks" when more than
 * one report drops between generator runs.
 */
async function main() {
  console.log('Steam Pulse Report Generator');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'WRITE'}\n`);

  // 1. Determine the cutoff: anything newer than the latest published week.
  //    Compare against the report `id` field (e.g. "20260325_133206") rather
  //    than the human-readable `date` string, which is locale-formatted and
  //    less reliable to parse.
  let previous = loadPreviousWeek();
  const cutoffId = previous ? previous.date.replace(/-/g, '') : ''; // "20260325"
  if (previous) {
    console.log(`Latest published: Week ${previous.week} (${previous.date})`);
  } else {
    console.log('No prior weeks found — will process all reports.');
  }

  // 2. Fetch full index, filter to reports newer than cutoff, oldest-first.
  console.log('Fetching report index...');
  const entries = await fetchIndexEntries(); // already oldest-first
  const pending = entries.filter(e => e.id.slice(0, 8) > cutoffId);

  if (!pending.length) {
    console.log('No new reports to process. Done.');
    return;
  }

  console.log(`Pending reports: ${pending.length}`);
  pending.forEach(e => console.log(`  ${e.filename}  (${e.date})`));
  console.log('');

  // 3. Process each pending report in chronological order, refreshing the
  //    previous-week pointer after each write so the next iteration sees
  //    the just-written file as its prior week.
  for (const entry of pending) {
    console.log(`──────────────────────────────────────`);
    console.log(`Processing: ${entry.filename}`);

    const report = await fetchReport(entry.filename);
    console.log(`  Games in report: ${report.games.length}  Period: ${report.period_end}`);

    const previousScores = previous?.scores ?? {};
    const previousHitRate = previous?.hit_rate ?? null;
    const weekNumber = previous ? previous.week + 1 : 1;

    console.log(`  Week number: ${weekNumber}`);
    if (previous) {
      console.log(`  Comparing against Week ${previous.week} (${previous.date}, hit_rate ${previous.hit_rate ?? 'n/a'})`);
    }

    const computed = computeScores(report, previousScores);
    console.log(`  Genres: ${computed.genres.length}  Tags: ${computed.tags.length}  Hit rate: ${computed.hit_rate}%`);

    writeMarkdown({
      weekNumber,
      reportFilename: entry.filename,
      periodDate: report.period_end,
      computed,
      previousHitRate,
      dryRun: isDryRun,
    });

    // Refresh previous-week pointer for next iteration.
    if (!isDryRun) {
      previous = loadPreviousWeek();
    } else {
      // In dry-run mode nothing is written, so we synthesize the next "previous"
      // from the in-memory computed values so chained deltas still preview correctly.
      const scores: Record<string, number> = {};
      for (const g of computed.genres) scores[g.name] = g.baseComposite;
      for (const t of computed.tags) scores[t.name] = t.baseComposite;
      previous = {
        week: weekNumber,
        date: report.period_end.slice(0, 10),
        hit_rate: computed.hit_rate,
        scores,
      };
    }
  }

  console.log('\n──────────────────────────────────────');
  console.log(`Done. ${pending.length} week(s) ${isDryRun ? 'previewed' : 'written'}.`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
