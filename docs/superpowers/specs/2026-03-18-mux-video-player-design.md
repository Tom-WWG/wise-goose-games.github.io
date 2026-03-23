# Mux Video Player — Design Spec
**Date:** 2026-03-18
**Status:** Approved
**Scope:** Replace YouTube trailer embed on Pathways & Poltergeists game page with native Mux player; enrich SEO schema and Open Graph video tags.

---

## Context

The site currently embeds trailers via YouTube iframes. The goal is to migrate to Mux for self-hosted, design-native video playback. This spec covers the first migration: the trailer on the Pathways & Poltergeists game page.

**Mux asset:**
- Playback ID: `XCwylHGwg401azOsZJ8ry6HfdTj500zcAPoHAtsNuYCHM`
- Source file: `Pathways and Poltergeists Trailer_AMEND.mp4`
- Resolution tier: 1080p (source and max), basic quality, public playback policy

**Mux MP4 support prerequisite:**
`contentUrl` in the VideoGame schema points to `https://stream.mux.com/{playbackId}/high.mp4`. This URL only works if MP4 support is enabled on the Mux asset. Verify this is enabled in the Mux dashboard (Asset → Downloads → MP4 support) before deploying. If it is not enabled, either enable it or omit `contentUrl` from the VideoObject.

---

## Section 1: Data Model

**File:** `src/data/games.ts`

Replace the `trailer` field on the `Game` interface:

```ts
// Before
trailer: string | null;

// After
muxPlaybackId: string | null;
```

Update the Pathways & Poltergeists game entry:

```ts
// Before
trailer: "https://www.youtube.com/watch?v=V5bOVQK9jYY",

// After
muxPlaybackId: "XCwylHGwg401azOsZJ8ry6HfdTj500zcAPoHAtsNuYCHM",
```

The `trailer` field is removed entirely. No fallback to YouTube — this is a full replacement per Approach 3.

---

## Section 2: New `MuxTrailer.astro` Component

**Package:** `@mux/mux-player-astro` (Mux's official native Astro component)

**File:** `src/components/MuxTrailer.astro`

**SSR / hydration note:** `@mux/mux-player-astro` renders a web component (`<mux-player>`) that registers and runs entirely in the browser. No Astro client directive (e.g. `client:load`) is needed on `MuxTrailer.astro` itself — the package handles its own script loading. Since `[slug].astro` is a static page (no SSR adapter), there is no hydration mismatch risk.

### Props
```ts
interface Props {
  playbackId: string;
  title: string;
}
```

### Behavior

**Exact `@mux/mux-player-astro` prop API:**
- `playbackId` — the Mux playback ID string
- `muted` — boolean attribute; set to start muted
- `autoplay` — boolean attribute; triggers autoplay when combined with `muted`
- `loop={false}` — explicitly disabled; stops on last frame
- `playsinline` — boolean attribute; prevents iOS fullscreen hijack
- `poster` — explicitly set to `https://image.mux.com/{playbackId}/thumbnail.jpg` (Mux serves this automatically but setting it explicitly ensures the poster appears before JS loads)

**Reduced motion:** Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in an inline `<script>` within the component. If true, remove the `autoplay` attribute from the `<mux-player>` element after render, leaving the poster frame visible and requiring manual play.

### Unmute Badge (Option B)
A floating badge appears in the top-right corner of the player when the video is muted:
- Appears on load (since autoplay starts muted)
- Fades out automatically after 4 seconds via a CSS `@keyframes` animation
- Disappears immediately when the user unmutes
- Reappears if the user manually mutes again after unmuting
- Badge is not rendered when `prefers-reduced-motion` is active

**Mute state detection:** Listen to the `volumechange` event on the underlying `<video>` element inside `<mux-player>`. Access it via `muxPlayerEl.media?.nativeEl` or `muxPlayerEl.querySelector('video')`. Show/hide the badge based on `videoEl.muted`.

### Layout
Matches the current YouTube iframe wrapper exactly:
```css
width: 100%;
aspect-ratio: 16 / 9;
max-height: calc(100vh - 60px - 70px); /* viewport - navbar - CTA bar */
background: #000;
```

### CSS Theming (Mux custom properties mapped to site tokens)
| Mux Property | Value |
|---|---|
| `--media-primary-color` | `#ffffff` |
| `--media-accent-color` | `#E87A2E` (site `--accent`) |
| `--media-background-color` | `#000000` |
| `--media-control-bar-background` | `rgba(0,0,0,0.75)` |

---

## Section 3: `GameDetail.tsx` Changes

**File:** `src/components/GameDetail.tsx`

**Remove:**
- `extractYouTubeId` function (lines 13–16)
- `const videoId = game.trailer ? extractYouTubeId(game.trailer) : null;` (line 77)
- The entire trailer block (lines 195–217): the `<iframe>` and its `data-enter-detail` wrapper `div`

**No new logic added.** The component no longer references the video field at all. The `game` prop type updates automatically when `Game` is updated in Section 1.

**GSAP entrance animation note:** The existing `gsap.context()` in `GameDetail.tsx` is scoped to `pageRef` (line 101) and queries `[data-enter-detail]` only within that ref. Since `MuxTrailer.astro` will be rendered in `[slug].astro` outside the `GameDetail` React tree, it is outside `pageRef` and will not be reached by GameDetail's GSAP context. The entrance animation for the MuxTrailer wrapper is handled by a page-level script in `[slug].astro` — see Section 4d.

---

## Section 4: SEO

### 4a. `src/utils/seo.ts` — `getVideoGameSchema`

Update **both** the local structural parameter type (lines 75–85) and the VideoObject builder. Replace `trailer: string | null` with `muxPlaybackId: string | null` in the parameter type definition. The call site in `[slug].astro` passes `game` directly, so once the `Game` type is updated in Section 1, the call site resolves automatically.

Enrich the `VideoObject` using Mux's automatic asset URLs:

```ts
const trailer = game.muxPlaybackId
  ? {
      "@type": "VideoObject",
      name: `${game.title} - Official Trailer`,
      description: `Official trailer for ${game.title}`,
      thumbnailUrl: `https://image.mux.com/${game.muxPlaybackId}/thumbnail.jpg`,
      contentUrl: `https://stream.mux.com/${game.muxPlaybackId}/high.mp4`,
      embedUrl: `https://player.mux.com/${game.muxPlaybackId}`,
      ...(datePublished ? { uploadDate: datePublished } : {}),
    }
  : undefined;
