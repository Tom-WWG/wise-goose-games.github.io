// src/utils/utmSession.ts
// Capture inbound UTM params to sessionStorage and retrieve them.
// All sessionStorage access is wrapped in try/catch for private browsing compatibility.
//
// Note: captureInboundUtms() is exported for testability and symmetry, but is NOT
// called at runtime. The actual capture happens in an is:inline script in BaseLayout.astro
// (which cannot import modules). Only getStoredUtms() is used at runtime by StoreBadges.tsx.

const STORAGE_KEY = 'wgg_utm';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export type InboundUtms = Partial<Record<(typeof UTM_KEYS)[number], string>>;

/**
 * Parse UTM params from a full URL string and store in sessionStorage.
 * If no UTM params are found, does nothing (preserves existing stored values).
 */
export function captureInboundUtms(url: string): void {
  try {
    const params = new URL(url).searchParams;
    const utms: InboundUtms = {};
    let found = false;

    for (const key of UTM_KEYS) {
      const val = params.get(key);
      if (val) {
        utms[key] = val;
        found = true;
      }
    }

    if (found) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utms));
    }
  } catch {
    // sessionStorage unavailable or URL parse error: silently ignore
  }
}

/**
 * Read stored UTM params from sessionStorage.
 * Returns null if nothing stored, JSON is invalid, or sessionStorage is unavailable.
 */
export function getStoredUtms(): InboundUtms | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}
