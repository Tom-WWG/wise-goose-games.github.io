# Steam Pulse Export — Social Media Asset Export Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan.

**Goal:** Build a Puppeteer-based script that renders the weekly Steam Pulse report page and exports the two chart components as individual PNG files (1080×1080, square social format) and the full page animation as an MP4 (1080×1080, H.264, Instagram/Threads/YouTube Shorts compatible).

**Architecture:** A Node.js TypeScript script that accepts `--week` and `--format` CLI arguments. It launches Puppeteer, navigates to the locally-running dev server (or built preview server), isolates each chart component via CSS selector, crops to 1080×1080, and exports. For MP4, it uses `puppeteer-screen-recorder` to capture the page loading animation over 5–8 seconds. All outputs land in `exports/steam-pulse/week-{N}/`.

**Tech Stack:** Node.js, TypeScript, `tsx`, `puppeteer`, `puppeteer-screen-recorder`, `sharp` (PNG crop/resize), `yargs` (CLI arg parsing)

---

## Prerequisites

- `npm run dev` (Astro dev server) must be running on `http://localhost:4321` before invoking export, OR use the `--build` flag (see Task 4) which handles build + preview automatically.
- Plan 1 must be complete: the dynamic route `/steam-pulse/week-{N}/` must exist and render correctly.
- Plan 2 must have produced the content file for the target week (or Week 12 from Plan 1 Task 7 is sufficient for initial testing).
- `tsx` must be installed (added in Plan 2 Task 1).

---

## Output File Structure

For `--week 12`:
```
exports/
  steam-pulse/
    week-12/
      bar-chart.png      1080×1080, PNG, bar chart component cropped
      trend-chart.png    1080×1080, PNG, trend chart component cropped
      full-page.png      1080×1920, PNG, full page screenshot (stories format)
      animation.mp4      1080×1080, H.264, 5-8 second loading animation
```

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] Step 1: Install required dependencies:
  ```bash
  npm install --save-dev puppeteer puppeteer-screen-recorder sharp yargs @types/yargs @types/sharp
  ```

  Notes on package choices:
  - `puppeteer`: headless Chrome, used for both screenshot and video capture.
  - `puppeteer-screen-recorder`: wraps `ffmpeg` to record Puppeteer pages to MP4. Requires `ffmpeg` installed on the system (`brew install ffmpeg` on macOS).
  - `sharp`: handles PNG cropping and resizing to exact 1080×1080 dimensions.
  - `yargs`: typed CLI argument parsing.

- [ ] Step 2: Verify `ffmpeg` is available:
  ```bash
  ffmpeg -version
  ```
  If not installed on macOS: `brew install ffmpeg`. Document this in the script's help text.

- [ ] Step 3: Add npm scripts to `package.json`:
  ```json
  "steam-pulse:export": "tsx scripts/steam-pulse/export-social.ts",
  "steam-pulse:export:png": "tsx scripts/steam-pulse/export-social.ts --format png",
  "steam-pulse:export:mp4": "tsx scripts/steam-pulse/export-social.ts --format mp4"
  ```

- [ ] Step 4: Commit — `git commit -m "chore: add puppeteer/sharp deps for steam-pulse social export"`

---

### Task 2: Create export-social.ts — PNG Export

**Files:**
- Create: `scripts/steam-pulse/export-social.ts`

Build the script in two stages. This task covers PNG export; Task 3 adds MP4.

- [ ] Step 1: Create `scripts/steam-pulse/export-social.ts` with the following base structure and PNG export logic:

