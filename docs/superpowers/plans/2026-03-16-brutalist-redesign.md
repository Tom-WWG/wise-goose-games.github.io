# Brutalist Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the homepage and game detail page with a dark brutalist visual language, add a 5-theme color system with dev-only switcher, and strip all non-conversion content.

**Architecture:** CSS custom properties drive all colors through named themes (`data-color-theme` attribute). Components are rewritten to match the new minimal structure (hero-only homepage, trailer→screenshots→CTA game detail). Existing Astro + React island architecture is preserved.

**Tech Stack:** Astro 5, React 19, Tailwind 3.4, GSAP 3, CSS custom properties

**Spec:** `docs/superpowers/specs/2026-03-16-brutalist-redesign-design.md`

---

## File Structure

### Files to create:
- `src/components/ThemeSwitcher.tsx` — Dev-only color theme dropdown
- `src/components/TrailerModal.tsx` — YouTube trailer modal overlay (used by homepage hero)

### Files to heavily modify (rewrite):
- `src/styles/global.css` — Replace old variables with 5-theme system, update button styles, remove noise overlay
- `tailwind.config.mjs` — Remap color utilities to new tokens
- `src/components/NavbarClient.tsx` — Flat bar, no pill/blur, add theme switcher
- `src/components/Hero.tsx` — Art-to-video hero with play button and trailer modal
- `src/components/GameDetail.tsx` — Strip to trailer→CTA→screenshots→CTA
- `src/components/Footer.astro` — Single-row studio-branded footer
- `src/pages/index.astro` — Remove FeaturedGame, studio section
- `src/layouts/BaseLayout.astro` — Update anti-FOUC script for color themes

### Files with minor modifications:
- `src/pages/games/[slug].astro` — Change hydration directive to `client:load`
- `src/components/Navbar.astro` — No structural change needed

### Files with backward-compat concern (NOT modified in this plan):
- `src/pages/404.astro`, `src/pages/terms.astro`, `src/pages/privacy.astro`, `src/pages/contact.astro`, `src/pages/games/index.astro`, `src/components/ContactForm.tsx`, `src/components/GameCard.astro` — These use old Tailwind classes (`bg-bg`, `text-text`, `bg-surface`, `border-border`). The Tailwind config must keep backward-compatible aliases so these pages don't break. They will be restyled in a follow-up pass.

### Files unchanged:
- `src/data/games.ts` — No schema changes
- `src/utils/seo.ts` — No changes
- `astro.config.mjs` — No changes

---

## Chunk 1: Theme Infrastructure

### Task 1: Replace CSS variables with 5-theme system

**Files:**
- Modify: `src/styles/global.css` (full rewrite)

- [ ] **Step 1: Rewrite global.css with new theme system**

Replace the entire file. The `:root` block defines `brutalist-dark` as default. Each `[data-color-theme="..."]` selector overrides all 12 tokens.

```css
/* src/styles/global.css */

/* ===== Theme System ===== */
/* Default: Brutalist Dark */
:root,
[data-color-theme="brutalist-dark"] {
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

/* ===== Base Reset ===== */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Montserrat', system-ui, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.6;
  min-height: 100vh;
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* ===== Button Styles ===== */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 10px 24px;
  background-color: var(--accent);
  color: var(--accent-text);
  font-family: 'Montserrat', system-ui, sans-serif;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border: none;
  border-radius: 0;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 10px 24px;
  background-color: transparent;
  color: var(--text-secondary);
  font-family: 'Montserrat', system-ui, sans-serif;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border: 1px solid var(--border-strong);
  border-radius: 0;
  cursor: pointer;
  text-decoration: none;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.btn-secondary:hover {
  border-color: var(--text-secondary);
  color: var(--text-primary);
}

/* ===== Focus Rings (Accessibility) ===== */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ===== Backward-compat aliases for unrewritten pages ===== */
/* Remove once all pages migrate to new tokens */
:root {
  --bg-color: var(--bg-primary);
  --text-color: var(--text-primary);
  --accent-color: var(--accent);
  --accent-hover: var(--accent);
  --light-gray: var(--bg-elevated);
  --border-color: var(--border-subtle);
  --surface-color: var(--bg-elevated);
  --deep-dark: var(--bg-footer);
}

/* Legacy button class (used by 404, ContactForm) */
.btn-accent {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background-color: var(--accent);
  color: var(--accent-text);
  font-family: 'Montserrat', system-ui, sans-serif;
  font-weight: 700;
  font-size: 1rem;
  border: none;
  border-radius: 0;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.2s ease;
}
.btn-accent:hover {
  opacity: 0.9;
}

/* ===== Reduced Motion ===== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Verify file saved correctly**

Run: `head -5 src/styles/global.css`
Expected: comment and `:root` opening

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: replace CSS variables with 5-theme color system"
```

