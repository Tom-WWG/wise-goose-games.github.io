// src/utils/seo.ts

export interface SEOProps {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: Record<string, unknown>;
}

const SITE_URL = "https://wisegoosegames.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-hero-logo-1200x630.png`;

export function getSEO(props: SEOProps) {
  const fullUrl = `${SITE_URL}${props.canonicalPath}`;
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
  };
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Wise Goose Games",
    url: SITE_URL,
    logo: `${SITE_URL}/logo_512x512.png`,
    description: "Two-person independent game studio based in California, committed to creating thoughtfully designed interactive experiences.",
    email: "contact@wisegoosegames.com",
  };
}

export function getVideoGameSchema(game: {
  title: string;
  shortDescription: string;
  genre: string;
  platforms: Record<string, { url: string }>;
  price: string | null;
  steamAssets: { header?: string };
}) {
  const platformMap: Record<string, string[]> = {
    steam: ["PC", "macOS"],
    ios: ["iOS"],
    android: ["Android"],
  };
  const platformNames = Object.keys(game.platforms).flatMap((p) => platformMap[p] ?? [p]);

  // Extract numeric price from string like "$9.99 USD"
  const priceMatch = game.price?.match(/[\d.]+/);
  const price = priceMatch ? priceMatch[0] : "0";

  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    description: game.shortDescription,
    genre: game.genre,
    gamePlatform: platformNames,
    applicationCategory: "Game",
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "USD",
    },
    image: game.steamAssets.header,
    author: {
      "@type": "Organization",
      name: "Wise Goose Games",
    },
  };
}
