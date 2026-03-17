# Wise Goose Games — Cinematic Studio Website Rebuild

**Date:** 2026-03-15
**Status:** Approved
**Branch:** `prototype`

## Overview

Complete rebuild of the Wise Goose Games website from static HTML to an Astro + React Islands architecture. The site serves as the studio's digital storefront — warm, intentional, and premium. Every page gets full SEO with pre-rendered HTML, while interactive components (GSAP animations, theme toggle, contact form) hydrate as React islands.

## Technical Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Astro | 5.x |
| Interactive Islands | React | 19 |
| Styling | Tailwind CSS | 3.4.x (NOT v4 — v4 has a different config model) |
| Animation | GSAP 3 + ScrollTrigger | 3.x |
| Icons | Lucide React | latest |
| Deployment | GitHub Actions → GitHub Pages | — |
| Analytics | GA4 (G-VN624MYNHY) | — |

## Project Structure

```
wise-goose-games.github.io/
├── public/                          # Static assets (copied as-is to dist/)
│   ├── WWG_Goose_Header_280px.png
│   ├── WWG_Text_Header_280px.png
│   ├── WWG_Text_Header_Dark_280px.png
│   ├── favicon.ico / .png / .svg
│   ├── apple-touch-icon-180x180.png
│   ├── og-hero-logo-1200x630.png
│   ├── logo_512x512.png
│   ├── robots.txt
│   ├── # NOTE: Do NOT place sitemap.xml here — @astrojs/sitemap generates it into dist/ at build time
│   ├── app-ads.txt
│   ├── pinterest-8e7d0.html          # Pinterest domain verification
│   ├── .nojekyll
│   ├── CNAME
│   └── .well-known/
│       └── atproto-did               # AT Protocol DID (extensionless file)
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro         # HTML shell, <ViewTransitions />, meta tags, fonts, GA4, noise overlay
│   ├── pages/
│   │   ├── index.astro              # Home: Hero → Featured Game → Philosophy → Studio
│   │   ├── games/
│   │   │   ├── index.astro          # Games catalog grid
│   │   │   └── [slug].astro         # Dynamic game detail pages (from catalog data)
│   │   ├── contact.astro
│   │   ├── privacy.astro
│   │   └── terms.astro
│   ├── components/
│   │   ├── Navbar.astro             # Static shell
│   │   ├── NavbarClient.tsx         # React island: scroll morphing, mobile menu, theme toggle
│   │   ├── Hero.tsx                 # React island: GSAP staggered entrance animations
│   │   ├── FeaturedGame.tsx         # React island: GSAP scroll-triggered cards + animations
│   │   ├── Philosophy.tsx           # React island: GSAP word-by-word fade
│   │   ├── Studio.astro             # Static — no interactivity needed
│   │   ├── GameCard.astro           # Static game card for catalog grid
│   │   ├── GameDetail.tsx           # React island: trailer, gallery lightbox, animations
│   │   ├── ContactForm.tsx          # React island: form state management
│   │   ├── Footer.astro             # Static with pulsing status dot (CSS-only animation)
│   │   └── ThemeToggle.tsx          # Embedded inside NavbarClient, not standalone
│   ├── data/
│   │   └── games.ts                 # Game catalog array (typed, modular)
│   ├── styles/
│   │   └── global.css               # CSS variables, noise overlay, base styles
│   └── utils/
│       └── seo.ts                   # Helper to generate per-page meta/OG tags
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
└── .github/workflows/deploy.yml     # Build + deploy to GH Pages
```

## Data Layer

### Game Catalog Type