---

### Task 2: Update Tailwind config for new tokens

**Files:**
- Modify: `tailwind.config.mjs`

- [ ] **Step 1: Rewrite tailwind.config.mjs**

```js
// tailwind.config.mjs
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // New theme tokens
        'bg-primary': 'var(--bg-primary)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-footer': 'var(--bg-footer)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-footer': 'var(--text-footer)',
        accent: 'var(--accent)',
        'accent-text': 'var(--accent-text)',
        'border-subtle': 'var(--border-subtle)',
        'border-medium': 'var(--border-medium)',
        'border-strong': 'var(--border-strong)',
        // Backward-compat aliases (used by unrewritten pages: 404, terms, privacy, contact, games index)
        // Remove these once all pages are migrated to new tokens
        bg: 'var(--bg-primary)',
        text: 'var(--text-primary)',
        'accent-hover': 'var(--accent)', // old hover maps to accent
        'light-gray': 'var(--bg-elevated)',
        border: 'var(--border-subtle)',
        surface: 'var(--bg-elevated)',
        'deep-dark': 'var(--bg-footer)',
      },
      fontFamily: {
        body: ['Montserrat', 'system-ui', 'sans-serif'],
        drama: ['Cormorant Garamond', 'serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Commit**

```bash
git add tailwind.config.mjs
git commit -m "feat: remap Tailwind colors to new theme tokens"
```

---

### Task 3: Update anti-FOUC script for color themes

**Files:**
- Modify: `src/layouts/BaseLayout.astro:38-52`

- [ ] **Step 1: Replace both anti-FOUC scripts**

Replace the two `<script is:inline>` blocks (lines 38-52) with:

```html
<!-- Anti-FOUC: set theme before paint -->
<script is:inline>
  (function() {
    var ct = localStorage.getItem('color-theme') || 'brutalist-dark';
    document.documentElement.setAttribute('data-color-theme', ct);
  })();
</script>
<!-- Re-apply theme after ViewTransitions swap -->
<script is:inline>
  document.addEventListener('astro:after-swap', function() {
    var ct = localStorage.getItem('color-theme') || 'brutalist-dark';
    document.documentElement.setAttribute('data-color-theme', ct);
  });
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: update anti-FOUC script for color theme system"
```

---

### Task 4: Create ThemeSwitcher component

**Files:**
- Create: `src/components/ThemeSwitcher.tsx`

- [ ] **Step 1: Write ThemeSwitcher.tsx**

```tsx
// src/components/ThemeSwitcher.tsx
import { useState, useEffect } from 'react';

const themes = [
  { value: 'brutalist-dark', label: 'BRUTALIST DARK' },
  { value: 'wgg-warm-dark', label: 'WGG WARM DARK' },
  { value: 'wgg-warm-light', label: 'WGG WARM LIGHT' },
  { value: 'pp-deep-ocean', label: 'P&P DEEP OCEAN' },
  { value: 'pp-midnight-cyan', label: 'P&P MIDNIGHT CYAN' },
];

