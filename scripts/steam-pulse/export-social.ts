import puppeteer, { type Browser, type Page } from 'puppeteer';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// ─── CLI Arguments ────────────────────────────────────────────────────────────

const argv = await yargs(hideBin(process.argv))
  .option('week', {
    alias: 'w',
    type: 'number',
    demandOption: true,
    description: 'Week number to export (e.g. 12)',
  })
  .option('format', {
    alias: 'f',
    type: 'string',
    choices: ['png', 'mp4', 'all'] as const,
    default: 'all',
    description: 'Export format: png, mp4, or all',
  })
  .option('base-url', {
    type: 'string',
    default: 'http://localhost:4321',
    description: 'Base URL of running dev/preview server',
  })
  .option('duration', {
    type: 'number',
    default: 7,
    description: 'MP4 recording duration in seconds',
  })
  .option('build', {
    type: 'boolean',
    default: false,
    description: 'Run astro build + preview before exporting (no dev server needed)',
  })
  .option('list-weeks', {
    type: 'boolean',
    default: false,
    description: 'List all exported weeks and their files',
  })
  .help()
  .parseAsync();

const WEEK = argv.week;
const FORMAT = argv.format as 'png' | 'mp4' | 'all';
const BASE_URL = argv['base-url'] as string;
const DURATION_S = argv.duration;

const PAGE_URL = `${BASE_URL}/steam-pulse/week-${WEEK}/`;
const OUTPUT_DIR = path.resolve(`exports/steam-pulse/week-${WEEK}`);

const SQUARE = { width: 1080, height: 1080 } as const;
const PORTRAIT = { width: 1080, height: 1920 } as const;

const SELECTORS = {
  barChart: '.sp-bar-chart',
  trendChart: '.sp-trend-chart',
} as const;

// ─── List weeks utility ───────────────────────────────────────────────────────

function listWeeks(): void {
  const exportsDir = path.resolve('exports/steam-pulse');
  if (!fs.existsSync(exportsDir)) {
    console.log('No exports found.');
    return;
  }
  const weeks = fs.readdirSync(exportsDir).filter(d =>
    fs.statSync(path.join(exportsDir, d)).isDirectory()
  );
  if (weeks.length === 0) {
    console.log('No exported weeks found.');
    return;
  }
  for (const week of weeks.sort()) {
    const files = fs.readdirSync(path.join(exportsDir, week));
    console.log(`${week}: ${files.join(', ')}`);
  }
}

if (argv['list-weeks']) {
  listWeeks();
  process.exit(0);
}

// ─── Preview server management ───────────────────────────────────────────────

let previewProcess: ChildProcess | null = null;

async function startPreviewServer(): Promise<void> {
  console.log('Building site...');
  await new Promise<void>((resolve, reject) => {
    const build = spawn('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
    build.on('close', code =>
      code === 0 ? resolve() : reject(new Error(`Build failed (exit ${code})`))
    );
  });

  console.log('Starting preview server...');
  previewProcess = spawn('npm', ['run', 'preview'], { stdio: 'pipe', shell: true });

  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE_URL, { method: 'HEAD' });
      if (res.ok || res.status < 500) break;
    } catch {
      // not ready yet
    }
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('Preview server ready.');
}

