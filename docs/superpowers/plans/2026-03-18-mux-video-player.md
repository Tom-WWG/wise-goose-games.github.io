# Mux Video Player Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the YouTube iframe trailer on the Pathways & Poltergeists game page with a native Mux player that autoplays muted, enriches SEO schema with direct video URLs, and adds Open Graph video tags for social sharing.

**Architecture:** Install `@mux/mux-player-astro` and create a self-contained `MuxTrailer.astro` component. The `Game` type's `trailer` field becomes `muxPlaybackId`. `GameDetail.tsx` loses all video logic; the trailer renders above it in `[slug].astro`. og:video tags are injected via BaseLayout's `<slot name="head">` — no BaseLayout changes needed.

**Tech Stack:** Astro 5, React 19, `@mux/mux-player-astro`, GSAP 3, TypeScript strict mode. No test suite — verification uses `npx astro check` (type errors) and `npm run build` (integration).

**Spec:** `docs/superpowers/specs/2026-03-18-mux-video-player-design.md`

---

## Chunk 1: Foundation — Package, Data Model, SEO Schema

### Task 1: Install `@mux/mux-player-astro`

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the package**

```bash
cd /Users/tbarr/Documents/GitHub/wise-goose-games.github.io
npm install @mux/mux-player-astro
```

Expected: package appears in `package.json` dependencies, `node_modules/@mux/mux-player-astro` exists. No errors.

---

### Task 2: Update `Game` type and P&P data

**Files:**
- Modify: `src/data/games.ts`

- [ ] **Step 1: Replace `trailer` with `muxPlaybackId` on the `Game` interface**

In `src/data/games.ts`, find the `Game` interface (line 34). Change:
```ts
// Before (line 46)
trailer: string | null;

// After
muxPlaybackId: string | null;
```

- [ ] **Step 2: Update the P&P game entry**

In the `games` array (line 67), find the P&P entry. Change:
```ts
// Before (line 98)
trailer: "https://www.youtube.com/watch?v=V5bOVQK9jYY",

// After
muxPlaybackId: "XCwylHGwg401azOsZJ8ry6HfdTj500zcAPoHAtsNuYCHM",
```

- [ ] **Step 3: Run type-check — expect failures in GameDetail.tsx and seo.ts**

```bash
npx astro check
```

Expected: errors about `trailer` not existing on `Game` in `GameDetail.tsx` (line 77) and `seo.ts` (line 84). This confirms the type change propagated correctly. Do NOT fix these yet — they are addressed in Tasks 3 and 5.

---

### Task 3: Update `getVideoGameSchema` in `seo.ts`

**Files:**
- Modify: `src/utils/seo.ts`

- [ ] **Step 1: Update the parameter type signature**

In `src/utils/seo.ts`, find the `getVideoGameSchema` function (line 75). Update the parameter object type — replace `trailer: string | null` with `muxPlaybackId: string | null`:

```ts
export function getVideoGameSchema(game: {
  id: string;
  title: string;
  shortDescription: string;
  genre: string;
  releaseDate: string | null;
  platforms: Record<string, { url: string }>;
  price: string | null;
  steamAssets: { header?: string; screenshots?: string[] };
  muxPlaybackId: string | null;   // ← changed from: trailer: string | null
}) {
```

- [ ] **Step 2: Replace the VideoObject builder**

In the same function, find the `trailer` variable construction (lines 121–131). Replace the entire block:

```ts
// Before
const trailer = game.trailer
  ? {
      "@type": "VideoObject" as const,
      name: `${game.title} - Official Trailer`,
      url: game.trailer,
      thumbnailUrl: game.steamAssets.header
        ? `${SITE_URL}${game.steamAssets.header}`
        : undefined,
      ...(datePublished ? { uploadDate: datePublished } : {}),
    }
  : undefined;

// After
const trailer = game.muxPlaybackId
  ? {
      "@type": "VideoObject" as const,
      name: `${game.title} - Official Trailer`,
      description: `Official trailer for ${game.title}`,
      thumbnailUrl: `https://image.mux.com/${game.muxPlaybackId}/thumbnail.jpg`,
      contentUrl: `https://stream.mux.com/${game.muxPlaybackId}/high.mp4`,
      embedUrl: `https://player.mux.com/${game.muxPlaybackId}`,
      ...(datePublished ? { uploadDate: datePublished } : {}),
    }
  : undefined;
