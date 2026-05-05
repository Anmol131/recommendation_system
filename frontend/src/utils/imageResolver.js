import { normalizeType } from './typeNormalizer';

const FALLBACK_IMAGES = {
  movie: [
    '/placeholders/movie-1.svg',
    '/placeholders/movie-2.svg',
    '/placeholders/movie-3.svg',
  ],
  book: [
    '/placeholders/book-1.svg',
    '/placeholders/book-2.svg',
    '/placeholders/book-3.svg',
  ],
  game: [
    '/placeholders/game-1.svg',
    '/placeholders/game-2.svg',
    '/placeholders/game-3.svg',
  ],
  music: [
    '/placeholders/music-1.svg',
    '/placeholders/music-2.svg',
    '/placeholders/music-3.svg',
  ],
};

const IMAGE_FIELDS = [
  'imageUrl',
  'image',
  'image_url',
  'thumbnail',
  'thumbnailUrl',
  'thumbnail_url',
  'coverImage',
  'coverUrl',
  'cover_image',
  'cover_url',
  'artworkUrl',
  'artwork_url',
  'albumImage',
  'album_image',
  'poster',
  'posterUrl',
  'poster_url',
  'posterPath',
  'poster_path',
  'backdropPath',
  'backdrop_path',
  'cover_i',
  'cover',
  'background_image',
  'backgroundImage',
  'albumArt',
  'artwork',
];

const resolveImageField = (item) => {
  if (!item || typeof item !== 'object') return '';

  for (const field of IMAGE_FIELDS) {
    const value = item[field];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const hashString = (value) => {
  if (!value || typeof value !== 'string') return 0;
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

export const resolveImageUrl = (item, type = 'movie', fallbackSeed = '') => {
  const detectedImage = resolveImageField(item);
  if (detectedImage) return detectedImage;

  const normalizedType = normalizeType(type) || 'movie';

  const fallbackItems = FALLBACK_IMAGES[normalizedType] || FALLBACK_IMAGES.movie;
  const seed = String(
    fallbackSeed ||
      item?.id ||
      item?._id ||
      item?.trackId ||
      item?.isbn ||
      item?.gameId ||
      item?.tmdbId ||
      item?.title ||
      item?.name ||
      '',
  );
  const index = hashString(seed) % fallbackItems.length;
  return fallbackItems[index];
};
