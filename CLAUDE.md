# Wise Goose Games — Project Guidelines for Claude

## Git
- Do not commit or push. The user handles all git commits and PRs.

## Environment Variables / Secrets
- Always use env vars (Astro `PUBLIC_*` prefix for client-exposed values) rather than hardcoding keys, IDs, or tokens in source files.
- Public-by-design keys (e.g. Mux Data env key, analytics IDs) still belong in `.env` / CI secrets — keeps source clean and environments swappable.
- Document any new env vars needed in a comment near the usage site and in this file.

### Known env vars
| Variable | Used in | Notes |
|---|---|---|
| `PUBLIC_MUX_ENV_KEY` | `src/components/MuxTrailer.astro` | Mux Data analytics environment key |

## Copy & Writing Style
- **Never use em-dashes (—) or double dashes (`--`) as sentence punctuation.** Use a colon, comma, period, or restructured sentence instead. This applies to all copy: editorial takes, FAQ answers, subtitles, social captions, and any prose written in this project.

## Social / Platform Presence
- No Twitter/X account. Do not implement Twitter-specific features (player cards, og:twitter, etc.).

## Video
- All game trailers use Mux (not YouTube). Playback IDs are stored on the `Game` type in `src/data/games.ts`.
- MP4 static renditions are requested at `resolution: "highest"` — URL path is `/highest.mp4` (not `/high.mp4`).
- Homepage video migration (Hero.tsx) is a separate workstream — `videoId` is intentionally `null` until that spec is written.

## Deferred TODOs (post-current PR)
- Mux Data analytics (`env-key` prop on MuxPlayer) — in progress
- Homepage video migration (Hero.tsx TrailerModal)