export default function ThemeSwitcher() {
  const [current, setCurrent] = useState('brutalist-dark');

  useEffect(() => {
    const stored = localStorage.getItem('color-theme') || 'brutalist-dark';
    setCurrent(stored);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setCurrent(value);
    document.documentElement.setAttribute('data-color-theme', value);
    localStorage.setItem('color-theme', value);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-secondary)] text-[10px] font-semibold tracking-wider uppercase py-1 px-2 cursor-pointer focus:outline-none focus:border-[var(--accent)]"
      style={{ borderRadius: 0 }}
      aria-label="Color theme"
    >
      {themes.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ThemeSwitcher.tsx
git commit -m "feat: add dev-only ThemeSwitcher dropdown component"
```

---

## Chunk 2: Shared Chrome (Navbar + Footer)

### Task 5: Rewrite NavbarClient for brutalist flat bar

**Files:**
- Modify: `src/components/NavbarClient.tsx` (full rewrite)

- [ ] **Step 1: Rewrite NavbarClient.tsx**

```tsx
// src/components/NavbarClient.tsx
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';

interface Props {
  currentPath: string;
}

const navLinks = [
  { href: '/games', label: 'GAMES' },
  { href: '/contact', label: 'CONTACT' },
];

export default function NavbarClient({ currentPath }: Props) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [currentPath]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-6 md:px-8"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo */}
      <a href="/" className="flex items-center gap-2">
        <img
          src="/WWG_Goose_Header_280px.png"
          alt="Wise Goose Games"
          className="h-7 w-auto"
        />
        <span
          className="hidden sm:inline font-body font-bold text-sm tracking-wide"
          style={{ color: 'var(--text-primary)', letterSpacing: '0.5px' }}
        >
          WISE GOOSE
        </span>
      </a>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-5">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="font-body font-semibold text-[11px] tracking-wider transition-colors hover:text-[var(--text-primary)]"
            style={{
              color: currentPath === link.href
                ? 'var(--text-primary)'
                : 'var(--text-secondary)',
              letterSpacing: '0.5px',
            }}
          >
            {link.label}
          </a>
        ))}
        <ThemeSwitcher />
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden p-2"
        style={{ color: 'var(--text-primary)' }}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile dropdown */}
      {isMobileOpen && (
        <div
          className="absolute top-[60px] left-0 right-0 md:hidden flex flex-col py-4 px-6 gap-1"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-3 px-4 font-body font-semibold text-xs tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setIsMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="px-4 py-3">
            <ThemeSwitcher />
          </div>
        </div>
      )}
    </nav>
  );
}
```

- [ ] **Step 2: Start dev server and verify navbar renders**

Run: `npm run dev`
Expected: Navbar appears as flat bar, theme switcher dropdown visible, no pill shape

- [ ] **Step 3: Commit**

```bash
git add src/components/NavbarClient.tsx
git commit -m "feat: rewrite navbar as flat brutalist bar with theme switcher"
```

---

### Task 6: Rewrite Footer as single-row studio-branded

**Files:**
- Modify: `src/components/Footer.astro` (full rewrite)

- [ ] **Step 1: Rewrite Footer.astro**

```astro
---
// src/components/Footer.astro
---

<footer
  style="background-color: var(--bg-footer); border-top: 1px solid var(--border-subtle);"
