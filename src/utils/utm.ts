// src/utils/utm.ts
// Platform-aware UTM link builder for store page tracking.
//
// Steam: standard UTM query params (utm_source, utm_medium, utm_campaign)
// Apple App Store: ct (campaign token) + mt=8 (iOS app media type)
// Google Play: UTM params URL-encoded inside a `referrer` query param

const UTM_SOURCE = 'wgg_website';

export type StoreUrlOptions = {
  /** The page/section the link appears on (e.g. 'hero_cta', 'game_card') */
  content: string;
  /** Inbound campaign name from sessionStorage, if any */
  campaign?: string;
};

/**
 * Detect platform from URL and append the correct tracking parameters.
 */
export function buildTrackedUrl(baseUrl: string, opts: StoreUrlOptions): string {
  const { content, campaign } = opts;
  const enc = encodeURIComponent;

  // Steam
  if (baseUrl.includes('store.steampowered.com')) {
    const sep = baseUrl.includes('?') ? '&' : '?';
    const parts = [
      `utm_source=${enc(UTM_SOURCE)}`,
      `utm_medium=web`,
      ...(campaign ? [`utm_campaign=${enc(campaign)}`] : []),
      `utm_content=${enc(content)}`,
    ];
    return `${baseUrl}${sep}${parts.join('&')}`;
  }

  // Apple App Store: ct (campaign token, max 40 chars) + mt=8
  if (baseUrl.includes('apps.apple.com')) {
    const ctRaw = campaign
      ? `${UTM_SOURCE}_${campaign}_${content}`
      : `${UTM_SOURCE}_${content}`;
    const ct = ctRaw.slice(0, 40);
    const sep = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${sep}ct=${enc(ct)}&mt=8`;
  }

  // Google Play: UTMs inside URL-encoded `referrer` param
  if (baseUrl.includes('play.google.com')) {
    const parts = [
      `utm_source=${enc(UTM_SOURCE)}`,
      `utm_medium=web`,
      ...(campaign ? [`utm_campaign=${enc(campaign)}`] : []),
      `utm_content=${enc(content)}`,
    ];
    const referrer = parts.join('&');
    const encoded = encodeURIComponent(referrer);
    const sep = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${sep}referrer=${encoded}`;
  }

  // Unknown platform: return as-is
  return baseUrl;
}
