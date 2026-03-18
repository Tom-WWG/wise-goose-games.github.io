// src/data/games.ts

export type GameStatus = "unannounced" | "announced" | "coming-soon" | "released";

export interface GamePlatform {
  url: string;
  appId?: string;
}

export interface FeatureHighlight {
  icon: string;
  title: string;
  description: string;
}

export interface PressQuote {
  source: string;
  quote: string;
  url?: string;
}

export interface Award {
  name: string;
  event: string;
  year?: number;
}

export interface SocialProof {
  steamReviewSummary?: string;
  pressQuotes?: PressQuote[];
  awards?: Award[];
}

export interface Game {
  id: string;
  title: string;
  status: GameStatus;
  releaseDate: string | null;
  price: string | null;
  genre: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  features: string[];
  platforms: Record<string, GamePlatform>;
  trailer: string | null;
  steamAssets: {
    header?: string;
    screenshots?: string[];
  };
  pressKit: string | null;
  tags: string[];
  featureHighlights: FeatureHighlight[];
  keyMechanics: {
    core?: string;
    pieces?: string;
    progression?: string;
  };
  audience: {
    primary?: string;
    positioning?: string;
  };
  socialProof?: SocialProof;
  faq?: { question: string; answer: string }[];
}

export const games: Game[] = [
  {
    id: "pathways-poltergeists",
    title: "Pathways & Poltergeists",
    status: "released",
    releaseDate: "February 27, 2026",
    price: "$9.99 USD",
    genre: "Spatial Puzzle",
    tagline: "Build pathways from puzzle blocks.",
    shortDescription: "Guide ghost friends home by building pathways from polyomino pieces. A cozy-looking spatial puzzle game that will absolutely break your brain.",
    longDescription: "Four ghost friends are lost in the fog. Build pathways from 3D polyomino pieces to guide them home. Place, rotate, and connect modular pathway pieces to navigate each ghost to their exit. What starts simple quickly evolves with obstacles blocking your path, waypoints requiring connections, teleporters that break the space, and multiple ghosts that need to move in unison. Each puzzle introduces something new. No filler, just problems that will challenge how you think about space and connection. 83 hand-crafted puzzles spread across 7 mechanical zones.",
    features: [
      "83 hand-crafted puzzles across 7 mechanical zones",
      "Rotate and place 3D polyomino pathway pieces",
      "Obstacles, waypoints, teleporters, switches, and multi-ghost coordination",
      "No timers. No hints. Just logic.",
      "16 languages supported including Japanese and Korean",
      "Available on Steam (Windows & macOS), iOS, and Android",
    ],
    platforms: {
      steam: {
        url: "https://store.steampowered.com/app/4085150/Pathways__Poltergeists/",
        appId: "4085150",
      },
      ios: {
        url: "https://apps.apple.com/us/app/pathways-poltergeists/id6752310915",
      },
      android: {
        url: "https://play.google.com/store/apps/details?id=com.wgg.PathwaysAndPoltergeists&hl=en_GB",
      },
    },
    trailer: "https://www.youtube.com/watch?v=V5bOVQK9jYY",
    steamAssets: {
      header: "/pp-assets/HeaderCapsule-card.webp",
      screenshots: [
        "/pp-assets/screenshot-1.webp",
        "/pp-assets/screenshot-4.webp",
        "/pp-assets/screenshot-7.webp",
      ],
    },
    pressKit: "https://drive.google.com/drive/folders/1xcCn678Z3cP55w8ZprwVwsJbbOwFWfJq",
    tags: ["Puzzle", "Logic", "Strategy", "Difficult", "Building", "Grid-Based Movement", "Isometric", "Stylized", "Supernatural", "Singleplayer", "Atmospheric"],
    featureHighlights: [
      {
        icon: "building",
        title: "Build",
        description: "Rotate and place 3D polyomino pieces to construct pathways",
      },
      {
        icon: "brain",
        title: "Solve",
        description: "83 hand-crafted puzzles across 7 mechanical zones",
      },
      {
        icon: "ghost",
        title: "Guide",
        description: "Navigate ghosts through teleporters, switches, and waypoints",
      },
    ],
    keyMechanics: {
      core: "Players don't control ghosts directly. Instead they rotate and place polyomino pathway pieces onto a grid to construct routes. Ghosts automatically pathfind along connected tiles once a valid path exists.",
      pieces: "I-pieces (straight corridors), L-pieces (90° turns), T-pieces (3-way junctions), S/Z-pieces (offset connections), O-pieces (2×2 hubs). Players rotate before placing; placed pieces are permanent.",
      progression: "Seven mechanical zones introduce new systems: basic pathing → obstacles → waypoints → teleporters → switches/gates → multi-ghost coordination → combined systems.",
    },
    audience: {
      primary: "Women aged 25–32 (validated through professional playtesting with 100% positive response)",
      positioning: "Cozy discovery, honest difficulty — players drawn in by the aesthetic find themselves deeply engaged by the puzzle design",
    },
    socialProof: {
      steamReviewSummary: "100% Positive Playtester Response",
      pressQuotes: [
        {
          source: "Professional Playtester",
          quote: "No hesitations. I was playing and thinking to myself that I would buy this game.",
        },
        {
          source: "Professional Playtester",
          quote: "Truly a fantastic game!",
        },
        {
          source: "Professional Playtester",
          quote: "The digital art and graphics were stunning!",
        },
        {
          source: "Professional Playtester",
          quote: "Satisfyingly cute!",
        },
        {
          source: "Professional Playtester",
          quote: "Just enough challenge to keep me engaged without being enough to ragequit.",
        }
      ],
      awards: [],
    },
    faq: [
      {
        question: "What is Pathways & Poltergeists?",
        answer: "Pathways & Poltergeists is a spatial puzzle game developed by Wise Goose Games in which players build pathways from 3D polyomino pieces to guide four ghost characters home. Rather than controlling the ghosts directly, players rotate and place modular pathway pieces onto a grid, and the ghosts automatically follow any connected route to their exit. The game features 83 hand-crafted puzzles across 7 mechanical zones, progressively introducing obstacles, waypoints, teleporters, switches, and multi-ghost coordination challenges.",
      },
      {
        question: "How many puzzles are in Pathways & Poltergeists?",
        answer: "Pathways & Poltergeists contains 83 hand-crafted puzzles spread across 7 distinct mechanical zones. Each zone introduces a new gameplay system — beginning with basic pathway construction and progressing through obstacles, waypoints, teleporters, switches and gates, multi-ghost coordination, and finally combined systems that bring all mechanics together. There are no filler puzzles; every level is designed to introduce or challenge a specific spatial concept.",
      },
      {
        question: "What platforms is Pathways & Poltergeists available on?",
        answer: "Pathways & Poltergeists is available on Steam for Windows PC and macOS, on the Apple App Store for iOS devices, and on Google Play for Android devices. The game was released on February 27, 2026. It supports 16 languages including English, Japanese, and Korean.",
      },
      {
        question: "How much does Pathways & Poltergeists cost?",
        answer: "Pathways & Poltergeists is priced at $9.99 USD on Steam, iOS App Store, and Google Play. There are no in-app purchases, no ads, and no additional paid content — the full game is included at the base price.",
      },
      {
        question: "Is Pathways & Poltergeists multiplayer?",
        answer: "No, Pathways & Poltergeists is a single-player game. It has no multiplayer, online, or cooperative modes. The game is designed as a solo puzzle experience focused on spatial reasoning and logical problem solving.",
      },
      {
        question: "Who made Pathways & Poltergeists?",
        answer: "Pathways & Poltergeists was made by Wise Goose Games, a two-person independent game studio based in California, founded in 2025. The studio is committed to creating thoughtfully designed interactive experiences that balance accessible aesthetics with genuine puzzle depth.",
      },
      {
        question: "Is Pathways & Poltergeists suitable for casual players?",
        answer: "Pathways & Poltergeists has a cozy, approachable visual style and is easy to pick up — there are no timers, no penalties, and no hint systems. However, the puzzle design is genuinely challenging and rewards spatial thinking and patience. The game has been described as 'a cozy-looking spatial puzzle game that will absolutely break your brain,' making it a good fit for players who enjoy a calm atmosphere paired with meaningful difficulty.",
      },
    ],
  },
];

// Helper: get only visible games (exclude unannounced)
export function getVisibleGames(): Game[] {
  return games.filter((g) => g.status !== "unannounced");
}

// Helper: get released games
export function getReleasedGames(): Game[] {
  return games.filter((g) => g.status === "released");
}

// Helper: get a game by slug
export function getGameBySlug(slug: string): Game | undefined {
  return games.find((g) => g.id === slug && g.status !== "unannounced");
}