>
  <div class="max-w-6xl mx-auto px-6 md:px-8 py-6">
    <div class="flex flex-col md:flex-row items-center justify-between gap-4">
      <!-- Left: Studio brand -->
      <div class="flex items-center gap-3">
        <img
          src="/WWG_Goose_Header_280px.png"
          alt="Wise Goose Games"
          class="h-6 w-auto opacity-60"
        />
        <span
          class="font-body font-semibold text-[11px] uppercase tracking-wider"
          style="color: var(--text-footer); letter-spacing: 0.5px;"
        >
          WISE GOOSE GAMES
        </span>
        <span
          class="font-drama italic text-[10px]"
          style="color: var(--accent);"
        >
          est. 2025
        </span>
      </div>

      <!-- Right: Legal links -->
      <div class="flex items-center gap-4">
        <a
          href="/privacy"
          class="font-body text-[10px] font-medium transition-colors hover:text-[var(--text-secondary)]"
          style="color: var(--text-footer);"
        >
          Privacy
        </a>
        <a
          href="/terms"
          class="font-body text-[10px] font-medium transition-colors hover:text-[var(--text-secondary)]"
          style="color: var(--text-footer);"
        >
          Terms
        </a>
        <a
          href="/contact"
          class="font-body text-[10px] font-medium transition-colors hover:text-[var(--text-secondary)]"
          style="color: var(--text-footer);"
        >
          Contact
        </a>
      </div>
    </div>

    <!-- Copyright -->
    <div
      class="mt-4 pt-3 text-center md:text-left"
      style="border-top: 1px solid var(--border-subtle);"
    >
      <span class="text-[9px]" style="color: var(--text-muted);">
        &copy; 2026 Wise Goose Games. All rights reserved.
      </span>
    </div>
  </div>
</footer>
```

- [ ] **Step 2: Verify footer renders in dev server**

Expected: Single-row footer, studio brand with "est. 2025" serif accent, legal links right-aligned, no rounded corners, no status dot

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat: rewrite footer as single-row studio-branded bar"
```

---

## Chunk 3: Homepage

### Task 7: Create TrailerModal component

**Files:**
- Create: `src/components/TrailerModal.tsx`

- [ ] **Step 1: Write TrailerModal.tsx**

```tsx
// src/components/TrailerModal.tsx
import { useEffect } from 'react';
import gsap from 'gsap';

interface Props {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TrailerModal({ videoId, isOpen, onClose }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Animate on open
  useEffect(() => {
    if (!isOpen) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo(
      '.trailer-modal-backdrop',
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
    gsap.fromTo(
      '.trailer-modal-embed',
      { scale: 0.95, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out', delay: 0.1 }
    );
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="trailer-modal-backdrop fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Game trailer"
    >
      <div
        className="trailer-modal-embed w-[90vw] max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1`}
            title="Game trailer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TrailerModal.tsx
git commit -m "feat: add TrailerModal component for homepage hero"
```

---

### Task 8: Rewrite Hero for art-to-video pattern

**Files:**
- Modify: `src/components/Hero.tsx` (full rewrite)

- [ ] **Step 1: Rewrite Hero.tsx**

```tsx
// src/components/Hero.tsx
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Gamepad2, Apple } from 'lucide-react';
import type { Game } from '../data/games';
import TrailerModal from './TrailerModal';

