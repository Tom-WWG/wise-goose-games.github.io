// src/utils/seo.ts

export interface SEOProps {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
  ogType?: string;
  ogVideo?: string;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

export const SITE_URL = "https://wisegoosegames.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-hero-logoV2-1200x630.png`;

export function getSEO(props: SEOProps) {
  // Ensure trailing slash consistency with sitemap
  const path = props.canonicalPath === '/' ? '/' : `${props.canonicalPath}/`;
  const fullUrl = `${SITE_URL}${path}`;
  const rawOgImage = props.ogImage ?? DEFAULT_OG_IMAGE;
  const ogImage = rawOgImage.startsWith('http') ? rawOgImage : `${SITE_URL}${rawOgImage}`;
  const ogType = props.ogType ?? "website";

  return {
    title: props.title,
    description: props.description,
    canonical: fullUrl,
    ogType,
    ogUrl: fullUrl,
    ogImage,
    ogVideo: props.ogVideo,
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
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/logo_512x512.png`,
          width: 512,
          height: 512,
        },
        description: "Two-person independent game studio based in California, committed to creating thoughtfully designed interactive experiences.",
        foundingDate: "2025-01-01",
        contactPoint: {
          "@type": "ContactPoint",
          email: "contact@wisegoosegames.com",
          contactType: "customer service",
        },
        sameAs: [
          "https://www.instagram.com/wisegoosegames/",
          "https://bsky.app/profile/wisegoosegames.com",
          "https://linktr.ee/wisegoosegames",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Wise Goose Games",
        url: SITE_URL,
        inLanguage: "en",
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
  tags?: string[];
  releaseDate: string | null;
  platforms: Record<string, { url: string; appId?: string }>;
  price: string | null;
  steamAssets: { header?: string; screenshots?: string[] };
  muxPlaybackId: string | null;
  trailerDuration?: string;
}) {
  const platformMap: Record<string, string[]> = {
    steam: ["PC", "macOS"],
    ios: ["iOS"],
    android: ["Android"],
  };
  const platformNames = Object.keys(game.platforms).flatMap((p) => platformMap[p] ?? [p]);
  const osMap: Record<string, string[]> = {
    steam: ["Windows", "macOS"],
    ios: ["iOS"],
    android: ["Android"],
  };
  const operatingSystems = Object.keys(game.platforms).flatMap((p) => osMap[p] ?? [p]);

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
  const trailer = game.muxPlaybackId
    ? {
        "@type": "VideoObject" as const,
        name: `${game.title} - Official Trailer`,
        description: `Official trailer for ${game.title}`,
        thumbnailUrl: `https://image.mux.com/${game.muxPlaybackId}/thumbnail.jpg`,
        contentUrl: `https://stream.mux.com/${game.muxPlaybackId}/highest.mp4`,
        embedUrl: `https://player.mux.com/${game.muxPlaybackId}`,
        duration: game.trailerDuration ?? "PT1M32S",
        ...(datePublished ? { uploadDate: datePublished } : {}),
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    inLanguage: "en",
    url: `${SITE_URL}/games/${game.id}/`,
    description: game.shortDescription,
    genre: game.genre,

    playMode: "https://schema.org/SinglePlayer",
    identifier: {
      "@type": "PropertyValue",
      propertyID: "SteamAppID",
      value: (game.platforms as Record<string, { url: string; appId?: string }>).steam?.appId ?? "4085150",
    },
    gamePlatform: platformNames,
    operatingSystem: operatingSystems,
    applicationCategory: "GameApplication",
    numberOfPlayers: {
      "@type": "QuantitativeValue",
      minValue: 1,
      maxValue: 1,
    },
    ...(datePublished ? { datePublished } : {}),
    offers,
    image: game.steamAssets.header
      ? `${SITE_URL}${game.steamAssets.header}`
      : undefined,
    ...(screenshots.length > 0 ? { screenshot: screenshots } : {}),
    ...(trailer ? { video: trailer } : {}),
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

/** Strip HTML tags and decode common entities so schema text is always plain text. */
function toPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    // Numeric character references (decimal and hex)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    // Named entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, ' - ')
    .replace(/&times;/g, '\u00d7')
    .replace(/&divide;/g, '\u00f7')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&ldquo;/g, '\u201c')
    .replace(/&rdquo;/g, '\u201d')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: toPlainText(faq.answer),
      },
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

export function getCollectionPageSchema(
  title: string,
  description: string,
  url: string,
  parts: { id: string }[] = []
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    name: title,
    description,
    url,
    hasPart: parts.map((p) => ({
      "@type": "WebPage",
      "@id": `${SITE_URL}/games/${p.id}/`,
    })),
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function getContactPageSchema(title: string, description: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: title,
    description,
    url,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function getArticleSchema(params: {
  headline: string;
  description: string;
  datePublished: string; // ISO 8601
  dateModified?: string; // ISO 8601, defaults to datePublished
  url: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.headline,
    description: params.description,
    datePublished: params.datePublished,
    dateModified: params.dateModified ?? params.datePublished,
    url: params.url,
    image: params.image ?? DEFAULT_OG_IMAGE,
    author: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Wise Goose Games",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Wise Goose Games",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo_512x512.png`,
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": params.url,
    },
  };
}

export function getItemListSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "WebPage",
        "@id": item.url,
        name: item.name,
      },
    })),
  };
}

export function getBlogSchema(params: {
  name: string;
  description: string;
  posts: { slug: string; title: string; datePublished: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/devlog/`,
    name: params.name,
    description: params.description,
    url: `${SITE_URL}/devlog/`,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Wise Goose Games",
    },
    blogPost: params.posts.map((p) => ({
      "@type": "BlogPosting",
      "@id": `${SITE_URL}/devlog/${p.slug}/`,
      url: `${SITE_URL}/devlog/${p.slug}/`,
      headline: p.title,
      datePublished: p.datePublished,
    })),
  };
}

export function getBlogPostingSchema(params: {
  slug: string;
  headline: string;
  description: string;
  datePublished: string; // ISO 8601 e.g. "2026-03-30"
  dateModified?: string;
  tags?: string[];
  gameId?: string;       // e.g. "pathways-poltergeists" — links to VideoGame entity
  gameTitle?: string;
  image?: string;
  authorName?: string;
}) {
  const url = `${SITE_URL}/devlog/${params.slug}/`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": url,
    headline: params.headline,
    description: params.description,
    datePublished: params.datePublished,
    dateModified: params.dateModified ?? params.datePublished,
    url,
    image: params.image ?? DEFAULT_OG_IMAGE,
    inLanguage: "en",
    author: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Wise Goose Games",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Wise Goose Games",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo_512x512.png`,
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    isPartOf: {
      "@type": "Blog",
      "@id": `${SITE_URL}/devlog/`,
    },
    ...(params.tags && params.tags.length > 0
      ? { keywords: params.tags.join(", ") }
      : {}),
    ...(params.gameId
      ? {
          about: {
            "@type": "VideoGame",
            "@id": `${SITE_URL}/games/${params.gameId}/`,
            name: params.gameTitle ?? params.gameId,
          },
        }
      : {}),
  };
}
