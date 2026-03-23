# Mux Data Analytics — Design Spec

**Date:** 2026-03-19
**Status:** Approved
**Scope:** Add Mux Data playback analytics to the MuxTrailer component via environment variable.

---

## Goal

Enable Mux Data telemetry on the Pathways & Poltergeists trailer so playback metrics (views, watch time, rebuffer rate, etc.) are visible in the Mux dashboard. Keep the env key out of source using Astro's `PUBLIC_*` env var convention.

---

## Out of Scope

- Twitter player card — no Twitter/X account; skipped permanently
- Mux Data for any future video players — they will inherit this pattern when added
- `metadata-viewer-id` — Mux Data recommends a session UUID for viewer-level analytics even without auth, but this is deferred; the tradeoff is play counts and engagement are aggregated per-video rather than per-viewer session. Can be added later via `sessionStorage` UUID without any schema changes.

---

## Changes

### 1. `.env` (new file, gitignored)

```
PUBLIC_MUX_ENV_KEY=1vfges
```

Astro's standard `.gitignore` already excludes `.env`. Verify this is present before committing.

### 2. `.github/workflows/deploy.yml` — Build step

The existing `Build` step has no `env:` block. Add one:

```yaml
- name: Build
  run: npm run build
  env:
    PUBLIC_MUX_ENV_KEY: ${{ vars.PUBLIC_MUX_ENV_KEY }}
```

`vars.*` (not `secrets.*`) is the correct GitHub Actions mechanism for non-sensitive public values. Add `PUBLIC_MUX_ENV_KEY` as a **repository variable** (Settings → Secrets and variables → Actions → Variables tab) with value `1vfges`.

**Fallback behaviour:** If the variable is missing from the GitHub Actions environment, `import.meta.env.PUBLIC_MUX_ENV_KEY` resolves to `undefined` at build time. `mux-player` silently omits telemetry when `env-key` is undefined — no build error, no broken player. Analytics simply won't appear in the Mux dashboard. This is acceptable; it is not a build failure condition.

### 3. `src/components/MuxTrailer.astro`

`MuxTrailer` already accepts `playbackId: string` and `title: string` as Astro props. Add three kebab-case HTML attributes to `<MuxPlayer>` (kebab-case is correct here — these are passed through to the underlying `mux-player` web component, not consumed as Astro props):

| Attribute | Value | Purpose |
|---|---|---|
| `env-key` | `{import.meta.env.PUBLIC_MUX_ENV_KEY}` | Activates Mux Data telemetry |
| `metadata-video-id` | `{playbackId}` | Groups plays by video in dashboard |
| `metadata-video-title` | `{title}` | Labels the video in the Mux dashboard (required for meaningful reporting) |

Do **not** use camelCase equivalents (`envKey`, `metadataVideoId`) — those are not valid props on this component.

---

## Files Touched

| File | Change |
|---|---|
| `.env` | New file — `PUBLIC_MUX_ENV_KEY=1vfges` |
| `.github/workflows/deploy.yml` | Add `env:` block to the `Build` step |
| `src/components/MuxTrailer.astro` | Add `env-key`, `metadata-video-id`, `metadata-video-title` to `<MuxPlayer>` |
| `CLAUDE.md` | Already updated with env var preference and known vars table |

---

## Notes

- `PUBLIC_MUX_ENV_KEY` is intentionally public (Mux Data env keys are client-side telemetry identifiers). Repository variables are the correct GitHub mechanism for public build-time values.
- The `playbackId` and `title` values used for metadata are already available in `MuxTrailer.astro` as existing component props — no new data plumbing needed.
