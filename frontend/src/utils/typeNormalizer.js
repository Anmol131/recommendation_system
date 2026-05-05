/**
 * Normalize content type values between frontend UI (plural) and backend (singular)
 * Frontend uses: "all", "movies", "books", "music", "games"
 * Backend uses: "", "movie", "book", "music", "game"
 */

export const normalizeType = (type) => {
  if (!type) return '';

  const normalized = String(type).toLowerCase().trim();

  // Handle "all" or empty
  if (normalized === 'all' || normalized === '') return '';

  // Map plurals to singular
  if (normalized === 'movies') return 'movie';
  if (normalized === 'books') return 'book';
  if (normalized === 'musics') return 'music';
  if (normalized === 'games') return 'game';

  // Already singular
  if (normalized === 'movie') return 'movie';
  if (normalized === 'book') return 'book';
  if (normalized === 'music') return 'music';
  if (normalized === 'game') return 'game';

  // Unknown type, return empty
  return '';
};

/**
 * Normalize type for UI display (plural forms)
 */
export const normalizeTypeForUI = (value) => {
  if (!value || value === '') return 'all';
  const normalized = String(value).toLowerCase().trim();
  if (normalized === 'all') return 'all';
  if (normalized === 'movie' || normalized === 'movies') return 'movies';
  if (normalized === 'book' || normalized === 'books') return 'books';
  if (normalized === 'music' || normalized === 'musics') return 'music';
  if (normalized === 'game' || normalized === 'games') return 'games';
  return 'all';
};

/**
 * Normalize type for API calls (singular forms)
 */
export const normalizeTypeForAPI = (value) => {
  if (value === 'all') return '';
  if (value === 'movies') return 'movie';
  if (value === 'books') return 'book';
  if (value === 'music') return 'music';
  if (value === 'games') return 'game';
  return '';
};

/**
 * Convert singular type to plural label for UI
 */
export const typeToPluralLabel = (type) => {
  const singular = normalizeType(type);

  if (singular === 'movie') return 'movies';
  if (singular === 'book') return 'books';
  if (singular === 'music') return 'music';
  if (singular === 'game') return 'games';

  return 'all';
};

/**
 * Convert singular type to display label
 */
export const typeToLabel = (type) => {
  const singular = normalizeType(type);

  if (singular === 'movie') return 'Movie';
  if (singular === 'book') return 'Book';
  if (singular === 'music') return 'Music';
  if (singular === 'game') return 'Game';

  return 'Unknown';
};

