const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Book = require('../models/Book');
const Music = require('../models/Music');
const Game = require('../models/Game');

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200';

const MODEL_MAP = {
  movie: Movie,
  book: Book,
  music: Music,
  game: Game,
};

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const toArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean);
  if (value) return [value];
  return [];
};

const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const extractYear = (value) => {
  if (!value) return null;
  const match = String(value).match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
};

const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return null;
  const total = Number(seconds);
  if (!Number.isFinite(total) || total <= 0) return null;
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  return `${minutes}m ${remaining.toString().padStart(2, '0')}s`;
};

const resolveImage = (doc, type) => {
  if (type === 'movie') return firstValue(doc.poster, doc.imageUrl, doc.backdropPath, doc.posterPath, doc.image, FALLBACK_IMAGE);
  if (type === 'book') return firstValue(doc.cover, doc.imageUrl, doc.poster, FALLBACK_IMAGE);
  if (type === 'music') return firstValue(doc.cover, doc.albumArt, doc.imageUrl, FALLBACK_IMAGE);
  return firstValue(doc.image, doc.poster, doc.imageUrl, FALLBACK_IMAGE);
};

const normalizeMovie = (movie) => ({
  _id: movie._id,
  type: 'movie',
  title: movie.title || 'Untitled',
  imageUrl: resolveImage(movie, 'movie'),
  poster: resolveImage(movie, 'movie'),
  rating: firstValue(movie.avgRating, movie.rating, movie.voteAverage),
  year: firstValue(movie.year, extractYear(movie.releaseDate), extractYear(movie.createdAt)),
  genre: toArray(movie.genres)[0] || movie.genre || null,
  genres: toArray(movie.genres),
  language: movie.language || movie.originalLanguage || null,
  description: movie.description || movie.overview || null,
  director: movie.director || null,
  cast: toArray(movie.cast),
  runtime: firstValue(movie.runtime, movie.duration, null),
  author: null,
  publisher: null,
  pages: null,
  artist: null,
  album: null,
  duration: null,
  developer: null,
  platform: null,
  releaseDate: movie.releaseDate || null,
  trailer: movie.trailer || null,
  previewLink: movie.previewLink || null,
  originalData: movie,
});

const normalizeBook = (book) => ({
  _id: book._id,
  type: 'book',
  title: book.title || 'Untitled',
  imageUrl: resolveImage(book, 'book'),
  poster: resolveImage(book, 'book'),
  rating: firstValue(book.avgRating, book.rating),
  year: firstValue(book.year, extractYear(book.publishedDate), extractYear(book.createdAt)),
  genre: toArray(book.categories)[0] || book.genre || null,
  genres: toArray(book.categories),
  language: book.lang || null,
  description: book.description || null,
  director: null,
  cast: [],
  runtime: null,
  author: book.author || null,
  publisher: book.publisher || null,
  pages: firstValue(book.pageCount, null),
  artist: null,
  album: null,
  duration: null,
  developer: null,
  platform: null,
  releaseDate: book.year ? String(book.year) : null,
  trailer: null,
  previewLink: book.previewLink || null,
  originalData: book,
});

const normalizeMusic = (music) => ({
  _id: music._id,
  type: 'music',
  title: music.title || 'Untitled',
  imageUrl: resolveImage(music, 'music'),
  poster: resolveImage(music, 'music'),
  rating: firstValue(music.avgRating, music.popularity, music.rating),
  year: firstValue(extractYear(music.releaseDate), extractYear(music.createdAt)),
  genre: toArray(music.genres)[0] || music.genre || null,
  genres: toArray(firstValue(music.genres, music.genre)),
  language: music.language || null,
  description: music.description || null,
  director: null,
  cast: [],
  runtime: null,
  author: null,
  publisher: null,
  pages: null,
  artist: music.artist || null,
  album: music.album || null,
  duration: formatDuration(music.durationSec),
  developer: null,
  platform: null,
  releaseDate: music.releaseDate || null,
  trailer: null,
  previewLink: music.previewUrl || music.spotifyUrl || null,
  originalData: music,
});