```typescript
import puppeteer, { type Browser, type Page } from 'puppeteer';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
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
  .help()
  .parseAsync();

const WEEK = argv.week;
const FORMAT = argv.format as 'png' | 'mp4' | 'all';
const BASE_URL = argv['base-url'];
const DURATION_S = argv.duration;

const PAGE_URL = `${BASE_URL}/steam-pulse/week-${WEEK}/`;
const OUTPUT_DIR = path.resolve(`exports/steam-pulse/week-${WEEK}`);

// ─── Social format constants ───────────────────────────────────────────────────

// Square format for feed posts (Instagram, Bluesky, Reddit)
const SQUARE = { width: 1080, height: 1080 } as const;
// Portrait for stories/Shorts — full page
const PORTRAIT = { width: 1080, height: 1920 } as const;

// CSS selectors for chart components (must match rendered HTML)
const SELECTORS = {
  barChart: '.sp-bar-chart',
  trendChart: '.sp-trend-chart',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureOutputDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Output directory: ${OUTPUT_DIR}`);
}

async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--font-render-hinting=none', // sharper text in headless
      '--force-device-scale-factor=2', // 2× for retina-quality output
    ],
  });
}

async function preparePage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();

  // Set viewport to PORTRAIT dimensions at 2× DPR for crisp renders
  // We use portrait as the base and crop to square per chart
  await page.setViewport({
    width: PORTRAIT.width,
    height: PORTRAIT.height,
    deviceScaleFactor: 2,
  });

  console.log(`Navigating to: ${PAGE_URL}`);
  await page.goto(PAGE_URL, {
    waitUntil: 'networkidle0',
    timeout: 30_000,
  });

  // Wait for chart components to be present and rendered
  await page.waitForSelector(SELECTORS.barChart, { timeout: 10_000 });
  await page.waitForSelector(SELECTORS.trendChart, { timeout: 10_000 });

  // Wait an extra moment for CSS animations to complete
  await new Promise(resolve => setTimeout(resolve, 1_200));

  return page;
}

/**
 * Crops a raw screenshot Buffer to the bounding box of a CSS selector,
 * then resizes to exactly SQUARE dimensions.
 * Adds 32px padding on all sides before cropping (breathing room for the design).
 */
async function cropToSelector(
  page: Page,
  selector: string,
  outputPath: string
): Promise<void> {
  const element = await page.$(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  const box = await element.boundingBox();
  if (!box) {
    throw new Error(`Could not get bounding box for: ${selector}`);
  }

  // deviceScaleFactor=2, so multiply coords
  const dpr = 2;
  const padding = 32 * dpr;

  // Take a screenshot of just the element region (with padding)
  const rawScreenshot = await page.screenshot({
    clip: {
      x: Math.max(0, (box.x - 32) * dpr / dpr), // account for dpr in puppeteer clip
      y: Math.max(0, (box.y - 32) * dpr / dpr),
      width: (box.width + 64),
      height: (box.height + 64),
    },
    encoding: 'binary',
    type: 'png',
    omitBackground: false,
  });

  // Use sharp to resize to exact 1080×1080
  // sharp's `contain` fit places the chart centered on a --bg-primary (#0A0A0A) background
  await sharp(rawScreenshot as Buffer)
    .resize(SQUARE.width, SQUARE.height, {
      fit: 'contain',
      background: { r: 10, g: 10, b: 10, alpha: 1 }, // --bg-primary
    })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`  Saved: ${path.relative(process.cwd(), outputPath)}`);
}

/**
 * Takes a full-page portrait screenshot at 1080×1920.
 */
