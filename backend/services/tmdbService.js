const axios = require('axios');
const Movie = require('../models/Movie');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

const TMDB_MOVIE_GENRES = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const mapTmdbIdToName = (id) => TMDB_MOVIE_GENRES[Number(id)] || null;

async function searchMovies(query) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
        language: 'en-US',
        page: 1,
      },
    });

    const results = response.data.results || [];

    const mapped = results.map((r) => ({
      movieId: r.id,
      title: r.title,
      year: r.release_date ? parseInt(r.release_date.slice(0, 4), 10) : null,
      genres: (r.genre_ids || []).map((id) => mapTmdbIdToName(id)).filter(Boolean),
      avgRating: r.vote_average,
      ratingCount: r.vote_count,
      tmdbId: r.id,
      poster: r.poster_path ? `${POSTER_BASE}${r.poster_path}` : null,
      description: r.overview || null,
      enriched: true,
    }));

 await Promise.all(
  mapped.map((movie) => {
    const { movieId, ...rest } = movie;
    return Movie.findOneAndUpdate(
      { tmdbId: movie.tmdbId },
      { 
        $set: rest,
        $setOnInsert: { movieId }
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  })
);

    return mapped;
  } catch (err) {
    console.error('tmdbService.searchMovies error:', err.message);
    throw err;
  }
}

async function getMovieDetails(tmdbId) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        append_to_response: 'credits,videos',
      },
    });

    const data = response.data;

    const trailerObj = (data.videos?.results || []).find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube'
    );

    const update = {
      title: data.title,
      year: data.release_date ? parseInt(data.release_date.slice(0, 4), 10) : null,
      genres: (data.genres || []).map((g) => g.name),
      poster: data.poster_path ? `${POSTER_BASE}${data.poster_path}` : null,
      description: data.overview || null,
      cast: (data.credits?.cast || []).slice(0, 5).map((c) => c.name),
      trailer: trailerObj ? `https://www.youtube.com/watch?v=${trailerObj.key}` : null,
      avgRating: data.vote_average,
      ratingCount: data.vote_count,
      enriched: true,
    };

    const movie = await Movie.findOneAndUpdate(
      { tmdbId },
      { $set: update },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    return movie;
  } catch (err) {
    console.error('tmdbService.getMovieDetails error:', err.message);
    throw err;
  }
}

async function searchMoviesWithFallback(query) {
  try {
    const results = await searchMovies(query);
    if (results && results.length > 0) return results;
    throw new Error('Empty results from TMDB');
  } catch (err) {
    console.error('TMDB searchMovies failed, falling back to MongoDB:', err.message);
    const fallback = await Movie.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
    return fallback;
  }
}

module.exports = { searchMovies, getMovieDetails, searchMoviesWithFallback };
