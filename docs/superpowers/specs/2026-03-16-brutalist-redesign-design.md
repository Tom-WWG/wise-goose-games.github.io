# Wise Goose Games — Brutalist Redesign (Core Surfaces)

**Date:** 2026-03-16
**Status:** Draft
**Branch:** `prototype`
**Builds on:** `2026-03-15-cinematic-studio-website-design.md`

## Overview

Visual redesign of the homepage and game detail page, shifting from the current warm/editorial aesthetic to a dark hybrid brutalist style. The technical stack (Astro, React islands, Tailwind, GSAP) remains unchanged. This spec covers only the two core commercial surfaces — homepage and game detail page — plus the shared chrome (navbar, footer). Remaining pages (games catalog, contact, legal, 404) will follow in a subsequent pass once the core design language is established.

## Design Philosophy

**"Treat the website like a Steam page."** Get to the gameplay hook immediately, prove it with art, convert. Every element earns its place by directly serving the conversion funnel. Text that doesn't drive action gets removed.

Key principles:
- **Media-first**: Gameplay visuals dominate every surface
- **Conversion-focused**: CTAs are always visible, never more than one scroll away
- **Minimal text**: Show, don't tell — the trailer and screenshots are the pitch
- **Sharp geometry**: Zero rounded corners, thick structural borders, aggressive right angles
- **Dark canvas**: True black backgrounds with high-contrast elements

## Visual Identity

### Direction: Dark Hybrid

Brutalist structure and conversion focus, but retains a touch of the studio's personality through serif accent text and natural-casing taglines. Not full brutalist — the game's voice still comes through.

### Color Theme System

Colors are managed through a **named theme system** using CSS custom properties. All components reference semantic tokens (`--bg-primary`, `--accent`, etc.) — never raw hex values. Swapping the entire site's color personality is a single attribute change.

**Two independent attributes on `<html>`:**
- `data-color-theme` — which color palette is active (brand personality)
- `data-theme` — light/dark structural mode (contrast inversion, kept for future use)

**Token set** (every theme must define all of these):

| Token | Purpose |
|-------|---------|
| `--bg-primary` | Page background, primary surfaces |
| `--bg-elevated` | Slightly elevated containers |
| `--bg-footer` | Footer background (studio territory) |
| `--text-primary` | Headings, game titles |
| `--text-secondary` | Taglines, secondary info |
| `--text-muted` | Tertiary text, subtle labels |
| `--text-footer` | Footer links |
| `--accent` | CTAs, accent divider lines, brand energy |
| `--accent-text` | Text color on accent backgrounds (white or dark depending on accent brightness) |
| `--border-subtle` | Navbar bottom border, structural lines |
| `--border-medium` | Screenshot grid gaps, card borders |
| `--border-strong` | Secondary button borders |

#### Theme 1: Brutalist Dark (default)

True black canvas, orange energy. The spec default.

```css
[data-color-theme="brutalist-dark"], :root {
  --bg-primary: #0A0A0A;
  --bg-elevated: #141414;
  --bg-footer: #050505;
  --text-primary: #FFFFFF;
  --text-secondary: #888888;
  --text-muted: #666666;
  --text-footer: #555555;
  --accent: #E87A2E;
  --accent-text: #FFFFFF;
  --border-subtle: #1A1A1A;
  --border-medium: #222222;
  --border-strong: #333333;
}
```

#### Theme 2: WGG Warm Dark

Original dark mode palette from the current site. Warm browns instead of true black, same orange energy. MCM feel with brutalist structure.

```css
[data-color-theme="wgg-warm-dark"] {
  --bg-primary: #1C1612;
  --bg-elevated: #24201C;
  --bg-footer: #0F0D0A;
  --text-primary: #F0EBE5;
  --text-secondary: #9A918A;
  --text-muted: #7A7068;
  --text-footer: #5A5248;
  --accent: #E87A2E;
  --accent-text: #FFFFFF;
  --border-subtle: #3A342E;
  --border-medium: #4A4038;
  --border-strong: #5A5248;
}
```