async function exportFullPage(page: Page, outputPath: string): Promise<void> {
  const screenshot = await page.screenshot({
    fullPage: false, // capture only the viewport (portrait size)
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

  await cropToSelector(
    page,
    SELECTORS.barChart,
    path.join(OUTPUT_DIR, 'bar-chart.png')
  );

  await cropToSelector(
    page,
    SELECTORS.trendChart,
    path.join(OUTPUT_DIR, 'trend-chart.png')
  );

  await exportFullPage(
    page,
    path.join(OUTPUT_DIR, 'full-page.png')
  );

  await page.close();
  console.log('PNG export complete.');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Verify server is reachable before launching browser
  try {
    const check = await fetch(PAGE_URL, { method: 'HEAD' });
    if (!check.ok) {
      throw new Error(`Server returned ${check.status}`);
    }
  } catch (err) {
    console.error(`\nERROR: Cannot reach ${PAGE_URL}`);
    console.error('Make sure the dev server is running: npm run dev');
    console.error('Or build and preview: npm run build && npm run preview');
    process.exit(1);
  }

  ensureOutputDir();

  const browser = await launchBrowser();
  console.log('Browser launched');

  try {
    if (FORMAT === 'png' || FORMAT === 'all') {
      await exportPNG(browser);
    }

    if (FORMAT === 'mp4' || FORMAT === 'all') {
      await exportMP4(browser); // defined in Task 3
    }
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }

  console.log(`\nAll exports written to: ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
```

- [ ] Step 2: Test PNG export with Week 12 (requires dev server running):
  ```bash
  npm run dev &
  npm run steam-pulse:export -- --week 12 --format png
  ```
  Confirm three PNG files appear in `exports/steam-pulse/week-12/`.

- [ ] Step 3: Open each PNG in an image viewer. Confirm:
  - Chart renders correctly with dark background
  - Text is sharp (not blurry)
  - Aspect ratio is exactly 1080×1080
  - Background color matches `--bg-primary` (#0A0A0A)

- [ ] Step 4: Commit — `git commit -m "feat: add steam-pulse PNG social export script"`

---

### Task 3: Add MP4 Export

**Files:**
- Modify: `scripts/steam-pulse/export-social.ts`

Add the `exportMP4` function referenced in Task 2's `main()`. This uses `puppeteer-screen-recorder` to capture the page's loading animation.

- [ ] Step 1: Add the following imports at the top of `export-social.ts` (alongside existing imports):

```typescript
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
```

- [ ] Step 2: Add the `exportMP4` function before the `main()` function:

```typescript
// ─── MP4 Export ───────────────────────────────────────────────────────────────

/**
 * Records the page animation as MP4.
 * Strategy:
 * 1. Navigate to page with a special query param ?export=1 that triggers a
 *    CSS class to reset all animations (so they play from t=0 during recording).
 * 2. Start recorder.
 * 3. Trigger animation replay by adding a CSS class via evaluate().
 * 4. Wait for DURATION_S seconds to capture the full animation.
 * 5. Stop recorder and save.
 *
 * The ?export=1 param and animation reset logic requires a small addition to
 * the [week].astro page (see Step 3 below).
 */
async function exportMP4(browser: Browser): Promise<void> {
  console.log('\nExporting MP4...');

  const page = await browser.newPage();

  // Square viewport for Instagram/YouTube Shorts format
  await page.setViewport({
    width: SQUARE.width,
    height: SQUARE.height,
    deviceScaleFactor: 1, // 1× for video — 2× produces oversized video
  });

  const exportUrl = `${PAGE_URL}?export=1`;
  console.log(`  Recording: ${exportUrl}`);

  const outputPath = path.join(OUTPUT_DIR, 'animation.mp4');

  const recorder = new PuppeteerScreenRecorder(page, {
    followNewTab: false,
    fps: 30,
    ffmpeg_Path: null, // uses system ffmpeg — ensure it's in PATH
    videoFrame: {
      width: SQUARE.width,
      height: SQUARE.height,
    },
    videoCrf: 18,        // quality: 18 = visually lossless (H.264)
    videoCodec: 'libx264',
    videoPreset: 'slow', // better compression
    videoBitrate: 1000,
    autopad: {
      color: '#0A0A0A',  // --bg-primary
    },
  });

  await recorder.start(outputPath);

  await page.goto(exportUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });

  // Trigger animation reset: remove the 'export-freeze' class added by ?export=1
  // This causes all [data-enter] and [data-reveal] elements to animate in
  await page.waitForSelector('.sp-page', { timeout: 10_000 });
  await page.evaluate(() => {
    document.documentElement.classList.remove('export-freeze');
    // Force reflow to restart animations
    document.querySelectorAll('[data-enter], [data-reveal]').forEach(el => {
      (el as HTMLElement).style.animation = 'none';
      void (el as HTMLElement).offsetHeight; // trigger reflow
      (el as HTMLElement).style.animation = '';
    });
  });

  // Record for the specified duration
  await new Promise(resolve => setTimeout(resolve, DURATION_S * 1000));

  await recorder.stop();
  await page.close();

  console.log(`  Saved: ${path.relative(process.cwd(), outputPath)}`);
  console.log('MP4 export complete.');
}
```

- [ ] Step 3: Add the `?export=1` animation freeze hook to `src/pages/steam-pulse/[week].astro`. This is a small client-side script that detects the query param and temporarily freezes animations until the recorder is ready. Add the following `<script>` tag at the bottom of the `[week].astro` template (just before `</BaseLayout>`):

```astro
<script>
  // Export mode: freeze animations until puppeteer recorder is ready
  if (new URLSearchParams(window.location.search).get('export') === '1') {
    document.documentElement.classList.add('export-freeze');
  }
</script>

<style is:global>
  /* When in export mode, hold all enter/reveal elements at their start state */
  .export-freeze [data-enter],
  .export-freeze [data-reveal] {
    opacity: 0;
    transform: translateY(8px);
    animation: none !important;
    transition: none !important;
  }
</style>
```

- [ ] Step 4: Test MP4 export:
  ```bash
  npm run steam-pulse:export -- --week 12 --format mp4
  ```
  Confirm `exports/steam-pulse/week-12/animation.mp4` exists. Open it and verify:
  - Dimensions are 1080×1080
  - Dark background (#0A0A0A)
  - Page elements animate in smoothly
  - Duration matches `--duration` argument (default 7 seconds)
  - No encoding artifacts

- [ ] Step 5: Commit — `git commit -m "feat: add steam-pulse MP4 animation export"`

---

### Task 4: CLI Polish and Build Mode

**Files:**
- Modify: `scripts/steam-pulse/export-social.ts`
- Modify: `package.json`

- [ ] Step 1: Add `--build` flag support to `export-social.ts`. When passed, the script runs `astro build && astro preview` as a child process before launching Puppeteer, then kills the preview server after export completes. Add to the yargs config:

```typescript
.option('build', {
  type: 'boolean',
  default: false,
  description: 'Run astro build + preview before exporting (no dev server needed)',
})
```

Add a `startPreviewServer()` / `stopPreviewServer()` helper:

```typescript
import { spawn, type ChildProcess } from 'node:child_process';

let previewProcess: ChildProcess | null = null;

async function startPreviewServer(): Promise<void> {
  console.log('Building site...');
  await new Promise<void>((resolve, reject) => {
    const build = spawn('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
    build.on('close', code => (code === 0 ? resolve() : reject(new Error(`Build failed (exit ${code})`))));
  });

  console.log('Starting preview server...');
  previewProcess = spawn('npm', ['run', 'preview'], { stdio: 'pipe', shell: true });

  // Wait for preview server to be ready (poll for 20s)
  const baseUrl = argv['base-url'];
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(baseUrl, { method: 'HEAD' });
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
```

Update `main()` to call `startPreviewServer()` when `argv.build === true` and always call `stopPreviewServer()` in the `finally` block.

- [ ] Step 2: Add `--list-weeks` flag that reads the `exports/steam-pulse/` directory and prints which weeks have been exported and what files exist, for quick status checking.

- [ ] Step 3: Add a short usage block to `package.json` scripts section as a comment (JSON doesn't support comments, so add a `"steam-pulse:export:help"` script that just prints usage):

```json
"steam-pulse:export:help": "tsx scripts/steam-pulse/export-social.ts --help"
```

- [ ] Step 4: Update `package.json` to add final convenience script:
  ```json
  "steam-pulse:export:build": "tsx scripts/steam-pulse/export-social.ts --build --format all"
  ```
  This is the zero-dependency command: no server needed, just run this.

- [ ] Step 5: Commit — `git commit -m "feat: add --build flag and CLI polish to steam-pulse export script"`

---

### Task 5: Add exports/ to .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] Step 1: Open `.gitignore` and add the following entries:

```gitignore
# Steam Pulse social exports — large binary files, not committed
exports/steam-pulse/

# Generator logs
logs/*.log
```

- [ ] Step 2: Confirm `exports/` directory is untracked:
  ```bash
  git status
  ```
  Verify no PNG or MP4 files appear in the staged/unstaged list.

- [ ] Step 3: Commit — `git commit -m "chore: gitignore steam-pulse exports and logs"`

---

### Task 6: End-to-End Test and Documentation

**Files:**
- No new files — this is a verification task.

- [ ] Step 1: Full end-to-end test for Week 12:
  ```bash
  npm run dev &
  sleep 3
  npm run steam-pulse:export -- --week 12 --format all --duration 7
  ```

- [ ] Step 2: Verify all four output files exist:
  ```
  exports/steam-pulse/week-12/bar-chart.png     (should be ~200–500 KB)
  exports/steam-pulse/week-12/trend-chart.png   (should be ~150–400 KB)
  exports/steam-pulse/week-12/full-page.png     (should be ~400–800 KB)
  exports/steam-pulse/week-12/animation.mp4     (should be ~3–8 MB)
  ```

- [ ] Step 3: Spot-check the MP4 is Instagram/YouTube Shorts compatible:
  ```bash
  ffprobe exports/steam-pulse/week-12/animation.mp4
  ```
  Confirm: codec `h264`, width 1080, height 1080, fps 30, pixel format `yuv420p`.

- [ ] Step 4: Test the `--build` standalone mode:
  ```bash
  # Kill dev server first, then:
  npm run steam-pulse:export:build -- --week 12
  ```
  Confirm it builds, serves, exports, and shuts down cleanly.

- [ ] Step 5: Commit — `git commit -m "test: verify steam-pulse export end-to-end for week 12"`

---

## Usage Summary

After Plan 1 and Plan 2 are complete, the weekly workflow is:

1. Sunday: cron runs `npm run steam-pulse:generate` — new `week-N.md` created
2. Human fills editorial sections in `src/content/steam-pulse/week-N.md`
3. Human runs exports:
   ```bash
   npm run dev &
   npm run steam-pulse:export -- --week N --format all
   ```
   Or without a running server:
   ```bash
   npm run steam-pulse:export:build -- --week N
   ```
4. Post `bar-chart.png` and `trend-chart.png` to Instagram/Bluesky
5. Post `animation.mp4` to Instagram Reels / YouTube Shorts
6. Commit the markdown file and push — site rebuilds automatically

---

## Cross-Plan Notes

- **Depends on Plan 1:** The CSS selectors `.sp-bar-chart` and `.sp-trend-chart` are used by the export script to locate chart elements. These class names are defined in `SteamPulseBarChart.astro` and `SteamPulseTrendChart.astro` — do not rename them without updating `SELECTORS` in this script.
- **Depends on Plan 1:** The `?export=1` animation freeze hook is added to `src/pages/steam-pulse/[week].astro` in Task 3 of this plan. If that page file changes significantly, verify the freeze hook still works.
- **Depends on Plan 2:** The markdown content file for the target week must exist before exporting — the dev server must be able to render `/steam-pulse/week-{N}/` without a 404.
- **ffmpeg dependency:** `puppeteer-screen-recorder` requires system `ffmpeg`. This is a manual installation step not handled by `npm install`. Document this prominently for any CI/CD setup.
- **No Twitter/X:** Per `CLAUDE.md`, no Twitter-specific output formats (1200×675 card images, etc.) should be added.
