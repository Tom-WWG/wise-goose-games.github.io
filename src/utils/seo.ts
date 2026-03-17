// src/utils/seo.ts

export interface SEOProps {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

const SITE_URL = "https://wisegoosegames.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-hero-logo-1200x630.png`;

export function getSEO(props: SEOProps) {
  // Ensure trailing slash consistency with sitemap
  const path = props.canonicalPath === '/' ? '/' : `${props.canonicalPath}/`;
  const fullUrl = `${SITE_URL}${path}`;
  const ogImage = props.ogImage ?? DEFAULT_OG_IMAGE;
  const ogType = props.ogType ?? "website";

  return {
    title: props.title,
    description: props.description,
    canonical: fullUrl,
    ogType,
    ogUrl: fullUrl,
    ogImage,
    twitterCard: "summary_large_image" as const,
    structuredData: props.structuredData,
    noindex: props.noindex ?? false,
  };
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Wise Goose Games",
        url: SITE_URL,
        logo: `${SITE_URL}/logo_512x512.png`,
        description: "Two-person independent game studio based in California, committed to creating thoughtfully designed interactive experiences.",
        email: "contact@wisegoosegames.com",
        foundingDate: "2025",
        contactPoint: {
          "@type": "ContactPoint",
          email: "contact@wisegoosegames.com",
          contactType: "customer support",
        },
        sameAs: [
          "https://store.steampowered.com/app/4085150/Pathways__Poltergeists/",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Wise Goose Games",
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}

export function getVideoGameSchema(game: {
  id: string;
  title: string;
  shortDescription: string;
  genre: string;
  releaseDate: string | null;
  platforms: Record<string, { url: string }>;
  price: string | null;
  steamAssets: { header?: string; screenshots?: string[] };
  trailer: string | null;
}) {
  const platformMap: Record<string, string[]> = {
    steam: ["PC", "macOS"],
    ios: ["iOS"],
    android: ["Android"],
  };
  const platformNames = Object.keys(game.platforms).flatMap((p) => platformMap[p] ?? [p]);
  const osMap: Record<string, string> = {
    steam: "Windows, macOS",
    ios: "iOS",
    android: "Android",
  };
  const operatingSystems = Object.keys(game.platforms).map((p) => osMap[p] ?? p);

  // Extract numeric price from string like "$9.99 USD"
  const priceMatch = game.price?.match(/[\d.]+/);
  const price = priceMatch ? priceMatch[0] : "0";

  // Parse release date to ISO 8601
  const datePublished = game.releaseDate ? parseReleaseDate(game.releaseDate) : undefined;

  // Build offers array with one per platform
  const offers = Object.values(game.platforms).map((platform) => ({
    "@type": "Offer" as const,
    price,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: platform.url,
  }));

  // Build screenshot URLs (absolute)
  const screenshots = (game.steamAssets.screenshots ?? []).map((s) =>
    s.startsWith("http") ? s : `${SITE_URL}${s}`
  );

  // Build trailer VideoObject if available
  const trailer = game.trailer
    ? {
        "@type": "VideoObject" as const,
        name: `${game.title} - Official Trailer`,
        url: game.trailer,
        thumbnailUrl: game.steamAssets.header
          ? `${SITE_URL}${game.steamAssets.header}`
          : undefined,
        ...(datePublished ? { uploadDate: datePublished } : {}),
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    url: `${SITE_URL}/games/${game.id}/`,
    description: game.shortDescription,
    genre: game.genre,
    gamePlatform: platformNames,
    operatingSystem: operatingSystems,
    applicationCategory: "Game",
    numberOfPlayers: {
      "@type": "QuantitativeValue",
      value: 1,
    },
    ...(datePublished ? { datePublished } : {}),
    offers,
    image: game.steamAssets.header
      ? `${SITE_URL}${game.steamAssets.header}`
      : undefined,
    ...(screenshots.length > 0 ? { screenshot: screenshots } : {}),
    ...(trailer ? { trailer } : {}),
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Wise Goose Games",
    },
    author: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Wise Goose Games",
    },
  };
}

export function getBreadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/** Parse "February 27, 2026" to "2026-02-27" */
function parseReleaseDate(dateStr: string): string | undefined {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().split("T")[0];
  } catch {
    return undefined;
  }
}