function stopPreviewServer(): void {
  if (previewProcess) {
    previewProcess.kill('SIGTERM');
    previewProcess = null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureOutputDir(): void {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Output directory: ${OUTPUT_DIR}`);
}

async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--font-render-hinting=none',
      '--force-device-scale-factor=2',
    ],
  });
}

async function preparePage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewport({
    width: PORTRAIT.width,
    height: PORTRAIT.height,
    deviceScaleFactor: 2,
  });

  console.log(`Navigating to: ${PAGE_URL}`);
  await page.goto(PAGE_URL, { waitUntil: 'networkidle0', timeout: 30_000 });
  await page.waitForSelector(SELECTORS.barChart, { timeout: 10_000 });
  await page.waitForSelector(SELECTORS.trendChart, { timeout: 10_000 });
  await new Promise(resolve => setTimeout(resolve, 1_200));

  return page;
}

async function cropToSelector(
  page: Page,
  selector: string,
  outputPath: string
): Promise<void> {
  const element = await page.$(selector);
  if (!element) throw new Error(`Element not found: ${selector}`);

  const box = await element.boundingBox();
  if (!box) throw new Error(`Could not get bounding box for: ${selector}`);

  const padding = 32;

  const rawScreenshot = await page.screenshot({
    clip: {
      x: Math.max(0, box.x - padding),
      y: Math.max(0, box.y - padding),
      width: box.width + padding * 2,
      height: box.height + padding * 2,
    },
    encoding: 'binary',
    type: 'png',
    omitBackground: false,
  });

  await sharp(rawScreenshot as Buffer)
    .resize(SQUARE.width, SQUARE.height, {
      fit: 'contain',
      background: { r: 10, g: 10, b: 10, alpha: 1 },
    })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`  Saved: ${path.relative(process.cwd(), outputPath)}`);
}

async function exportFullPage(page: Page, outputPath: string): Promise<void> {
  const screenshot = await page.screenshot({
    fullPage: false,
    encoding: 'binary',
    type: 'png',
  });

  await sharp(screenshot as Buffer)
    .resize(PORTRAIT.width, PORTRAIT.height, {
      fit: 'contain',
      background: { r: 10, g: 10, b: 10, alpha: 1 },
    })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`  Saved: ${path.relative(process.cwd(), outputPath)}`);
}

// ─── PNG Export ───────────────────────────────────────────────────────────────

async function exportPNG(browser: Browser): Promise<void> {
  console.log('\nExporting PNGs...');
  const page = await preparePage(browser);

  await cropToSelector(page, SELECTORS.barChart, path.join(OUTPUT_DIR, 'bar-chart.png'));
  await cropToSelector(page, SELECTORS.trendChart, path.join(OUTPUT_DIR, 'trend-chart.png'));
  await exportFullPage(page, path.join(OUTPUT_DIR, 'full-page.png'));

  await page.close();
  console.log('PNG export complete.');
}

// ─── MP4 Export ───────────────────────────────────────────────────────────────

async function exportMP4(browser: Browser): Promise<void> {
  console.log('\nExporting MP4...');

  // Dynamic import to avoid errors if puppeteer-screen-recorder is not installed
  const { PuppeteerScreenRecorder } = await import('puppeteer-screen-recorder');

  const page = await browser.newPage();
  await page.setViewport({ width: SQUARE.width, height: SQUARE.height, deviceScaleFactor: 1 });

  const exportUrl = `${PAGE_URL}?export=1`;
  console.log(`  Recording: ${exportUrl}`);

  const outputPath = path.join(OUTPUT_DIR, 'animation.mp4');

  const recorder = new PuppeteerScreenRecorder(page, {
    followNewTab: false,
    fps: 30,
    videoFrame: { width: SQUARE.width, height: SQUARE.height },
    videoCrf: 18,
    videoCodec: 'libx264',
    videoPreset: 'slow',
    videoBitrate: 1000,
    autopad: { color: '#0A0A0A' },
  });

  await recorder.start(outputPath);

  await page.goto(exportUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForSelector('.sp-page', { timeout: 10_000 });

  await page.evaluate(() => {
    document.documentElement.classList.remove('export-freeze');
    document.querySelectorAll('[data-enter], [data-reveal]').forEach(el => {
      (el as HTMLElement).style.animation = 'none';
      void (el as HTMLElement).offsetHeight;
      (el as HTMLElement).style.animation = '';
    });
  });

  await new Promise(resolve => setTimeout(resolve, DURATION_S * 1000));
  await recorder.stop();
  await page.close();

  console.log(`  Saved: ${path.relative(process.cwd(), outputPath)}`);
  console.log('MP4 export complete.');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Check server reachability (unless --build flag handles it)
  if (!argv.build) {
    try {
      const check = await fetch(PAGE_URL, { method: 'HEAD' });
      if (!check.ok && check.status !== 404) {
        throw new Error(`Server returned ${check.status}`);
      }
    } catch (err) {
      console.error(`\nERROR: Cannot reach ${PAGE_URL}`);
      console.error('Make sure the dev server is running: npm run dev');
      console.error('Or use --build flag: npm run steam-pulse:export:build -- --week N');
      process.exit(1);
    }
  } else {
    await startPreviewServer();
  }

  ensureOutputDir();

  const browser = await launchBrowser();
  console.log('Browser launched');

  try {
    if (FORMAT === 'png' || FORMAT === 'all') {
      await exportPNG(browser);
    }
    if (FORMAT === 'mp4' || FORMAT === 'all') {
      await exportMP4(browser);
    }
  } finally {
    await browser.close();
    stopPreviewServer();
    console.log('\nBrowser closed.');
  }

  console.log(`\nAll exports written to: ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