#### Theme 3: WGG Warm Light

Original cream/MCM palette. Brutalist structure with warm, inviting backgrounds. This is the light theme — replaces the old light mode toggle.

```css
[data-color-theme="wgg-warm-light"] {
  --bg-primary: #FDFCF8;
  --bg-elevated: #FFFFFF;
  --bg-footer: #2C2C2C;
  --text-primary: #2C2C2C;
  --text-secondary: #888888;
  --text-muted: #AAAAAA;
  --text-footer: #999999;
  --accent: #E87A2E;
  --accent-text: #FFFFFF;
  --border-subtle: #E0E0E0;
  --border-medium: #D0D0D0;
  --border-strong: #BBBBBB;
}
```

#### Theme 4: P&P Deep Ocean

Pathways & Poltergeists native palette. Deep navy backgrounds, cyan accent. Full immersion in the game's world.

```css
[data-color-theme="pp-deep-ocean"] {
  --bg-primary: #062028;
  --bg-elevated: #0A1F2E;
  --bg-footer: #031018;
  --text-primary: #E0F0EE;
  --text-secondary: #5A8A86;
  --text-muted: #3A6A66;
  --text-footer: #2A4A48;
  --accent: #38BDB4;
  --accent-text: #062028;
  --border-subtle: #0F3444;
  --border-medium: #1A4A52;
  --border-strong: #2A5A62;
}
```

#### Theme 5: P&P Midnight Cyan

True black base with P&P's cyan as the energy color. Brutalist + game identity hybrid.

```css
[data-color-theme="pp-midnight-cyan"] {
  --bg-primary: #0A0A0A;
  --bg-elevated: #0F1414;
  --bg-footer: #050505;
  --text-primary: #FFFFFF;
  --text-secondary: #6A8A88;
  --text-muted: #4A6A68;
  --text-footer: #3A5555;
  --accent: #38BDB4;
  --accent-text: #0A0A0A;
  --border-subtle: #1A2A2A;
  --border-medium: #2A3A3A;
  --border-strong: #3A4A4A;
}
```

#### How themes are applied

- **Site-wide default:** `:root` contains the `brutalist-dark` values. `data-color-theme` attribute on `<html>` overrides.
- **Per-page override:** A game landing page can set `data-color-theme="pp-deep-ocean"` on its `<main>` element to scope the theme to that page's content while navbar/footer inherit the site theme.
- **Seasonal/event swap:** Change the `data-color-theme` attribute on `<html>` — instant rebrand, no rebuild needed.
- **Adding new themes:** Define a new `[data-color-theme="name"]` block with all 12 tokens. That's it.
- **Persistence:** Selected theme stored in `localStorage` and applied via the same anti-FOUC inline script that handles light/dark mode.

#### Dev-only theme switcher (prototype only)

A dropdown `<select>` in the navbar (right side, before the theme toggle) allows switching between all 5 color themes in real time. Implementation:

- React component: `ThemeSwitcher.tsx`, rendered inside `NavbarClient.tsx`
- Styled as a small, minimal dropdown: `background: --bg-elevated`, `border: 1px solid --border-strong`, `color: --text-secondary`, `font-size: 10px`, uppercase, no border-radius
- On change: sets `data-color-theme` on `<html>`, persists to `localStorage`
- **Removed before production deploy** — wrapped in a `DEV_MODE` flag or environment variable check. For now, always visible on the prototype branch.

### CSS Variable Migration

The existing codebase uses `--bg-color`, `--text-color`, `--accent-color`, `--border-color`, `--surface-color`, `--deep-dark`. The new tokens above replace them. Migration strategy:

1. Update `global.css` `:root` to define the new token names with `brutalist-dark` values as defaults
2. Add all 5 theme blocks as `[data-color-theme="..."]` selectors in `global.css`
3. Update `tailwind.config.mjs` to map the new tokens to utility classes (e.g., `bg-primary` → `var(--bg-primary)`)
4. Update all component references from old utility classes to new ones
5. Remove the old variable definitions once migration is complete
6. Update the anti-FOUC script in `<head>` to also apply `data-color-theme` from `localStorage`

