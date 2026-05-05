import { normalizeType } from './typeNormalizer';

const FALLBACK_IMAGES = {
  movie: '/placeholders/movie.png',
  book: '/placeholders/book.png',
  game: '/placeholders/game.png',
  music: '/placeholders/music.png',
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

export const resolveImageUrl = (item, type = 'movie') => {
  const detectedImage = resolveImageField(item);
  if (detectedImage) return detectedImage;

  const normalizedType = normalizeType(type) || 'movie';
  return FALLBACK_IMAGES[normalizedType] || FALLBACK_IMAGES.movie;
};
