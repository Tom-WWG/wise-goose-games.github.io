import 'dotenv/config';
import { fetchIndex, fetchReport } from './fetch-report.js';
import { loadPreviousWeek } from './load-previous.js';
import { computeScores } from './compute-scores.js';
import { writeMarkdown } from './write-markdown.js';

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  console.log('Steam Pulse Report Generator');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'WRITE'}\n`);

  // 1. Fetch latest report
  console.log('Fetching report index...');
  const index = await fetchIndex();
  const latestFilename = index.latest ?? index.reports?.[0];
  if (!latestFilename) {
    throw new Error('No reports found in index.json');
  }
  console.log(`Latest report: ${latestFilename}`);

  console.log('Fetching report data...');
  const report = await fetchReport(latestFilename);
  console.log(`Games in report: ${report.games.length}`);

  // 2. Load previous week for delta calculation
  const previous = loadPreviousWeek();
  if (previous) {
    console.log(`Previous week loaded: Week ${previous.week}`);
  } else {
    console.log('No previous week found — deltas will be 0');
  }

  const previousScores = previous?.scores ?? {};
  const previousHitRate = previous
    ? (() => {
        // We don't store hit_rate in scores map, so re-derive it if possible
        // For now, return null — delta will be 0
        return null;
      })()
    : null;

  // 3. Compute composite scores
  console.log('Computing scores...');
  const computed = computeScores(report, previousScores);
  console.log(`Genres computed: ${computed.genres.length}`);
  console.log(`Tags computed: ${computed.tags.length}`);

  // 4. Infer week number
  const weekNumber = previous ? previous.week + 1 : 1;
  console.log(`Week number: ${weekNumber}`);

  // 5. Write markdown
  writeMarkdown({
    weekNumber,
    reportFilename: latestFilename,
    periodDate: report.period_end,
    computed,
    previousHitRate,
    dryRun: isDryRun,
  });

  console.log('\nDone.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
