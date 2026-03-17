// src/utils/utm.ts
// Platform-aware UTM link builder for store page tracking.
//
// Steam: standard UTM query params (utm_source, utm_medium, utm_campaign)
// Apple App Store: ct (campaign token) + mt=8 (iOS app media type)
// Google Play: UTM params URL-encoded inside a `referrer` query param

const UTM_SOURCE = 'wgg_website';
const UTM_CAMPAIGN = 'pp_launch';

type StoreUrlOptions = {
  /** The page/section the link appears on (e.g. 'hero', 'game_detail', 'game_card') */
  content: string;
};

/**
 * Detect platform from URL and append the correct tracking parameters.
 */
export function buildTrackedUrl(baseUrl: string, opts: StoreUrlOptions): string {
  const { content } = opts;

  // Steam
  if (baseUrl.includes('store.steampowered.com')) {
    const sep = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${sep}utm_source=${UTM_SOURCE}&utm_medium=web&utm_campaign=${UTM_CAMPAIGN}&utm_content=${content}`;
  }

  // Apple App Store — uses ct (campaign token, max 40 chars) and mt=8
  if (baseUrl.includes('apps.apple.com')) {
    const ct = `${UTM_SOURCE}_${content}`.slice(0, 40);
    const sep = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${sep}ct=${ct}&mt=8`;
  }

  // Google Play — UTMs inside URL-encoded `referrer` param
  if (baseUrl.includes('play.google.com')) {
    const referrer = [
      `utm_source=${UTM_SOURCE}`,
      `utm_medium=web`,
      `utm_campaign=${UTM_CAMPAIGN}`,
      `utm_content=${content}`,
    ].join('&');
    const encoded = encodeURIComponent(referrer);
    const sep = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${sep}referrer=${encoded}`;
  }

  // Unknown platform — return as-is
  return baseUrl;
}