```typescript
type GameStatus = "unannounced" | "announced" | "coming-soon" | "released";

interface GamePlatform {
  url: string;
  appId?: string;
}

interface Game {
  id: string;           // URL slug
  title: string;
  status: GameStatus;
  releaseDate: string | null;
  price: string | null;
  genre: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  features: string[];
  platforms: Record<string, GamePlatform>;
  trailer: string | null;
  steamAssets: {
    header?: string;
    screenshots?: string[];
  };
  pressKit: string | null;         // URL to external press kit (e.g., Google Drive folder)
  tags: string[];
  featureHighlights: {              // Structured cards for the 3-card micro-UI
    icon: string;                   // Lucide icon name (e.g., "building", "brain", "ghost")
    title: string;                  // Card heading (e.g., "Build", "Solve", "Guide")
    description: string;            // Card body text
  }[];
  keyMechanics: {
    core?: string;
    pieces?: string;
    progression?: string;
  };
  audience: {
    primary?: string;
    positioning?: string;
  };
}
```

### Rendering Rules by Status

- `"unannounced"` → excluded from `getStaticPaths()`, no page generated, no card rendered
- `"announced" | "coming-soon"` → teaser card on Games page with "Wishlist" CTA, minimal detail page
- `"released"` → full card + full detail page with all sections (trailer, features, screenshots, buy CTAs)

### Adding a Game

Drop a new object into the `games` array in `src/data/games.ts`. Set status. The catalog grid and detail pages regenerate on next build. No structural code changes needed.

## Component Architecture

### Hydration Strategy

| Component | Hydration Directive | Reason |
|-----------|-------------------|--------|
| `NavbarClient.tsx` | `client:load` | Must be interactive immediately — scroll morphing, mobile menu, theme toggle |
| `Hero.tsx` | `client:load` | GSAP entrance animation plays on page load |
| `FeaturedGame.tsx` | `client:visible` | GSAP scroll-triggered — loads when user scrolls to it |
| `Philosophy.tsx` | `client:visible` | GSAP word-by-word fade on scroll |
| `GameDetail.tsx` | `client:visible` | Lightbox gallery, trailer embed interaction |
| `ContactForm.tsx` | `client:visible` | Form state, validation, submission |
| `Footer.astro` | None (static) | Pulsing dot is CSS-only |
| `Studio.astro` | None (static) | Pure content |
| `GameCard.astro` | None (static) | Pure content |

### GSAP Pattern (all React islands)

```tsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // ScrollTrigger and timeline setup
  }, containerRef);
  return () => ctx.revert();
}, []);
```

- Default easing: `power3.out` for entrances, `power2.inOut` for morphs
- Stagger: `0.08` for text, `0.15` for cards/containers

### Navbar Scroll Morphing

- `IntersectionObserver` watches the hero section
- Hero visible: transparent background, light text over hero image
- Hero exits: transitions to `bg-[--bg-color]/60 backdrop-blur-xl` with subtle `--border-color` border
- CSS transition handles the morph (no GSAP)
- Mobile: collapses to hamburger menu

### Theme System

1. Anti-FOUC inline script in `<head>` (runs before paint):
   ```html
   <script is:inline>
     const t = localStorage.getItem('theme') ??
       (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
     document.documentElement.setAttribute('data-theme', t);
   </script>
   ```
2. `data-theme` attribute on `<html>` drives all CSS variable overrides
3. Toggle button in navbar updates `localStorage` and `data-theme`
4. Logo text wordmark swaps via CSS: `[data-theme="dark"] .logo-text-light { display: none }`

## Styling Architecture

### CSS Variables (Brand Palette)

**Light Mode (`:root` defaults):**
| Variable | Hex | Description |
|----------|-----|-------------|
| `--bg-color` | `#FDFCF8` | Warm off-white |
| `--text-color` | `#2C2C2C` | Dark gray |
| `--accent-color` | `#E87A2E` | Brand orange |
| `--accent-hover` | `#D06C28` | 12% darker |
| `--light-gray` | `#F0F0F0` | Section backgrounds |
| `--border-color` | `#E0E0E0` | Borders |
| `--surface-color` | `#FFFFFF` | Content cards, elevated surfaces |
| `--deep-dark` | `#2C2C2C` | Header/footer background |

