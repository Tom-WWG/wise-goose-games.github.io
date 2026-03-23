# Mux Data Analytics Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable Mux Data playback telemetry on the trailer player by wiring in the env key and video metadata attributes.

**Architecture:** Three isolated changes — a local `.env.local` file for development, a GitHub Actions workflow tweak for production builds, and two new attributes on the `MuxPlayer` component. No new files, no interface changes, no dependencies.

**Tech Stack:** Astro 5, `@mux/mux-player-astro` v3.11.5, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-03-19-mux-data-analytics-design.md`

---

## Chunk 1: Environment variable wiring

### Task 1: Create `.env.local` for local development

**Files:**
- Create: `.env.local`

**Context:** Astro loads env files in this order: `.env`, `.env.local`, `.env.[mode]`, `.env.[mode].local`. `.env.local` is the standard for local developer overrides and is excluded by Astro's default `.gitignore` (pattern `.env*.local`). The env var must use the `PUBLIC_` prefix so Astro inlines the **value** into the client bundle at build time — the variable name itself will not appear in `dist/`.

Get the env key value from Mux dashboard → **Monitoring → Environments**.

- [ ] **Step 1: Verify `.env.local` is gitignored**

  Run:
  ```bash
  grep -E '\.env' .gitignore
  ```
  Confirm a line covers `.env.local` specifically — either `.env.local` explicitly, `.env*.local`, or `*.local`. A generic `.env` match is not sufficient. If no matching pattern exists, add `.env.local` to `.gitignore`.

- [ ] **Step 2: Create `.env.local`**

  Create `.env.local` at the project root (replace `<your-mux-env-key>` with the actual value):
  ```
  PUBLIC_MUX_ENV_KEY=<your-mux-env-key>
  ```

- [ ] **Step 3: Build and confirm env var was inlined**

  Astro replaces `PUBLIC_MUX_ENV_KEY` with the actual value during build — the variable name will not appear in `dist/`. To confirm the value was inlined, grep for the env key value itself:

  ```bash
  npm run build && grep -r "<your-mux-env-key>" dist/ | head -5
  ```
  Expected: at least one match in the dist output. If no match, Astro resolved the var as `undefined` (it may appear as the literal string `"undefined"` in dist). Re-check that `.env.local` exists at the project root with the exact variable name `PUBLIC_MUX_ENV_KEY` and no surrounding whitespace.

---

### Task 2: Expose the variable in the GitHub Actions build

**Files:**
- Modify: `.github/workflows/deploy.yml:34-35`

**Context:** The existing `Build` step (lines 34–35) has no `env:` block, so `import.meta.env.PUBLIC_MUX_ENV_KEY` resolves to `undefined` in production builds. Choose either a repository **variable** or **secret** (both work — see below), then add the `env:` block to the Build step.

**Variable vs Secret:**
The Mux Data env key is a public telemetry identifier that ships in the browser bundle. A repository **variable** is semantically appropriate for non-sensitive config:
- Add under: Settings → Secrets and variables → Actions → **Variables** tab
- Reference in workflow: `${{ vars.PUBLIC_MUX_ENV_KEY }}`

If you prefer a repository **secret** (e.g. for consistency with other credentials):
- Add under: Settings → Secrets and variables → Actions → **Secrets** tab
- Reference in workflow: `${{ secrets.PUBLIC_MUX_ENV_KEY }}`

The `vars.` and `secrets.` references are **not interchangeable** — using the wrong one will silently resolve to an empty string.

- [ ] **Step 1: Add the repository variable (or secret) in GitHub**

  Navigate to the appropriate tab (Variables or Secrets) at:
  `https://github.com/<owner>/wise-goose-games.github.io/settings/secrets/actions`

  Create:
  - Name: `PUBLIC_MUX_ENV_KEY`
  - Value: *(your Mux Data env key)*

- [ ] **Step 2: Add `env:` block to the Build step**

  In `.github/workflows/deploy.yml`, `env:` must be a **sibling of `run:` and `name:`** within the step — same indentation level. It must not be nested under `run:` or hoisted to the job level.

  From:
  ```yaml
        - name: Build
          run: npm run build
  ```
  To (using repository variable):
  ```yaml
        - name: Build
          run: npm run build
          env:
            PUBLIC_MUX_ENV_KEY: ${{ vars.PUBLIC_MUX_ENV_KEY }}
  ```

- [ ] **Step 3: Verify YAML structure**

  Run:
  ```bash
  npx js-yaml .github/workflows/deploy.yml > /dev/null && echo "YAML OK"
  ```
  Expected: `YAML OK`

  Then visually confirm `env:` is indented at the same level as `run:` — not nested under `run:`, not at the job level.

---

## Chunk 2: MuxPlayer attributes

### Task 3: Add `env-key` and `metadata-video-id` to MuxPlayer

**Files:**
- Modify: `src/components/MuxTrailer.astro:14-23`

**Context:**
- `{ playbackId, title }` are already destructured from `Astro.props` at line 9 — both are in scope in the template
- `metadata-video-title={title}` is already on the `MuxPlayer` element (line 16) — do not add it again
- Only two attributes are missing: `metadata-video-id` and `env-key`
- `metadata-video-id` is used by Mux Data to group plays by video in the dashboard; using `playbackId` (the Mux playback ID) as the value is the correct choice — it is a stable, unique video identifier
- Use kebab-case — these pass through to the underlying `mux-player` web component. The correct Mux attribute for analytics is `env-key` (per Mux docs); do **not** use `data-env-key` or camelCase (`envKey`)
- If `PUBLIC_MUX_ENV_KEY` is `undefined`, Mux Player silently skips telemetry — no errors, no broken player. Astro may render the attribute as `env-key="undefined"` in this case, which is benign.

- [ ] **Step 1: Add the two attributes to `<MuxPlayer>`**

  Update the `<MuxPlayer>` opening tag to add `metadata-video-id` and `env-key` after the existing `metadata-video-title`:

  ```astro
  <MuxPlayer
    playback-id={playbackId}
    metadata-video-title={title}
    metadata-video-id={playbackId}
    env-key={import.meta.env.PUBLIC_MUX_ENV_KEY}
    poster={poster}
    muted
    autoplay
    loop={false}
    playsInline
    style="--media-primary-color: #ffffff; --media-accent-color: #E87A2E; --media-background-color: #000000; --media-control-bar-background: rgba(0,0,0,0.75);"
  />
  ```

- [ ] **Step 2: Run type check**

  ```bash
  npx astro check
  ```
  Expected: `0 errors`

- [ ] **Step 3: Build and verify `env-key` has a real value**

  ```bash
  npm run build && grep -r "env-key" dist/ | head -5
  ```
  Expected: output containing `env-key="<your-mux-env-key>"` with the actual key value (not `"undefined"`). If the value is `"undefined"`, the env var was not injected — re-check Task 1 Step 2.

- [ ] **Step 4: Manual dev server verification**

  Run:
  ```bash
  npm run dev
  ```
  Open `http://localhost:4321/games/pathways-poltergeists/` and verify:
  - Player autoplays muted as before
  - Unmute badge appears and fades
  - No console errors related to `mux-player` or `env-key`

- [ ] **Step 5: Post-deploy verification**

  After merging and the GitHub Actions build completes:
  1. Open the deployed page and let the trailer play for a few seconds
  2. Go to Mux dashboard → **Monitoring → Real-time** — a play event should appear within ~60 seconds
  3. If no events appear after 2–3 minutes: check the Actions build log for the Build step and confirm `PUBLIC_MUX_ENV_KEY` has a non-empty value. If missing, add the repository variable/secret and re-run the workflow.
