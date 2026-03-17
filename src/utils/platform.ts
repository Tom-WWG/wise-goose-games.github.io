// src/utils/platform.ts
// Detect the user's platform from the User-Agent string to prioritise
// the most relevant storefront CTA.

export type DetectedPlatform = 'steam' | 'ios' | 'android' | 'unknown';

/**
 * Returns a platform key matching the keys used in Game.platforms.
 * Must be called client-side (reads navigator.userAgent).
 */
export function detectPlatform(): DetectedPlatform {
  if (typeof navigator === 'undefined') return 'unknown';

  const ua = navigator.userAgent;

  // iOS detection (iPhone, iPad, iPod — including iPadOS desktop-mode UA)
  if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }

  // Android detection
  if (/Android/i.test(ua)) {
    return 'android';
  }

  // Everything else (Windows, macOS, Linux, ChromeOS) → Steam
  return 'steam';
}
