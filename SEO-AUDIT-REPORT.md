# SEO Audit Report — wisegoosegames.com
**Audit Date:** March 20, 2026
**Branch:** prototype
**Audited by:** Claude Code + 4 specialist subagents (Technical, Schema, Content/E-E-A-T, GEO)

---

## Overall SEO Health Score: 73 / 100

| Category | Weight | Score | Notes |
|---|---|---|---|
| Technical SEO | 25% | 74 | Solid foundation; GitHub Pages header limits |
| Content Quality / E-E-A-T | 25% | 71 | Strong game detail page; studio identity absent |
| On-Page SEO | 20% | 72 | Title/H1 issues; trailing slash inconsistency |
| Schema / Structured Data | 10% | 78 | VideoObject missing `duration`; og:type mismatch |
| Performance (Core Web Vitals) | 10% | 80 | LCP well-optimized; INP/CLS low risk |
| Images | 5% | 65 | Screenshots lack descriptive alt text |
| AI Search Readiness (GEO) | 5% | 71 | llms.txt is strong; no YouTube channel |
| **Weighted Total** | | **73 / 100** | |

---

## Executive Summary

**Business type:** Indie video game studio (single premium puzzle game, multi-platform)

### Top 5 Strengths
1. Game detail page is content-rich with substantive FAQ, VideoGame schema, and specific mechanical detail
2. Astro static generation ensures full HTML delivery to crawlers — no JS required for core content
3. `llms.txt` is present, well-structured, and ahead of most indie studios
4. AI crawler policy in robots.txt is correctly configured (search bots allowed, training bots blocked)
5. LCP image is properly optimized (`fetchpriority="high"`, srcset, webp, explicit dimensions)

### Top 5 Critical Issues
1. `VideoObject.duration` is missing — blocks Google Video rich result eligibility
2. No named creators anywhere on the site — biggest E-E-A-T gap
3. Privacy/Terms pages are indexed despite boilerplate that doesn't match actual product
4. Internal links use non-trailing-slash paths; canonicals use trailing slashes — URL mismatch risk
5. No YouTube channel — highest-correlation missing signal for AI citation

---

## Technical SEO — 74 / 100

### Crawlability — Pass (90/100)
- `robots.txt` is well-structured with correct wildcard `Allow: /` rule
- AI search crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot) explicitly allowed
- Training-only crawlers (CCBot, anthropic-ai, cohere-ai) correctly blocked
- Spam crawlers (AhrefsBot, SemrushBot, MJ12bot, DotBot) blocked — reduces crawl budget waste
- `llms.txt` present and discoverable at well-known path
- Bluesky domain verification file (`.well-known/atproto-did`) present

### Indexability — Partial (65/100)

**🔴 HIGH: Trailing slash inconsistency**
Navbar (`Navbar.astro`) links to `/games` and `/contact` (no trailing slash). Footer links to `/privacy`, `/terms`, `/contact` (no trailing slash). Canonicals resolve to `/games/`, `/contact/`, `/privacy/`, `/terms/`. If GitHub Pages doesn't issue a 301 for the non-slash variants, these are canonical mismatches. All internal nav and footer links should use trailing slashes to match canonicals.

**🔴 HIGH: Privacy and Terms pages indexed with boilerplate mismatch**
Both pages are in the sitemap with no `noindex`. The privacy policy references social login, ads, leaderboards, and anti-cheat — none of which apply to a premium puzzle game with no ads or IAP. This creates an E-E-A-T credibility gap. Immediate fix: add `noindex: true` to both `privacy.astro` and `terms.astro` (the `BaseLayout` already supports the `noindex` prop). Remove both from the sitemap. Rewrite policies to match actual data practices.

**Medium: `/sitemap.xml` returns 404**
Correct URL is `/sitemap-index.xml`. Many tools probe `/sitemap.xml` by convention. Submit the correct URL explicitly in Google Search Console and Bing Webmaster Tools. The `robots.txt` `Sitemap:` directive is also currently absent (see GEO section).