### Typography

Google Fonts remain loaded (Montserrat, Cormorant Garamond, IBM Plex Mono). Montserrat is the primary font; system sans-serif is the fallback, not the preference.

Font stack: `font-family: 'Montserrat', system-ui, sans-serif`

| Role | Font | Weight | Style | Case |
|------|------|--------|-------|------|
| Nav/UI labels | Montserrat | 600–700 | Normal | Uppercase, letter-spacing 0.5–1px |
| Game titles | Montserrat | 700 | Normal | Natural case |
| Taglines | Cormorant Garamond | 400 | Italic | Natural case |
| CTA buttons | Montserrat | 700 | Normal | Uppercase, letter-spacing 0.5px |
| Studio accent | Cormorant Garamond | 400 | Italic | Natural case ("est. 2025", "games") |
| Price/meta | Montserrat | 600 | Normal | Natural case |

### Shared Design Elements

**Accent divider line:** 2px solid `--accent` (`#E87A2E`). Used as a structural separator between major sections (hero→footer, trailer→CTA, screenshots→CTA). Borrowed from the "Stacked Impact" concept. This is a reusable pattern across the entire site.

**Buttons:**
- Primary: `background: --accent`, white text, no border-radius, `padding: 10px 24px`, `font-weight: 700`, `letter-spacing: 0.5px`, uppercase
- Secondary: `background: transparent`, `border: 1px solid --border-strong`, muted text color, same padding/weight
- No rounded corners on any button

**No rounded corners anywhere.** All `border-radius` values go to `0`. This applies to cards, buttons, images, containers, nav, footer — everything.

## Navbar

**Structure:** Full-width, flat, fixed at top. No floating pill, no blur, no morph.

| Left | Right |
|------|-------|
| Goose icon (square, 28px) + "WISE GOOSE" (sans-serif, 700, uppercase, letter-spacing 0.5px) | "GAMES" + "CONTACT" links (sans-serif, 600, 11px, uppercase, letter-spacing 0.5px) + theme toggle icon (square, 16px, bordered) |

- Height: 60px
- Background: `--bg-primary` (`#0A0A0A`)
- Bottom border: `1px solid --border-subtle` (`#1A1A1A`)
- Links: `--text-secondary` (`#888`), no hover animation beyond color change
- Only "GAMES" and "CONTACT" appear in the navbar. Privacy/Terms are footer-only links.
- Mobile: hamburger menu (existing pattern, restyled to match)

**Changes from current:**
- Remove pill/rounded shape
- Remove backdrop blur morph on scroll
- Remove `max-width` constraint — full-width
- Remove rounded corners
- Simplify to flat bar with thin bottom border

## Homepage

The homepage is a single-screen experience: the hero IS the page. Below the hero is only the accent divider and footer.

### Hero Section

**Layout:** Full viewport height (`100dvh`), full-bleed key art as background image.

**Hero background image:** Use `HeaderCapsuleDesignV3_Cyan.png` (920×430 Steam header capsule) as the background with `object-fit: cover` and `object-position: center`. This is the highest-quality wide-format asset available. If a higher-resolution full-bleed key visual is created later, swap it in at `public/pp-assets/`. The image is styled as a background — dark gradient overlays handle the edges.

**Art-to-Video pattern:**
1. Page loads with the header capsule art as a full-bleed background
2. A square play button (72px, `border: 2px solid rgba(255,255,255,0.7)`, no border-radius, triangle icon inside) is centered in the hero
3. Below the play button: "WATCH TRAILER" label (10px, uppercase, letter-spacing 2px, semi-transparent white)
4. Clicking the play button opens a **centered modal overlay** — dark semi-transparent backdrop (`rgba(0,0,0,0.9)`) with the YouTube trailer embedded at 16:9, max-width 90vw, centered. Close on backdrop click or Escape key. Modal approach is simpler than inline expand (avoids repositioning the title bar and gradient).