function extractYouTubeId(url: string): string | null {
  const match = url.match(/[?&]v=([^&#]+)/) ?? url.match(/youtu\.be\/([^?&#]+)/);
  return match ? match[1] : null;
}

interface Props {
  game: Game;
  headerImage: string;
}

export default function Hero({ game, headerImage }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const videoId = game.trailer ? extractYouTubeId(game.trailer) : null;

  const steamPlatform = game.platforms['steam'];
  const iosPlatform = game.platforms['ios'];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(containerRef.current?.querySelectorAll('[data-animate]') ?? [], {
        opacity: 1, y: 0, clearProps: 'all',
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from('[data-animate="play"]', {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.5,
      });
      gsap.from('[data-animate="bar"]', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        delay: 0.3,
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <section
        ref={containerRef}
        data-hero
        className="relative flex items-center justify-center overflow-hidden"
        style={{ height: '100dvh' }}
      >
        {/* Background key art */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${headerImage})` }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(transparent 0%, var(--bg-primary) 100%)`,
          }}
        />

        {/* Play button — centered */}
        {videoId && (
          <button
            data-animate="play"
            onClick={() => setShowTrailer(true)}
            className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer"
            aria-label="Watch trailer"
          >
            <div
              className="w-[72px] h-[72px] flex items-center justify-center transition-colors"
              style={{
                border: '2px solid rgba(255,255,255,0.7)',
                backgroundColor: 'rgba(0,0,0,0.4)',
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '20px solid white',
                  borderTop: '12px solid transparent',
                  borderBottom: '12px solid transparent',
                  marginLeft: '4px',
                }}
              />
            </div>
            <span className="text-[10px] font-body font-semibold tracking-[2px] text-white/70 uppercase">
              WATCH TRAILER
            </span>
          </button>
        )}

        {/* Bottom title bar */}
        <div
          data-animate="bar"
          className="absolute bottom-0 left-0 right-0 z-10 px-6 md:px-8 pb-6"
          style={{
            background: `linear-gradient(transparent, var(--bg-primary))`,
            paddingTop: '80px',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1
                className="font-body font-bold text-[22px] md:text-[26px]"
                style={{ color: 'var(--text-primary)', letterSpacing: '1px' }}
              >
                {game.title}
              </h1>
              <p
                className="font-drama italic text-[12px] md:text-[14px] mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                {game.tagline}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {game.price && (
                <span
                  className="font-body font-semibold text-[12px] mr-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {game.price}
                </span>
              )}
              {steamPlatform && (
                <a
                  href={steamPlatform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center gap-2"
                >
                  <Gamepad2 size={14} />
                  WISHLIST ON STEAM
                </a>
              )}
              {iosPlatform && (
                <a
                  href={iosPlatform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center gap-2"
                >
                  <Apple size={14} />
                  APP STORE
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Accent divider */}
      <div className="h-[2px]" style={{ backgroundColor: 'var(--accent)' }} />

      {/* Trailer modal */}
      {videoId && (
        <TrailerModal
          videoId={videoId}
          isOpen={showTrailer}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Hero.tsx
git commit -m "feat: rewrite Hero with art-to-video pattern and CTA bar"
```

---

### Task 9: Update homepage to hero-only

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Rewrite index.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getSEO, getOrganizationSchema } from '../utils/seo';
import { games } from '../data/games';
import Hero from '../components/Hero.tsx';

const game = games[0];

const seo = getSEO({
  title: 'Wise Goose Games — Thoughtfully Crafted Games',
  description: 'Wise Goose Games LLC is a two-person independent game studio based in California, committed to creating thoughtfully designed interactive experiences that respect players\' intelligence.',
  canonicalPath: '/',
  structuredData: getOrganizationSchema(),
});
---

<BaseLayout {...seo}>
  <Hero client:load game={game} headerImage="/pp-assets/HeaderCapsuleDesignV3_Cyan.png" />
</BaseLayout>
```

- [ ] **Step 2: Verify homepage in dev server**

Expected: Full-viewport hero with key art background, centered play button, title + CTAs at bottom, accent divider, footer. No FeaturedGame, no studio one-liner.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: strip homepage to hero-only layout"
```

---

## Chunk 4: Game Detail Page

### Task 10: Rewrite GameDetail for trailer→screenshots→CTA

**Files:**
- Modify: `src/components/GameDetail.tsx` (full rewrite)

- [ ] **Step 1: Rewrite GameDetail.tsx**

```tsx
// src/components/GameDetail.tsx
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Gamepad2, Apple, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Game } from '../data/games';

gsap.registerPlugin(ScrollTrigger);

function extractYouTubeId(url: string): string | null {
  const match = url.match(/[?&]v=([^&#]+)/) ?? url.match(/youtu\.be\/([^?&#]+)/);
  return match ? match[1] : null;
}

function CTABar({ game, centered = false }: { game: Game; centered?: boolean }) {
  const steamPlatform = game.platforms['steam'];
  const iosPlatform = game.platforms['ios'];

  const layout = centered
    ? 'flex flex-col items-center text-center gap-4'
    : 'flex flex-col md:flex-row md:items-center md:justify-between gap-4';

  return (
    <div
      className="px-6 md:px-8 py-4"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderTop: '2px solid var(--accent)',
      }}
    >
      <div className={layout}>
        <div>
          <h2
            className={`font-body font-bold ${centered ? 'text-[16px]' : 'text-[18px]'}`}
            style={{ color: 'var(--text-primary)', letterSpacing: '1px' }}
          >
            {game.title}
          </h2>
          <p
            className="font-drama italic text-[11px] mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            {centered ? `Available now on Steam and iOS` : game.tagline}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {game.price && !centered && (
            <span
              className="font-body font-semibold text-[12px] mr-2"
              style={{ color: 'var(--text-muted)' }}
            >
              {game.price}
            </span>
          )}
          {steamPlatform && (
            <a
              href={steamPlatform.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn-primary flex items-center gap-2 ${centered ? 'px-8 py-3 text-[13px]' : ''}`}
            >
              <Gamepad2 size={14} />
              GET ON STEAM
            </a>
          )}
          {iosPlatform && (
            <a
              href={iosPlatform.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn-secondary flex items-center gap-2 ${centered ? 'px-7 py-3 text-[13px]' : ''}`}
            >
              <Apple size={14} />
              APP STORE
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  game: Game;
}

export default function GameDetail({ game }: Props) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const screenshots = game.steamAssets.screenshots ?? [];
  const videoId = game.trailer ? extractYouTubeId(game.trailer) : null;

  // Lightbox keyboard handler
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => i !== null ? Math.min(i + 1, screenshots.length - 1) : null);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => i !== null ? Math.max(i - 1, 0) : null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, screenshots.length]);

  // GSAP stagger on screenshots
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(pageRef.current?.querySelectorAll('[data-reveal]') ?? [], {
        opacity: 1, clearProps: 'all',
      });
      return;
    }

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('[data-reveal]');
      gsap.from(items, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: '.screenshot-grid',
          start: 'top 85%',
          once: true,
        },
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  // Adaptive grid layout based on screenshot count
  const renderScreenshotGrid = () => {
    if (screenshots.length === 0) return null;

    const count = screenshots.length;
    let row1: string[] = [];
    let row2: string[] = [];

    if (count === 1) {
      row1 = screenshots.slice(0, 1);
    } else if (count === 2) {
      row1 = screenshots.slice(0, 2);
    } else if (count === 3) {
      row1 = screenshots.slice(0, 2);
      row2 = screenshots.slice(2, 3);
    } else if (count === 4) {
      row1 = screenshots.slice(0, 2);
      row2 = screenshots.slice(2, 4);
    } else {
      row1 = screenshots.slice(0, 2);
      row2 = screenshots.slice(2, 5);
    }

    const renderCell = (src: string, globalIndex: number) => (
      <button
        key={src}
        data-reveal
        onClick={() => setLightboxIndex(globalIndex)}
        className="block overflow-hidden cursor-zoom-in focus-visible:outline-[var(--accent)] group"
        style={{ aspectRatio: '16/10' }}
        aria-label={`View screenshot ${globalIndex + 1}`}
      >
        <img
          src={src}
          alt={`${game.title} screenshot ${globalIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </button>
    );

    const row1Cols = row1.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2';
    const row2Cols = row2.length === 1 ? 'grid-cols-1'
      : row2.length === 2 ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

    return (
      <div className="screenshot-grid" style={{ marginTop: '2px' }}>
        <div className={`grid ${row1Cols}`} style={{ gap: '2px' }}>
          {row1.map((src, i) => renderCell(src, i))}
        </div>
        {row2.length > 0 && (
          <div className={`grid ${row2Cols}`} style={{ gap: '2px', marginTop: '2px' }}>
            {row2.map((src, i) => renderCell(src, row1.length + i))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={pageRef}>
      {/* ===== TRAILER: Full-width, capped height ===== */}
      {videoId && (
        <div style={{ backgroundColor: '#000' }}>
          <div
            className="w-full mx-auto"
            style={{
              aspectRatio: '16/9',
              maxHeight: 'calc(100vh - 130px)',
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

      {/* ===== CTA BAR: Immediately below trailer ===== */}
      <CTABar game={game} />

      {/* ===== SCREENSHOT GRID: Edge-to-edge ===== */}
      {renderScreenshotGrid()}

      {/* ===== FINAL CTA: Centered, below screenshots ===== */}
      <CTABar game={game} centered />

      {/* ===== LIGHTBOX ===== */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot lightbox"
        >
          <button
            className="absolute top-4 right-4 p-2 transition-colors"
            style={{ color: 'rgba(255,255,255,0.8)' }}
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            aria-label="Close lightbox"
          >
            <X size={24} />
          </button>

          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 p-2 transition-colors"
              style={{ color: 'rgba(255,255,255,0.8)' }}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i !== null ? Math.max(i - 1, 0) : null); }}
              aria-label="Previous screenshot"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          <img
            src={screenshots[lightboxIndex]}
            alt={`${game.title} screenshot ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {lightboxIndex < screenshots.length - 1 && (
            <button
              className="absolute right-4 p-2 transition-colors"
              style={{ color: 'rgba(255,255,255,0.8)' }}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i !== null ? Math.min(i + 1, screenshots.length - 1) : null); }}
              aria-label="Next screenshot"
            >
              <ChevronRight size={32} />
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-body text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {lightboxIndex + 1} / {screenshots.length}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update [slug].astro hydration directive**

In `src/pages/games/[slug].astro`, change `client:load` is already set (line 28). Verify it says `client:load` not `client:visible`.

- [ ] **Step 3: Verify game detail page in dev server**

Navigate to `/games/pathways-poltergeists`.
Expected: Trailer fills top, CTA bar immediately below, screenshot grid, final CTA, footer. No feature cards, no bullet lists, no hero banner.

- [ ] **Step 4: Commit**

```bash
git add src/components/GameDetail.tsx src/pages/games/\[slug\].astro
git commit -m "feat: rewrite GameDetail as trailer→screenshots→CTA"
```

---

## Chunk 5: Cleanup & Verification

### Task 11: Remove unused components and verify build

**Files:**
- Modify: `src/components/FeaturedGame.tsx` — keep file but note it's unused (may be needed for games catalog later)
- Modify: `src/components/Philosophy.tsx` — same

- [ ] **Step 1: Verify the build succeeds**

Run: `npm run build`
Expected: Build completes with no errors. Warnings about unused imports are OK.

- [ ] **Step 2: Run dev server and test all pages**

Run: `npm run dev`

Verify:
1. Homepage (`/`): hero-only with play button, CTAs, accent divider, footer
2. Game detail (`/games/pathways-poltergeists`): trailer, CTA bar, screenshots, final CTA, footer
3. Theme switcher: cycle through all 5 themes on both pages — colors should change everywhere
4. Mobile: navbar hamburger works, CTAs stack vertically on homepage
5. Lightbox: click screenshots on game detail, arrow keys work, Escape closes
6. Trailer modal: click play button on homepage, trailer opens, backdrop click closes

- [ ] **Step 3: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: cleanup and verify brutalist redesign"
```

---

## Summary

| Task | Component | Type |
|------|-----------|------|
| 1 | global.css — 5-theme system | Rewrite |
| 2 | tailwind.config.mjs — new tokens | Rewrite |
| 3 | BaseLayout.astro — anti-FOUC | Modify |
| 4 | ThemeSwitcher.tsx | Create |
| 5 | NavbarClient.tsx — flat bar | Rewrite |
| 6 | Footer.astro — single-row | Rewrite |
| 7 | TrailerModal.tsx | Create |
| 8 | Hero.tsx — art-to-video | Rewrite |
| 9 | index.astro — hero-only | Rewrite |
| 10 | GameDetail.tsx — trailer→CTA | Rewrite |
| 11 | Build verification | Test |