const normalizeGame = (game) => ({
  _id: game._id,
  type: 'game',
  title: game.title || 'Untitled',
  imageUrl: resolveImage(game, 'game'),
  poster: resolveImage(game, 'game'),
  rating: firstValue(game.rating, game.avgRating),
  year: firstValue(game.releaseYear, extractYear(game.createdAt)),
  genre: toArray(game.genres)[0] || game.genre || null,
  genres: toArray(game.genres),
  language: game.language || null,
  description: game.description || null,
  director: null,
  cast: [],
  runtime: null,
  author: null,
  publisher: null,
  pages: null,
  artist: null,
  album: null,
  duration: null,
  developer: game.developer || null,
  platform: game.platform || game.pcPlatform || null,
  releaseDate: game.releaseYear ? String(game.releaseYear) : null,
  trailer: null,
  previewLink: game.previewLink || game.url || null,
  originalData: game,
});

const normalizeContent = (type, doc) => {
  if (!doc) return null;
  if (type === 'movie') return normalizeMovie(doc);
  if (type === 'book') return normalizeBook(doc);
  if (type === 'music') return normalizeMusic(doc);
  if (type === 'game') return normalizeGame(doc);
  return null;
};

const getModel = (type) => MODEL_MAP[type];

const resolveContentDoc = async (type, id) => {
  const model = getModel(type);
  if (!model) return null;

  const queries = [];

  if (isObjectId(id)) {
    queries.push({ _id: id });
  }

  if (type === 'movie') {
    const numericId = Number(id);
    if (!Number.isNaN(numericId)) {
      queries.push({ movieId: numericId });
      queries.push({ tmdbId: numericId });
      queries.push({ imdbId: numericId });
    }
  } else if (type === 'book') {
    queries.push({ isbn: String(id) });
  } else if (type === 'music') {
    queries.push({ trackId: String(id) });
    queries.push({ lastfmId: String(id) });
  } else if (type === 'game') {
    queries.push({ gameId: String(id) });
  }

  for (const query of queries) {
    const doc = await model.findOne(query).lean();
    if (doc) return doc;
  }

  return null;
};

const scoreSimilarItem = (type, source, candidate) => {
  let score = 0;

  const sourceGenres = toArray(source.genres || source.categories || source.genre);
  const candidateGenres = toArray(candidate.genres || candidate.categories || candidate.genre);
  const sharedGenres = candidateGenres.filter((genre) => sourceGenres.includes(genre));

  score += sharedGenres.length * 3;

  if (type === 'movie' && source.director && candidate.director && source.director === candidate.director) score += 4;
  if (type === 'book' && source.author && candidate.author && source.author === candidate.author) score += 4;
  if (type === 'music' && source.artist && candidate.artist && source.artist === candidate.artist) score += 4;
  if (type === 'game' && source.platform && candidate.platform && source.platform === candidate.platform) score += 2;

  if (candidate.year && source.year) {
    score += Math.max(0, 2 - Math.min(2, Math.abs(Number(candidate.year) - Number(source.year)) / 10));
  }

  return score;
};

const getSimilarContent = async (req, res) => {
  try {
    const { type, id } = req.params;
    const model = getModel(type);

    if (!model) {
      return res.status(400).json({ success: false, message: 'Invalid content type' });
    }

    const sourceDoc = await resolveContentDoc(type, id);
    if (!sourceDoc) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    const candidates = await model.find({ _id: { $ne: sourceDoc._id } }).sort({ createdAt: -1 }).limit(24).lean();
    const ranked = candidates
      .map((candidate) => ({
        ...normalizeContent(type, candidate),
        _score: scoreSimilarItem(type, sourceDoc, candidate),
      }))
      .sort((left, right) => right._score - left._score)
      .slice(0, 4)
      .map(({ _score, ...item }) => item);

    return res.status(200).json({ success: true, data: ranked });
  } catch (error) {
    console.error('getSimilarContent error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch similar content' });
  }
};

const getContentByType = async (req, res) => {
  try {
    const { type, id } = req.params;
    const model = getModel(type);

    if (!model) {
      return res.status(400).json({ success: false, message: 'Invalid content type' });
    }

    const doc = await resolveContentDoc(type, id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    return res.status(200).json({ success: true, data: normalizeContent(type, doc) });
  } catch (error) {
    console.error('getContentByType error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch content details' });
  }
};

module.exports = {
  getContentByType,
  getSimilarContent,
  normalizeContent,
};