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
}

export const games: Game[] = [
  {
    id: "pathways-poltergeists",
    title: "Pathways & Poltergeists",
    status: "released",
    releaseDate: "February 27, 2026",
    price: "$9.99 USD",
    genre: "Spatial Puzzle",
    tagline: "Looks Cozy. Plays Hard.",
    shortDescription: "Guide ghost friends home by building pathways from polyomino pieces. A cozy-looking spatial puzzle game that will absolutely break your brain.",
    longDescription: "Four ghost friends are lost in the fog. Build pathways from 3D polyomino pieces to guide them home. Place, rotate, and connect modular pathway pieces to navigate each ghost to their exit. What starts simple quickly evolves with obstacles blocking your path, waypoints requiring connections, teleporters that break the space, and multiple ghosts that need to move in unison. Each puzzle introduces something new. No filler, just problems that will challenge how you think about space and connection. 83 hand-crafted puzzles spread across 7 mechanical zones.",
    features: [
      "83 hand-crafted puzzles across 7 mechanical zones",
      "Rotate and place 3D polyomino pathway pieces",
      "Obstacles, waypoints, teleporters, switches, and multi-ghost coordination",
      "No timers. No hints. Just logic.",
      "16 languages supported including Japanese and Korean",
      "Available on Steam (Windows & macOS) and iOS",
    ],
    platforms: {
      steam: {
        url: "https://store.steampowered.com/app/4085150/Pathways__Poltergeists/",
        appId: "4085150",
      },
      ios: {
        url: "https://apps.apple.com/us/app/pathways-poltergeists/id6752310915",
      },
    },
    trailer: "https://www.youtube.com/watch?v=V5bOVQK9jYY",
    steamAssets: {
      header: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/4085150/35be42a71be64497d146ec2414d59b9fbda3e327/header.jpg",
      screenshots: [
        "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/4085150/17ec48cf7992c758ecaffe19d802a1ff95f6acdd/ss_17ec48cf7992c758ecaffe19d802a1ff95f6acdd.1920x1080.jpg",
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
