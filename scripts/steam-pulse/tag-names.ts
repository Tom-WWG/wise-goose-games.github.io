/**
 * Genre tag names — used to split results into "Genres" vs "Tags" sections.
 * Identified by display name rather than numeric tag IDs, since the CloudFront
 * data ships tag_name directly. Add names here as new top-level genre
 * categories appear in reports.
 */
export const GENRE_TAG_NAMES = new Set([
  'Action',
  'Adventure',
  'Casual',
  'Horror',
  'Strategy',
  'RPG',
  'Simulation',
  'Roguelike',
  'Roguelite',
  'Visual Novel',
  'Sports',
  'Racing',
  'Fighting',
  'Puzzle',
  'Platformer',
  'Shooter',
  'Survival',
  'Sandbox',
  'Anime',
  'Indie',
]);

/** Returns true if the given tag name is a top-level genre classification */
export function isGenreTag(tagName: string): boolean {
  return GENRE_TAG_NAMES.has(tagName);
}
