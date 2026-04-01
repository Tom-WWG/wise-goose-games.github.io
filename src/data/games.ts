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
  muxPlaybackId: string | null;
  trailerDuration?: string;
  steamAssets: {
    header?: string;
    screenshots?: string[];
    screenshotAlts?: string[];
  };
  pressKit: string | null;
  tags: string[];
  featureHighlights: FeatureHighlight[];
  keyMechanics: {
    core?: string;
    progression?: string;
  };
  requirements?: {
    os: string;
    processor: string;
    memory: string;
    graphics: string;
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
    muxPlaybackId: "XCwylHGwg401azOsZJ8ry6HfdTj500zcAPoHAtsNuYCHM",
    trailerDuration: "PT1M32S",
    steamAssets: {
      header: "/pp-assets/HeaderCapsule-card.webp",
      screenshots: [
        "/pp-assets/screenshot-1.webp",
        "/pp-assets/screenshot-4.webp",
        "/pp-assets/screenshot-7.webp",
      ],
      screenshotAlts: [
        "A quiet outdoor pathway puzzle level featuring four ghost characters standing on polyomino blocks",
        "A late-game complex puzzle layout with teleporters, switches, and intersecting glowing routes",
        "A dimly lit room showing an intricate puzzle structure built from 3D pathway segments"
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
      progression: "Seven mechanical zones introduce new systems: basic pathing → obstacles → waypoints → teleporters → switches/gates → multi-ghost coordination → combined systems.",
    },
    requirements: {
      os: "Windows 10 64-bit / macOS 11.0+",
      processor: "Dual-core processor, 2.0 GHz",
      memory: "4 GB RAM",
      graphics: "Dedicated graphics card with 1 GB VRAM or integrated graphics with equivalent performance",
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
        answer: "Pathways & Poltergeists is a spatial puzzle game by Wise Goose Games where players build pathways from 3D polyomino pieces to guide four ghost friends home. You don't control the ghosts directly. Instead, you rotate and place modular pathway pieces onto a grid, and the ghosts automatically follow any valid connected route to their exit. The game features 83 hand-crafted puzzles across 7 mechanical zones, progressively introducing obstacles, waypoints, teleporters, switches, and multi-ghost coordination challenges.",
      },
      {
        question: "How many puzzles does Pathways & Poltergeists have?",
        answer: "Pathways & Poltergeists has 83 hand-crafted puzzles spread across 7 distinct mechanical zones. Each zone introduces a new gameplay system beginning with basic pathway construction and progressing through obstacles, waypoints, teleporters, switches and gates, multi-ghost coordination, and finally combined systems that bring all mechanics together. There are no filler puzzles; every level is designed around a specific spatial concept.",
      },
      {
        question: "What platforms is Pathways & Poltergeists available on?",
        answer: "Pathways & Poltergeists is available on Steam for Windows PC and macOS, on the Apple App Store for iPhone and iPad, and on Google Play for Android. All versions were released on February 27, 2026 and support 16 languages including English, Japanese, Korean, and more.",
      },
      {
        question: "How much does Pathways & Poltergeists cost?",
        answer: "Pathways & Poltergeists is $9.99 USD on Steam, the iOS App Store, and Google Play. It is a one-time purchase — there are no ads, no in-app purchases, no subscriptions, and no additional paid content. The full game is included at the base price across all platforms.",
      },
      {
        question: "Does Pathways & Poltergeists have ads or in-app purchases?",
        answer: "No. Pathways & Poltergeists has no ads and no in-app purchases on any platform. It is a premium one-time purchase at $9.99 USD. You get the complete game, all 83 puzzles, with no additional costs, no paywalls, and no interruptions.",
      },
      {
        question: "Does Pathways & Poltergeists work offline?",
        answer: "Yes. Pathways & Poltergeists works completely offline on all platforms, Steam (Windows and macOS), iOS, and Android. No internet connection is required to play. It is well suited for travel, commutes, or anywhere you don't have reliable connectivity.",
      },
      {
        question: "Is Pathways & Poltergeists multiplayer?",
        answer: "No, Pathways & Poltergeists is single-player only. It has no multiplayer, co-op, or online features of any kind. The game is designed as a solo puzzle experience focused on spatial reasoning and logical problem solving at your own pace.",
      },
      {
        question: "Does Pathways & Poltergeists have hints or a hint system?",
        answer: "No. Pathways & Poltergeists has no hint system, no timers, and no penalties for taking your time or trying different approaches. Every puzzle is solvable through logic alone. The philosophy is to let players think as long as they need — the satisfaction comes from solving puzzles on your own terms.",
      },
      {
        question: "How long does it take to beat Pathways & Poltergeists?",
        answer: "Completion time varies depending on puzzle experience, but most players can expect 12 to 20+ hours to complete all 83 puzzles. The later mechanical zones, particularly multi-ghost coordination and combined systems, are significantly more demanding and may take considerably longer for players who prefer to work through puzzles without external help.",
      },
      {
        question: "Is Pathways & Poltergeists good for casual players?",
        answer: "Pathways & Poltergeists has a cozy, approachable visual style and is easy to pick up. There are no timers, no penalties, and no pressure. However, the puzzle design is genuinely challenging and gets harder as you progress. It is a good fit for players who enjoy a calm atmosphere paired with real difficulty, but players looking for a completely relaxing, low-challenge experience may find the later zones frustrating.",
      },
      {
        question: "What is a spatial puzzle game?",
        answer: "A spatial puzzle game is one where the core challenge involves reasoning about space, shape, and physical relationships rather than language, math, or pattern recognition. Players must mentally rotate, fit, and connect objects in two or three dimensions. Pathways & Poltergeists is a spatial puzzle game: players arrange 3D polyomino pieces on a grid to form connected pathways, requiring them to think about how shapes interlock and how routes flow across the board.",
      },
      {
        question: "What is a polyomino?",
        answer: "A polyomino is a flat shape made by connecting unit squares edge-to-edge. Dominoes (2 squares), trominoes (3 squares), tetrominoes (4 squares, as in Tetris), and pentominoes (5 squares) are all polyomino types. In Pathways & Poltergeists, polyomino pieces are rendered in 3D and function as modular pathway segments — I-pieces form straight corridors, L-pieces form 90-degree turns, T-pieces form three-way junctions, and so on. Players rotate and place them to construct routes for ghosts to follow.",
      },
      {
        question: "What languages does Pathways & Poltergeists support?",
        answer: "Pathways & Poltergeists supports 16 languages: English, French, German, Spanish, Portuguese, Italian, Dutch, Polish, Russian, Simplified Chinese, Traditional Chinese, Japanese, Korean, Turkish, Arabic, and Thai.",
      },
      {
        question: "Who made Pathways & Poltergeists?",
        answer: "Pathways & Poltergeists was made by Wise Goose Games, a two-person independent game studio, founded in 2025. The studio focuses on thoughtfully designed puzzle experiences that balance accessible aesthetics with genuine mechanical depth.",
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