**Bottom gradient overlay:**
- `background: linear-gradient(transparent 0%, --bg-primary 100%)`
- Contains the title bar, positioned at the very bottom of the hero

**Title bar (within gradient):**
| Left | Right |
|------|-------|
| Game title (22px, 700, white, letter-spacing 1px) | Price ("$9.99", muted) + Primary CTA ("WISHLIST ON STEAM") + Secondary CTA ("APP STORE") |
| Tagline below title (12px, italic serif, `--text-secondary`) | |

**Below the hero:**
- 2px accent divider line
- Footer

**No other content on the homepage.** The hero does the entire job. When 3D printable assets arrive (~April 2026) and future games are added, new sections will be inserted between the hero and footer.

### Mobile Behavior

- Play button remains centered, scales down slightly
- Title bar stacks: title/tagline on top, CTAs below (full-width buttons)
- CTAs stack vertically on narrow screens

## Game Detail Page

Three sections: trailer, screenshots, CTA. The trailer IS the hero — no separate title/hero section above it.

### Section 1: Trailer

- Full-width embedded YouTube trailer, 16:9 aspect ratio
- `width: 100%`, `aspect-ratio: 16/9`
- **Height cap:** `max-height: calc(100vh - 130px)` — viewport minus navbar (60px) and CTA bar (70px). This ensures the CTA bar is always visible without scrolling, even on ultra-wide monitors.
- Centered horizontally with `margin: 0 auto` when the cap kicks in
- No padding, no borders around the embed — edge-to-edge

### Section 2: CTA Bar (immediately below trailer)

- `border-top: 2px solid --accent` (orange accent divider)
- `padding: 16px 32px`, `height: 70px`
- Same layout as homepage title bar:

| Left | Right |
|------|-------|
| Game title (18px, 700, white, letter-spacing 1px) | Price + Primary CTA + Secondary CTA |
| Tagline (11px, italic, muted) | |

### Section 3: Screenshot Grid

- Edge-to-edge, no padding around the grid
- `gap: 2px` between all cells (contact-sheet density)
- All images: `aspect-ratio: 16/10`, no border-radius, `object-fit: cover`
- Clickable — opens lightbox (existing lightbox pattern, restyled with sharp corners)

**Grid layout is adaptive based on available assets.** The current game has 3 screenshots in `steamAssets.screenshots`. The grid should handle any count gracefully:

| Asset count | Layout |
|-------------|--------|
| 1–2 | Single row: `1fr 1fr` (or full-width if only 1) |
| 3 | Row 1: `1fr 1fr`, Row 2: full-width single image |
| 4 | Row 1: `1fr 1fr`, Row 2: `1fr 1fr` |
| 5+ | Row 1: `1fr 1fr`, Row 2: `1fr 1fr 1fr` |

**GIF support:** The `steamAssets.screenshots` array should accept both static image paths and GIF paths — no data model change needed, just supply `.gif` files alongside `.png` files. GIFs autoplay inline within the grid.

**Mobile:** All rows collapse to single column.

**Data note:** Additional screenshots and GIFs should be added to `steamAssets.screenshots` in `games.ts` to reach the target of 5 assets. This is a content task, not a code task.

### Section 4: Final CTA Block

- `border-top: 2px solid --accent`
- Centered layout: game title (16px), tagline/availability (11px), primary + secondary CTAs
- `padding: 32px`
- Catches anyone who scrolled through the gallery

### Below Final CTA

- The final CTA block's `border-top` serves as the accent divider. No additional standalone divider line between the final CTA and footer — that would be a third orange line. The footer's own `border-top: 1px solid --border-subtle` provides the structural separation.
- Footer

## Footer

**Studio-branded** — this is Wise Goose Games territory, not game territory. Warmer personality lives here.

**Layout:** Single row, compact.