**Dark Mode (`[data-theme="dark"]`):**
| Variable | Hex | Description |
|----------|-----|-------------|
| `--bg-color` | `#1C1612` | Warm dark brown |
| `--text-color` | `#E0E0E0` | Light gray |
| `--accent-color` | `#E87A2E` | Same brand orange |
| `--accent-hover` | `#D06C28` | Same hover |
| `--light-gray` | `#2D2621` | Warm dark sections |
| `--border-color` | `#3A342E` | Brown-gray |
| `--surface-color` | `#24201C` | Elevated cards |
| `--deep-dark` | `#0F0D0A` | Header/footer |

### Tailwind Integration

`tailwind.config.mjs` maps CSS variables to utility classes:
- `bg-bg`, `text-text`, `text-accent`, `bg-surface`, `bg-deep-dark`, etc.
- Font families: `font-body` (Montserrat), `font-drama` (Cormorant Garamond), `font-mono` (IBM Plex Mono)

### Global Texture

Noise overlay via fixed pseudo-element on `<body>` using inline SVG `<feTurbulence>` filter at `opacity: 0.05`. Applied once in `global.css`.

### Interaction Patterns

- Buttons: `scale(1.03)` on hover with `cubic-bezier(0.25, 0.46, 0.45, 0.94)`, inner `<span>` slides across for color transition
- Links: `translateY(-1px)` lift on hover
- Border radius: `rounded-2xl` to `rounded-3xl` for cards, `rounded-lg` for buttons/inputs, `rounded-t-[4rem]` for footer
- All transitions use brand orange as energy color

### Fonts

Loaded in `BaseLayout.astro` `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Cormorant+Garamond:ital,wght@1,400;1,600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

## Page Specifications

### Home (`/`)

1. **Hero** — 100dvh, game header art background with gradient overlay, "Thoughtfully crafted / Games." typography pattern (Montserrat + Cormorant Garamond italic), CTA to Steam store, GSAP staggered fade-up
2. **Featured Game** — Steam header capsule card, game info panel (title, tagline, description, platforms, price), YouTube trailer embed (16:9 responsive), three feature highlight cards (Build/Solve/Guide with micro-animations), Steam + App Store buy CTAs
3. **Philosophy** — Full-width section, "Most puzzle games focus on..." → "We focus on: hand-crafted..." typography contrast, GSAP word-by-word scroll animation, "hand-crafted" in accent orange
4. **Studio** — Brief human section about the two-person team, warm textured background

### Games (`/games`)

- Grid of game cards from catalog data
- Each card: header art, title, tagline, status badge, platform icons, CTA
- Currently one released game; "More games coming soon" note below
- Auto-expands as games are added to data

### Game Detail (`/games/[slug]`)

1. Hero banner with game art + title overlay
2. Trailer embed (YouTube, responsive)
3. Long description (rich text)
4. Features list (3-card micro-UI: Build/Solve/Guide)
5. Screenshots gallery with lightbox
6. Buy/Download CTAs (platform-specific)
7. Press kit link

### Contact (`/contact`)

- Form: Name, Email, Subject, Message
- Press inquiry note: "For press inquiries, please include your outlet name and deadline."
- ContactForm.tsx handles state and validation
- **Submission:** `mailto:contact@wisegoosegames.com` via a hidden `<form action="mailto:...">` fallback, with primary submission via [Formspree](https://formspree.io/) (free tier, no backend needed). Form ID configured as an environment variable or hardcoded in the component.
- **Validation:** Required fields: Name, Email (format check), Message. Subject optional. Inline error messages below each field on blur.
- **States:** idle → submitting (spinner on button, fields disabled) → success ("Message sent! We'll get back to you soon.") → error ("Something went wrong. Please email us directly at contact@wisegoosegames.com.")

### Privacy & Terms (`/privacy`, `/terms`)

- Static legal content migrated from existing HTML pages
- Rendered in `BaseLayout` with content-page styling

## SEO Strategy

### Per-Page Meta Tags

| Page | Title | Description | OG Image |
|------|-------|-------------|----------|
| Home | Wise Goose Games — Thoughtfully Crafted Games | Studio boilerplate | og-hero-logo-1200x630.png |
| Games | Games — Wise Goose Games | Catalog description | og-hero-logo-1200x630.png |
| Game Detail | {title} — Wise Goose Games | `shortDescription` | Steam header capsule |
| Contact | Contact — Wise Goose Games | Contact description | og-hero-logo-1200x630.png |
| Privacy/Terms | {page} — Wise Goose Games | Legal description | og-hero-logo-1200x630.png |

### Additional SEO

- Canonical URLs on every page (`https://wisegoosegames.com/...`)
- `twitter:card` = `summary_large_image` on every page
- Structured data: `Organization` schema on home, `VideoGame` schema on game detail pages
- `@astrojs/sitemap` auto-generates `sitemap.xml` from all built routes
- All pages are pre-rendered static HTML — fully crawlable