```

`contentUrl` provides Google a direct crawlable video URL, required for Video rich results in search. The previous YouTube-based VideoObject omitted this field entirely. Note the MP4 support prerequisite in the Context section.

### 4b. `src/utils/seo.ts` — `SEOProps` + `getSEO`

Add optional `video` field to `SEOProps`:

```ts
video?: {
  url: string;
  secureUrl: string;
  width: number;
  height: number;
};
```

`getSEO` passes this through to the layout unchanged (included in the returned object).

### 4c. `src/layouts/BaseLayout.astro`

**Two changes required:**

1. Add `video` to the `Props` interface in `BaseLayout.astro` (the existing `Props` type is explicitly declared — without this addition the prop will be dropped or cause a type error):

```ts
interface Props {
  // ...existing fields...
  video?: {
    url: string;
    secureUrl: string;
    width: number;
    height: number;
  };
}
```

2. Destructure `video` from `Astro.props` and render the Open Graph video tags conditionally in `<head>`:

```html
{video && (
  <>
    <meta property="og:video" content={video.url} />
    <meta property="og:video:secure_url" content={video.secureUrl} />
    <meta property="og:video:type" content="video/mp4" />
    <meta property="og:video:width" content={String(video.width)} />
    <meta property="og:video:height" content={String(video.height)} />
  </>
)}
```

### 4d. `src/pages/games/[slug].astro`

**Three changes:**

1. Pass `video` into `getSEO` when `game.muxPlaybackId` is present:

```ts
const muxMp4Url = game.muxPlaybackId
  ? `https://stream.mux.com/${game.muxPlaybackId}/high.mp4`
  : undefined;

const seo = getSEO({
  // ...existing fields...
  ...(muxMp4Url ? {
    video: {
      url: muxMp4Url,
      secureUrl: muxMp4Url,
      width: 1920,  // assumes 1080p asset as specified in Context
      height: 1080,
    },
  } : {}),
});
```

2. Compose `<MuxTrailer>` above `<GameDetail>` in the page template:

```astro
{game.muxPlaybackId && (
  <div data-enter-mux class="w-full bg-black pt-[60px]">
    <MuxTrailer playbackId={game.muxPlaybackId} title={game.title} />
  </div>
)}
<div data-enter-detail-cta>
  <GameDetail client:load game={game} />
</div>
```

3. Add a page-level `<script>` to handle the entrance animations for the MuxTrailer wrapper and GameDetail, replacing the removed `data-enter-detail` logic that was previously scoped inside `GameDetail.tsx`:

```astro
<script>
  import gsap from 'gsap';
  // Animate MuxTrailer wrapper then yield to GameDetail's internal GSAP
  const muxEl = document.querySelector('[data-enter-mux]');
  if (muxEl) {
    gsap.from(muxEl, { opacity: 0, y: 20, duration: 0.5, ease: 'power3.out', delay: 0.15 });
  }
</script>
```

Note: `GameDetail`'s own `useEffect` GSAP context handles all animations for elements within the React tree (CTA bar `data-enter-detail`, scroll reveals, etc.) — no change needed there.

---

## Files Changed Summary

| File | Change |
|---|---|
| `src/data/games.ts` | `trailer` → `muxPlaybackId` on `Game` type and P&P data |
| `src/components/MuxTrailer.astro` | **New file** — Mux player with badge, theming, reduced-motion handling |
| `src/components/GameDetail.tsx` | Remove YouTube iframe, `extractYouTubeId`, `videoId` |
| `src/utils/seo.ts` | Update VideoObject to Mux URLs; add `video` to `SEOProps`; update parameter type |
| `src/layouts/BaseLayout.astro` | Add `video` to `Props` interface; render og:video tags |
| `src/pages/games/[slug].astro` | Compose `MuxTrailer`; pass `video` to `getSEO`; page-level GSAP script |
| `package.json` | Add `@mux/mux-player-astro` |

---

## Out of Scope

- Homepage video migration (separate spec)
- Mux upload workflow automation

## Follow-On TODOs (post this implementation)

- **Mux Data analytics** — enable Mux Data on the player for playback analytics (play rate, watch time, rebuffering) once the player is live
- **Twitter player card** — implement `twitter:card: "player"` with `twitter:player` embed URL for rich video previews in Twitter/X; requires security review of Mux embed URL eligibility