```

- [ ] **Step 3: Run type-check — seo.ts error should clear**

```bash
npx astro check
```

Expected: the `seo.ts` error is gone. Only the `GameDetail.tsx` error about `game.trailer` should remain.

---

## Chunk 2: Player Component, Cleanup, Composition

### Task 4: Create `MuxTrailer.astro`

**Files:**
- Create: `src/components/MuxTrailer.astro`

- [ ] **Step 1: Create the component file**

Create `src/components/MuxTrailer.astro` with the following content:

```astro
---
import MuxPlayer from '@mux/mux-player-astro';

interface Props {
  playbackId: string;
  title: string;
}

const { playbackId, title } = Astro.props;
const poster = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
---

<div class="mux-trailer-wrap">
  <MuxPlayer
    playback-id={playbackId}
    metadata-video-title={title}
    poster={poster}
    muted
    autoplay
    loop={false}
    playsinline
    style="--media-primary-color: #ffffff; --media-accent-color: #E87A2E; --media-background-color: #000000; --media-control-bar-background: rgba(0,0,0,0.75);"
  />
  <div class="unmute-badge" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
    </svg>
    Tap to unmute
  </div>
</div>

<style>
  .mux-trailer-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    max-height: calc(100vh - 60px - 70px);
    background: #000;
  }

  .mux-trailer-wrap mux-player {
    width: 100%;
    height: 100%;
  }

  /* Unmute badge — top-right corner, fades out after 4s */
  .unmute-badge {
    position: absolute;
    top: 14px;
    right: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 0, 0, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: white;
    font-size: 11px;
    font-family: 'IBM Plex Mono', monospace;
    letter-spacing: 0.08em;
    padding: 5px 10px;
    border-radius: 3px;
    backdrop-filter: blur(4px);
    pointer-events: none;
    opacity: 0;
  }

  .unmute-badge svg {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
  }

  /* Visible while muted (class toggled by script below) */
  .mux-trailer-wrap.is-muted .unmute-badge {
    animation: badge-fade 4s ease forwards;
    animation-delay: 0.3s;
  }

  @keyframes badge-fade {
    0%   { opacity: 1; }
    70%  { opacity: 1; }
    100% { opacity: 0; }
  }

  /* Reduced motion: no autoplay, no badge */
  @media (prefers-reduced-motion: reduce) {
    .unmute-badge {
      display: none;
    }
  }
</style>

<script>
  function initMuxTrailer() {
    const wrap = document.querySelector('.mux-trailer-wrap') as HTMLElement | null;
    if (!wrap) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Wait for mux-player custom element to be defined and ready
    customElements.whenDefined('mux-player').then(() => {
      const muxEl = wrap.querySelector('mux-player') as HTMLElement & {
        media?: { nativeEl?: HTMLVideoElement };
      };
      if (!muxEl) return;

      // Reduced motion: remove autoplay, show poster instead
      if (prefersReducedMotion) {
        muxEl.removeAttribute('autoplay');
        return;
      }

      // Get the underlying <video> element for mute state events
      // mux-player exposes it via .media.nativeEl once ready
      const getVideoEl = (): HTMLVideoElement | null =>
        muxEl.media?.nativeEl ?? muxEl.querySelector('video');

      // Poll briefly for the video element (web component async init)
      let attempts = 0;
      const poll = setInterval(() => {
        const videoEl = getVideoEl();
        if (videoEl || attempts > 20) {
          clearInterval(poll);
          if (!videoEl) return;

          // Set initial muted class to trigger badge on load
          if (videoEl.muted) wrap.classList.add('is-muted');

          // Track mute state changes
          videoEl.addEventListener('volumechange', () => {
            if (videoEl.muted) {
              wrap.classList.add('is-muted');
              // Re-trigger animation by forcing reflow
              const badge = wrap.querySelector('.unmute-badge') as HTMLElement | null;
              if (badge) {
                badge.style.animation = 'none';
                void badge.offsetWidth; // reflow
                badge.style.animation = '';
              }
            } else {
              wrap.classList.remove('is-muted');
            }
          });
        }
        attempts++;
      }, 100);
    });
  }

  // Run on initial load and after View Transitions navigation
  initMuxTrailer();
  document.addEventListener('astro:page-load', initMuxTrailer);