**Medium: Games page H1 is `sr-only` / visually hidden**
Not a ranking issue (Google reads screen-reader content), but the visual page experience has no visible H1.

### Security Headers — Fail (35/100)

GitHub Pages does not support custom HTTP response headers. The following are absent on every page:

| Header | Impact |
|---|---|
| `Strict-Transport-Security` (HSTS) | High |
| `Content-Security-Policy` | High |
| `X-Frame-Options` | Medium |
| `X-Content-Type-Options` | Medium |
| `Referrer-Policy` | Low |

HTTPS is served by GitHub Pages (custom domain CNAME in place) so the base transport is encrypted. **Moving to Cloudflare as a CDN proxy** (even free tier) is the only architectural path to add these headers without changing the hosting platform.

**Separate issue:** GA4 measurement ID `G-VN624MYNHY` is hardcoded in `BaseLayout.astro:135`. Per `CLAUDE.md`, this belongs in a `PUBLIC_GA_MEASUREMENT_ID` environment variable.

### Mobile Optimization — Pass (85/100)
- Viewport meta tag present
- Responsive Tailwind breakpoints used throughout
- Hamburger nav has correct ARIA attributes
- Minor: Navbar mobile link tap targets ~40px — below 48px recommended minimum. Increase `py-3` to `py-4`.

### Core Web Vitals — Pass (80/100)

**LCP:** Hero image has `fetchpriority="high"`, 4-size srcset, `.webp` format, explicit dimensions. Self-hosted fonts preloaded. GA4 loads async after `<body>`. Well-optimized.

**INP:** Partial hydration via `client:visible` correctly applied to below-fold components. `ScreenshotLightbox` uses `client:load` unnecessarily — switch to `client:visible`.

**CLS:** Hero and screenshot images declare explicit `width`/`height`. Theme script runs inline in `<head>` preventing FOUC. Low risk.

**Note:** `decoding="async"` on the LCP hero image alongside `fetchpriority="high"` is slightly suboptimal — `decoding="sync"` may marginally improve paint timing, though impact is likely negligible.

### JavaScript Rendering — Pass (85/100)
All content relevant to ranking is in static HTML: structured data, headings, descriptions, game data, FAQ schema. Nothing required for indexing is gated behind JS.

### IndexNow — Partial (60/100)
Key file (`/bb3809dfdbbb4aeab50800de2cf1c1e5.txt`) is present and correct. No automated submission mechanism exists. A GitHub Actions workflow on deployment should POST updated URLs to `api.indexnow.org`.

---

## Schema / Structured Data — 78 / 100

### What's Implemented (All JSON-LD, correct format)

| Page | Schemas |
|---|---|
| Homepage | Organization (with @graph), WebSite |
| `/games/` | CollectionPage, BreadcrumbList |
| `/games/pathways-poltergeists/` | VideoGame (with VideoObject + Offers), FAQPage, BreadcrumbList |
| `/contact/` | ContactPage, BreadcrumbList |

### 🔴 Critical

**`duration` missing from `VideoObject`**
`duration` is a **required** property for Google Video rich results. Without it, the trailer schema is valid but ineligible for the Video rich result in SERPs. Add the actual trailer runtime in ISO 8601 format:
```json
"duration": "PT1M32S"
```

### 🟠 High Priority

**`og:type` should be `"game"` on game detail page** — currently `"website"` on all pages.

**`og:image:width` and `og:image:height` missing on all pages** — the homepage OG image filename implies `1200×630`; declare explicitly. Some platforms skip images without declared dimensions.

**`og:locale` absent across all pages** — add `"en_US"` site-wide.

**`og:video` tags appear after `</head>` on game detail page** — move into `<head>` with other OG tags.

**`playMode` on VideoGame:**
```json
"playMode": "https://schema.org/SinglePlayer"
```

**Duplicate email in Organization schema** — email appears at top-level AND inside `contactPoint`. Remove top-level duplicate.

### 🟡 Medium Priority