### Structured Data Templates

**Home page — Organization:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Wise Goose Games",
  "url": "https://wisegoosegames.com",
  "logo": "https://wisegoosegames.com/logo_512x512.png",
  "description": "Two-person independent game studio based in California, committed to creating thoughtfully designed interactive experiences.",
  "email": "contact@wisegoosegames.com"
}
```

**Game detail page — VideoGame:**
```json
{
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "name": "{title}",
  "description": "{shortDescription}",
  "genre": "{genre}",
  "gamePlatform": ["PC", "macOS", "iOS"],
  "applicationCategory": "Game",
  "offers": {
    "@type": "Offer",
    "price": "9.99",
    "priceCurrency": "USD"
  },
  "image": "{steamAssets.header}",
  "author": {
    "@type": "Organization",
    "name": "Wise Goose Games"
  }
}
```
Fields populated dynamically from the Game object at build time.

## Analytics

- GA4 script (`G-VN624MYNHY`) in `BaseLayout.astro` `<head>`
- Astro `<ViewTransitions />` fires `astro:page-load` on navigation
- Hook sends `page_view` event on each transition:
  ```typescript
  document.addEventListener('astro:page-load', () => {
    window.gtag?.('event', 'page_view', {
      page_location: window.location.href,
    });
  });
  ```

## Astro Configuration

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://wisegoosegames.com',
  integrations: [react(), tailwind(), sitemap()],
  // output defaults to 'static' — all pages pre-rendered at build
});
```

Tailwind `content` paths in `tailwind.config.mjs`:
```javascript
content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}']
```

## Accessibility

- All GSAP animations respect `prefers-reduced-motion: reduce` — when active, skip animations and show final state immediately:
  ```typescript
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    // Set all animated elements to their final visible state
    gsap.set(containerRef.current.querySelectorAll('[data-animate]'), { opacity: 1, y: 0, clearProps: 'all' });
    return;
  }
  ```
- Interactive elements have visible focus rings (`outline-2 outline-accent-color outline-offset-2`)
- Lightbox gallery supports keyboard navigation (arrow keys to navigate, Escape to close)
- All images have descriptive `alt` text
- Color contrast ratios meet WCAG AA for all text/background combinations in both themes

## Deployment

### GitHub Actions Workflow

- Triggers on push to `main`
- Node 20, `npm ci`, `npm run build`
- Deploys `dist/` via `actions/deploy-pages@v4`
- `CNAME` file in `public/` ensures custom domain persists

### Migration of Existing Files

- Logo PNGs (280px variants), favicons, OG image, `app-ads.txt`, `.nojekyll`, `CNAME`, `robots.txt`, `pinterest-8e7d0.html` → `public/`
- `.well-known/atproto-did` (extensionless file) → `public/.well-known/atproto-did`
- Privacy and Terms content migrated into Astro page templates
- Old `index.html`, `games.html`, `contact.html`, `styles.css`, `script.js` replaced by build output
- Old 140px logo variants (`logo-goose-140px.png`, `logo-text-140px.png`) retired — replaced by 280px versions

### .gitignore Additions

```
node_modules/
dist/
.astro/
```