</script>
```

- [ ] **Step 2: Run type-check**

```bash
npx astro check
```

Expected: no new errors from `MuxTrailer.astro`. The only remaining error is still `game.trailer` in `GameDetail.tsx` (fixed in Task 5).

---

### Task 5: Remove YouTube code from `GameDetail.tsx`

**Files:**
- Modify: `src/components/GameDetail.tsx`

- [ ] **Step 1: Delete `extractYouTubeId` and `videoId`**

In `src/components/GameDetail.tsx`:

Remove the entire `extractYouTubeId` function (lines 13–16):
```ts
// DELETE THIS
function extractYouTubeId(url: string): string | null {
  const match = url.match(/[?&]v=([^&#]+)/) ?? url.match(/youtu\.be\/([^?&#]+)/);
  return match ? match[1] : null;
}
```

Remove the `videoId` derivation on line 77:
```ts
// DELETE THIS
const videoId = game.trailer ? extractYouTubeId(game.trailer) : null;
```

- [ ] **Step 2: Remove the entire trailer render block**

Remove lines 195–217 (the YouTube iframe, its comment header, and wrapper divs):
```tsx
// DELETE THIS ENTIRE BLOCK
{/* ===== TRAILER: Full-width, capped height ===== */}
{videoId && (
  <div
    data-enter-detail
    className="w-full bg-black pt-[60px]"
  >
    <div
      className="w-full mx-auto"
      style={{
        aspectRatio: '16/9',
        maxHeight: 'calc(100vh - 60px - 70px)',
      }}
    >
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
        title={`${game.title} trailer`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full border-0"
      />
    </div>
  </div>
)}
```

- [ ] **Step 3: Run type-check — all errors should clear**

```bash
npx astro check
```

Expected: **zero errors**. The `game.trailer` reference is gone; the `Game` type change in Task 2 and `seo.ts` change in Task 3 are already clean.

---

### Task 6: Compose `MuxTrailer` in `[slug].astro` and add og:video tags

**Files:**
- Modify: `src/pages/games/[slug].astro`

- [ ] **Step 1: Import `MuxTrailer`**

In `src/pages/games/[slug].astro`, add the import at the top of the frontmatter block (after existing imports):

```ts
import MuxTrailer from '../../components/MuxTrailer.astro';
```

- [ ] **Step 2: Build the og:video URL**

In the frontmatter, after the `game` destructure (`const { game } = Astro.props;`), add:

```ts
const muxMp4Url = game.muxPlaybackId
  ? `https://stream.mux.com/${game.muxPlaybackId}/high.mp4`
  : undefined;
```

- [ ] **Step 3: Add og:video tags via the head slot and compose `MuxTrailer` in the template**

Replace the current `<BaseLayout>` block:

```astro
// Before
<BaseLayout {...seo}>
  <main>
    <GameDetail client:load game={game} />
  </main>
</BaseLayout>

// After
<BaseLayout {...seo}>
  {muxMp4Url && (
    <Fragment slot="head">
      <meta property="og:video" content={muxMp4Url} />
      <meta property="og:video:secure_url" content={muxMp4Url} />
      <meta property="og:video:type" content="video/mp4" />
      <meta property="og:video:width" content="1920" />
      <meta property="og:video:height" content="1080" />
    </Fragment>
  )}
  <main>
    {game.muxPlaybackId && (
      <div data-enter class="w-full bg-black pt-[60px]">
        <MuxTrailer playbackId={game.muxPlaybackId} title={game.title} />
      </div>
    )}
    <GameDetail client:load game={game} />
  </main>
</BaseLayout>
```

`data-enter` on the MuxTrailer wrapper is picked up by BaseLayout's existing global GSAP entrance animation — no page-level script needed.

**Spec divergence (intentional):** The spec (Sections 4b/4c) describes routing og:video tags through `SEOProps`, `getSEO`, and `BaseLayout.Props`. This plan intentionally replaces that approach with `<Fragment slot="head">` injection — BaseLayout already provides `<slot name="head" />` at line 95 for exactly this purpose. This is simpler and has identical output. Do **not** also implement the SEOProps/BaseLayout approach from the spec — that would produce duplicate og:video tags.

- [ ] **Step 4: Run type-check**

```bash
npx astro check
```

Expected: zero errors.

---

### Task 7: Build verification and manual QA

**Files:** none (verification only)

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Expected: build completes with no errors. Output in `dist/`. Note any warnings about `@mux/mux-player-astro` (acceptable) but zero TypeScript or Astro errors.

- [ ] **Step 2: Run dev server and open the P&P game page**

```bash
npm run dev
```

Open `http://localhost:4321/games/pathways-poltergeists/` in a browser.

- [ ] **Step 3: Verify player behavior checklist**

- [ ] Player renders at full width, 16:9 aspect ratio, below the navbar (60px offset)
- [ ] Video autoplays silently on page load (no sound)
- [ ] Unmute badge appears in the top-right corner on load
- [ ] Unmute badge fades out after ~4 seconds
- [ ] Clicking the mute button in the player controls unmutes the video and badge disappears
- [ ] Re-muting brings the badge back briefly then it fades again
- [ ] Video stops on last frame (does not loop)
- [ ] Player controls match site styling: accent color `#E87A2E` on progress bar
- [ ] CTA bar (with store badges) appears immediately below the player
- [ ] GSAP entrance animation: player fades up on page load alongside other `[data-enter]` elements

- [ ] **Step 4: Verify SEO output**

View page source at `http://localhost:4321/games/pathways-poltergeists/`:

- [ ] `og:video` tag present with Mux MP4 URL
- [ ] `og:video:secure_url`, `og:video:type`, `og:video:width`, `og:video:height` all present
- [ ] Structured data block contains `VideoObject` with `contentUrl`, `embedUrl`, `thumbnailUrl`, `description`
- [ ] No YouTube URLs remaining anywhere in the page source

- [ ] **Step 5: Test reduced motion**

In browser DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`:

- [ ] Video does not autoplay (shows poster frame)
- [ ] Unmute badge does not appear
- [ ] Play button visible; clicking it plays the video manually

---

## Mux MP4 Support Prerequisite

`contentUrl` in the VideoGame schema points to `https://stream.mux.com/{playbackId}/high.mp4`. This URL only works if static MP4 renditions are enabled on the asset — **they are not on by default**.

There is no dashboard UI for this on existing assets. Enable it via the Mux API:

```bash
curl -X POST https://api.mux.com/video/v1/assets/YOUR_ASSET_ID/static-renditions \
  -H "Content-Type: application/json" \
  -u YOUR_MUX_TOKEN_ID:YOUR_MUX_TOKEN_SECRET \
  -d '{ "resolution": "highest" }'
```

Replace `YOUR_ASSET_ID` with the asset ID (different from the playback ID — find it in the Mux dashboard under the asset details). Replace the token credentials with your Mux API keys from Settings → API Access Tokens.

Once enabled, Mux will generate the MP4 — it takes a few minutes. The `contentUrl` will then resolve correctly for Google's video indexer.

**If you prefer to skip this for now:** Remove `contentUrl` from the VideoObject in `seo.ts` (Task 3, Step 2). The player, og:video tags, and `embedUrl` all work without it — only the Google Video rich results path is affected.