- Add `keywords` from `games.ts` tags array to VideoGame schema (Puzzle, Logic, Strategy, etc.)
- Add `identifier` with Steam App ID (`PropertyValue` with value `"4085150"`)
- Add `hasPart` to CollectionPage schema referencing the VideoGame URL
- Change `offers[].price` from string `"9.99"` to number `9.99` (Schema.org spec correctness)

### Twitter Card Tags
`twitter:*` meta tags are present in `BaseLayout.astro` despite `CLAUDE.md` explicitly prohibiting Twitter-specific features. They're harmless (Discord reads them too), but inconsistent with the project policy.

### 🔵 Future: `aggregateRating`
Once public Steam/App Store reviews exist, add `aggregateRating` to VideoGame. This is the most direct path to star rating display in SERPs — one of the highest-CTR rich result features for product pages.

### FAQPage Note
Google restricted FAQ rich results to government/healthcare sites in August 2023 — commercial sites don't get the accordion SERP feature. However, the 14 Q&A pairs are well-structured and actively benefit AI/LLM systems (Google AIO, Perplexity, ChatGPT) that do parse FAQPage from commercial sites. Keep it.

---

## Content Quality / E-E-A-T — 71 / 100

| Dimension | Score | Notes |
|---|---|---|
| Experience | 14/20 | Game data is hands-on specific; zero developer identity anywhere |
| Expertise | 19/25 | Accurate, precise content; no attributed authorship |
| Authoritativeness | 16/25 | Entity exists; no third-party citations or press links |
| Trustworthiness | 22/30 | Strong purchase transparency; missing location and named contact |

### The Single Biggest Gap: No Named Humans

No founder, developer, or creator name appears anywhere on the site — not in copy, not in bios, not in schema. For a two-person studio, naming both people is the highest-leverage E-E-A-T action available. It simultaneously improves Experience, Expertise, and Authoritativeness scores and directly aligns with the September 2025 QRG updates reinforcing attributable authorship.

**Recommendation:** Create an About page with both names, one-sentence backgrounds, and the Marina, California location. Link from the footer. Add `Person` schema entities linked to `Organization` via the `founder` property.

### Page-by-Page Assessment

**Game Detail (`/games/pathways-poltergeists/`) — Strong**
~1,185 words, 14 FAQ pairs, specific mechanical detail (piece types, zone count, puzzle count), purchase-transparency copy ("no ads, no IAP"). Well above average for an indie launch page.

Issues:
- H2 redundancy: `<h2>Pathways & Poltergeists</h2>` appears mid-page as a CTA section header — the game title already used as H1. Replace with an action-oriented heading ("Available Now", "Get the Game")
- No system requirements (min/recommended specs for Windows/macOS/iOS/Android) — a standard purchase-decision query completely unaddressed
- Screenshots lack descriptive alt text — image search value is zero
- No named developers anywhere in copy or schema

**Homepage (`/`) — Moderate**
Under 150 words of body copy. H1 is the game title rather than a studio identity headline — this positions a game entity as the organization's primary identity. As more games are released, this creates structural hierarchy problems. The Organization schema is studio-focused but the heading hierarchy contradicts it.

**Games Page (`/games/`) — Weak — Thin Content Risk**
~50 words of visible content. H1 duplicates the title tag exactly ("Games — Wise Goose Games"). H1 should be natural-language ("Our Games"); the title tag carries the suffix. 300–400 words of studio philosophy, genre focus, and future-game context would resolve the thin content risk without requiring new content types.

**Contact Page (`/contact/`) — Thin**
43 words of visible content. No H2/H3 subheadings. No response time expectation. No physical location. Add an expected response time, mention all inquiry types from the meta description, and add "Marina, California" to the page or footer.

### Meta Description Quality

| Page | Length | Assessment |
|---|---|---|
| Homepage | 159 chars | Good — "respect players' intelligence" is a specific differentiator |
| Game detail | 143 chars | Excellent — action verb, specific mechanic, honest difficulty signal |
| Games page | 73 chars | Weak — too short, no specificity, overstates a one-game catalog |
| Contact | 101 chars | Adequate |