| Left | Right |
|------|-------|
| Goose icon (24px, square) + "WISE GOOSE GAMES" (sans-serif, 600, 11px, uppercase, letter-spacing 0.5px) + *"est. 2025"* (serif italic, accent color, 10px) | "Privacy" + "Terms" + "Contact" (10px, `--text-footer`) |

**Below:** Thin divider (`1px solid #111`), then copyright line (`9px, #333`).

- Background: `--bg-footer` (`#050505`)
- `border-top: 1px solid --border-subtle`
- No rounded top corners (current prototype has `rounded-t-[4rem]`)
- No "System Operational" status dot
- No 3-column grid — single row

**Changes from current:**
- Remove rounded top corners
- Remove 3-column grid layout
- Remove "System Operational" status dot
- Collapse to single compact row
- Add serif italic "est. 2025" accent

## What Gets Removed

These elements exist in the current prototype and are cut from the core surfaces:

| Element | Current Location | Reason |
|---------|-----------------|--------|
| Featured Game card | Homepage | Hero replaces it — one game, one pitch |
| Philosophy section | Homepage | Text that doesn't drive conversion |
| Studio section | Homepage | Below-fold content with no conversion purpose |
| Game detail hero banner | Game detail | Trailer IS the hero |
| Feature highlight cards (3-card) | Game detail | Show, don't tell — trailer proves the features |
| Features bullet list | Game detail | Same — text doesn't add value after video/screenshots |
| Long description text | Game detail | Unnecessary text |
| Press kit link | Game detail | Can be added back if needed, not a conversion element |
| Navbar pill/blur morph | Global | Replaced with flat bar |
| Footer 3-column grid | Global | Collapsed to single row |
| Footer status dot | Global | Decorative, no purpose |
| All rounded corners | Global | Design language change |
| Noise overlay texture | Global | Evaluate — may be too subtle for the dark brutalist canvas |

## Animations

GSAP remains as a dependency. Several animated components are being removed (FeaturedGame, Philosophy), and the remaining surfaces are much simpler. Animations for the new design:

| Element | Animation | Trigger |
|---------|-----------|---------|
| Homepage hero title bar | Fade up (`y: 20, opacity: 0 → 1`) | Page load, 0.3s delay |
| Homepage play button | Fade in (`opacity: 0 → 1`) | Page load, 0.5s delay |
| Game detail screenshot grid | Stagger fade in (`opacity: 0 → 1`, stagger 0.1s) | Scroll into view (ScrollTrigger) |
| Trailer modal | Fade in backdrop + scale up embed (`scale: 0.95 → 1`) | On play button click |

All animations respect `prefers-reduced-motion: reduce` — skip to final state immediately.

No scroll-morph animation on navbar (it stays flat always). No word-by-word text animations. Keep it minimal — the content does the work.

## What Stays (from existing codebase)

- Astro + React island architecture (no structural changes)
- `games.ts` data model (no schema changes needed)
- Color theme system with 5 named palettes (see Color Theme System section)
- Dev-only theme switcher dropdown in navbar (prototype only, removed for production)
- GSAP (simplified animation set, see Animations section)
- Lightbox gallery (restyled with sharp corners)
- SEO infrastructure (`seo.ts`, structured data, OG tags)
- GA4 analytics
- Contact form (restyled in a future pass)
- Legal pages (restyled in a future pass)
- View Transitions

## Implementation Notes

- This is a visual redesign of existing components, not a rewrite. Most changes are CSS/Tailwind class updates and HTML structure simplification.
- Components that get significantly simpler (Hero, FeaturedGame → removed, GameDetail → 3 sections) may warrant rewriting rather than editing.
- The `games.ts` data model has fields (`featureHighlights`, `keyMechanics`, `audience`, `longDescription`, `features`) that are no longer rendered on the game detail page. These can remain in the data model for now — they may be useful for SEO metadata or future surfaces.
- `GameDetail.tsx` should use `client:load` instead of `client:visible` since the trailer is now above the fold (the component IS the page content). Using `client:visible` could cause a hydration delay flash.
- Homepage hero trailer interaction uses a modal overlay (see Hero Section above).