### Keyword Gaps

These high-value queries are unaddressed in body copy:
- "indie puzzle game" (not present anywhere)
- "cozy puzzle game" (in meta description only, not in body copy — significant given it's a recognized Steam genre tag)
- "ghost puzzle game" (natural long-tail for this title)
- "puzzle game for iPhone" / "logic puzzle Steam" (platform + genre discovery queries)

---

## AI Search Readiness (GEO) — 71 / 100

| Platform | Score |
|---|---|
| Google AI Overviews | 68/100 |
| ChatGPT (GPTBot) | 72/100 |
| Perplexity | 74/100 |
| Bing Copilot | 65/100 |

### Strengths
- **`llms.txt` is present and well-structured** — 21 Q&As, comparison queries ("games like Monument Valley"), category queries ("best puzzle games under $10"), all store links. Ahead of most indie studios.
- Static generation means AI crawlers receive complete HTML with no JS execution required
- FAQPage schema with 14 complete, self-contained Q&A pairs is well-built
- robots.txt correctly distinguishes AI search bots (allowed) from training crawlers (blocked)
- Key mechanic descriptions in `games.ts` are under 50 words and standalone-citable

### Critical GEO Gap: No YouTube Channel

YouTube mention correlation with AI citation is ~0.737 — the strongest off-site signal measured. The trailer exists only on Mux (not indexed by YouTube). Create a YouTube channel, upload the trailer, and add the channel URL to `Organization.sameAs` in `getOrganizationSchema()`. This single action improves citation rates across ChatGPT, Perplexity, and Google AIO.

### Other GEO Issues

**🟠 No `Sitemap:` directive in robots.txt** — add `Sitemap: https://wisegoosegames.com/sitemap-index.xml` to `public/robots.txt`.

**🟡 llms.txt missing RSL 1.0 license declaration** — add `> License: RSL 1.0` near the top.

**🟡 FAQ drawer HTML uses `<span>` inside `<button>`, not `<h3>` elements** — FAQ questions don't appear in the document heading outline. FAQPage schema compensates for schema-aware crawlers, but wrapping question text in a semantic `<h3>` adds redundant coverage.

**🟡 No Reddit presence** — r/indiegaming, r/puzzlegames, r/patientgamers, r/AndroidGaming, and r/iosgaming are indexed by all major AI platforms. A genuine launch post with honest positioning ("$9.99, no ads, cozy-looking but actually hard") would create high-value off-site citations.

**🟡 FAQ drawer content hidden via `maxHeight: 0` without JS** — `client:visible` means the drawer isn't in initial static HTML. FAQPage schema in `<head>` mitigates this for schema-aware crawlers, but plain-HTML crawlers won't see the FAQ text. Consider server-rendering the drawer open (CSS-only collapse).

---

## Prioritized Action Plan

### 🔴 Critical — Fix Immediately

| # | Issue | File(s) | Effort |
|---|---|---|---|
| C1 | Add `duration` to VideoObject in VideoGame schema | `src/utils/seo.ts` | XS |
| C2 | Add `noindex: true` to Privacy and Terms pages | `src/pages/privacy.astro`, `src/pages/terms.astro` | XS |
| C3 | Fix trailing slash in all Navbar and Footer internal links | `src/components/Navbar.astro`, `src/components/Footer.astro` | XS |

### 🟠 High — Fix Within 1 Week

| # | Issue | File(s) | Effort |
|---|---|---|---|
| H1 | Add named creators (About page or homepage section) with `Person` schema | New page or `src/pages/index.astro` | M |
| H2 | Change `og:type` to `"game"` on game detail pages | `src/utils/seo.ts` | XS |
| H3 | Add `og:image:width`, `og:image:height`, `og:locale` to all pages | `src/layouts/BaseLayout.astro`, `src/utils/seo.ts` | S |
| H4 | Add `Sitemap:` directive to robots.txt | `public/robots.txt` | XS |
| H5 | Create YouTube channel, upload trailer, add to `Organization.sameAs` | `src/utils/seo.ts` + off-site | M |
| H6 | Add `playMode` to VideoGame schema | `src/utils/seo.ts` | XS |
| H7 | Remove duplicate `email` from Organization schema top-level | `src/utils/seo.ts` | XS |
| H8 | Move `og:video` tags into `<head>` | `src/layouts/BaseLayout.astro` | XS |

### 🟡 Medium — Fix Within 1 Month

| # | Issue | File(s) | Effort |
|---|---|---|---|
| M1 | Rewrite Privacy and Terms policies to match actual product | `src/pages/privacy.astro`, `src/pages/terms.astro` | L |
| M2 | Expand Games page to 300–400 words; fix H1/title duplication | `src/pages/games/index.astro` | S |
| M3 | Add system requirements section to game detail page | `src/data/games.ts`, `src/components/GameDetail.astro` | S |
| M4 | Fix H2 redundancy on game detail (replace game-title H2 with CTA heading) | `src/components/GameDetail.astro` | XS |
| M5 | Add `keywords` and `identifier` (Steam App ID) to VideoGame schema | `src/utils/seo.ts` | XS |
| M6 | Add `hasPart` to CollectionPage schema | `src/utils/seo.ts` | XS |
| M7 | Move GA4 measurement ID to `PUBLIC_GA_MEASUREMENT_ID` env var | `src/layouts/BaseLayout.astro`, `.env` | XS |
| M8 | Add RSL 1.0 license declaration to llms.txt | `public/llms.txt` | XS |
| M9 | Add "cozy puzzle game" / "indie puzzle game" naturally to game detail copy | `src/data/games.ts` | S |
| M10 | Switch `ScreenshotLightbox` from `client:load` to `client:visible` | `src/components/GameDetail.astro` | XS |
| M11 | Add descriptive alt text to all game screenshots | `src/data/games.ts`, `src/components/GameDetail.astro` | S |
| M12 | Set up IndexNow GitHub Action for deployment-triggered URL submission | `.github/workflows/` | M |
| M13 | Post on Reddit communities (r/indiegaming, r/puzzlegames, etc.) | Off-site | S |

### 🔵 Low — Backlog

| # | Issue | Notes |
|---|---|---|
| L1 | Remove or make optional Twitter Card meta tags | Violates CLAUDE.md; low actual harm |
| L2 | Add sitemap `<lastmod>` attributes | Configure `@astrojs/sitemap` with `lastmod` option |
| L3 | Increase Navbar mobile tap targets from `py-3` to `py-4` | 40px → 48px+ recommended |
| L4 | Add `aggregateRating` to VideoGame once public Steam/App Store reviews exist | Enables star rating in SERPs |
| L5 | FAQ drawer: wrap question text in `<h3>` elements | `src/components/FAQDrawer.tsx` |
| L6 | Server-render FAQ drawer open (CSS collapse only, no JS) | Improves AI crawler access to FAQ text |
| L7 | Consider Cloudflare CDN for security header support | Architecture change, enables HSTS/CSP |
| L8 | Start a devlog/blog (even quarterly) for E-E-A-T first-person experience signals | Content strategy |

---

## Files With Most Impact

| File | Issues |
|---|---|
| `src/utils/seo.ts` | VideoObject duration, og:type, og:image dimensions, og:locale, og:video placement, playMode, keywords, identifier, hasPart, Organization email duplicate, Organization sameAs (YouTube) |
| `src/layouts/BaseLayout.astro` | Twitter Card tags, GA4 env var |
| `src/pages/privacy.astro` + `terms.astro` | Add noindex, rewrite policies |
| `src/components/Navbar.astro` + `Footer.astro` | Trailing slash on internal links |
| `src/data/games.ts` | Screenshot alt text, system requirements, keyword copy, VideoObject duration |
| `public/robots.txt` | Add Sitemap: directive |
| `public/llms.txt` | RSL 1.0 license line |
| `src/components/GameDetail.astro` | H2 heading fix, ScreenshotLightbox hydration strategy |
