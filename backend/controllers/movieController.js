const Movie = require('../models/Movie');
const { searchMoviesWithFallback, getMovieDetails } = require('../services/tmdbService');
const { escapeRegex, validateSearch, validatePagination } = require('../utils/inputSanitizer');

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

const getMovies = async (req, res) => {
  try {
    const pagination = validatePagination(req.query.page, req.query.limit, 100);
    if (!pagination.valid) {
      return res.status(400).json({ success: false, message: pagination.error });
    }
    const page = pagination.page;
    const limit = pagination.limit;
    const skip  = (page - 1) * limit;

    const query = {};

    // Genre filter
    if (req.query.genre) {
      const genreValidation = validateSearch(req.query.genre, 50);
      if (!genreValidation.valid) {
        return res.status(400).json({ success: false, message: genreValidation.error });
      }
      query.genres = { $regex: escapeRegex(genreValidation.value), $options: 'i' };
    }

		if (req.query.category === 'tv') {
			query.mediaType = 'tv';
		} else if (req.query.category === 'movie') {
			query.$or = [
				{ mediaType: 'movie' },
				{ mediaType: { $exists: false } },
				{ mediaType: null },
			];
		}

    // Sort mapping
    const sortParam = req.query.sort || 'popularity';
    let sort = {};
	if (sortParam === 'popularity' || !sortParam) sort = { ratingCount: -1, popularity: -1, avgRating: -1 };
    else if (sortParam === 'rating')   sort = { voteAverage: -1 };
    else if (sortParam === 'newest')   sort = { releaseDate: -1 };
    else if (sortParam === 'az')       sort = { title: 1 };
	else                               sort = { ratingCount: -1, popularity: -1, avgRating: -1 };

		const [movies, total] = await Promise.all([
      Movie.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Movie.countDocuments(query),
    ]);

		const items = await Promise.all(
			movies.map(async (movie) => {
				if (movie.poster || movie.posterPath || !movie.tmdbId) {
					return movie;
				}

				try {
					const enriched = await getMovieDetails(movie.tmdbId);
					if (enriched?.poster) {
						return { ...movie, poster: enriched.poster };
					}
				} catch (enrichError) {
					console.error('poster enrich error:', enrichError.message);
				}

				return movie;
			})
		);

    return res.status(200).json({
      success: true,
      data: {
				items,
        totalItems:  total,
        totalPages:  Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    console.error('getMovies error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch movies' });
  }
};

const searchMovies = async (req, res) => {
	try {
		const { q } = req.query;

		if (!q) {
			return res.status(400).json({ success: false, message: 'Search query q is required' });
		}

		const qValidation = validateSearch(q, 100);
		if (!qValidation.valid) {
			return res.status(400).json({ success: false, message: qValidation.error });
		}

		const results = await searchMoviesWithFallback(qValidation.value);

		return res.status(200).json({ success: true, data: results });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to search movies' });
	}
};

const getMovieById = async (req, res) => {
	try {
		const movieId = Number(req.params.id);

		if (Number.isNaN(movieId)) {
			return res.status(400).json({ success: false, message: 'Invalid movie id' });
		}

		let movie = await Movie.findOne({ movieId });

		if (movie) {
			if (!movie.enriched && movie.tmdbId) {
				movie = await getMovieDetails(movie.tmdbId);
			}
			return res.status(200).json({ success: true, data: movie });
		}

		// Not in DB — treat the route param as a tmdbId
		movie = await getMovieDetails(movieId);
		if (!movie) {
			return res.status(404).json({ success: false, message: 'Movie not found' });
		}

		return res.status(200).json({ success: true, data: movie });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to fetch movie' });
	}
};

const syncPopularMovies = async (req, res) => {
	try {
		const axios = require('axios');
		const TMDB_API_KEY = process.env.TMDB_API_KEY;
		const TMDB_BASE_URL = process.env.TMDB_BASE_URL;

		let totalSaved = 0;

		// Fetch 5 pages of popular movies from TMDB (100 movies)
		for (let page = 1; page <= 5; page++) {
			const { data } = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
				params: { api_key: TMDB_API_KEY, language: 'en-US', page },
			});

			for (const movie of data.results) {
				await Movie.findOneAndUpdate(
					{ tmdbId: movie.id },
					{
						$set: {
							tmdbId:           movie.id,
							title:            movie.title,
							overview:         movie.overview,
							posterPath:       movie.poster_path
								? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
								: null,
							backdropPath:     movie.backdrop_path
								? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
								: null,
							releaseDate:      movie.release_date,
							voteAverage:      movie.vote_average,
							voteCount:        movie.vote_count,
							ratingCount:      movie.vote_count || 0,
							popularity:       movie.popularity,
							genres:           (movie.genre_ids || []).map((id) => mapTmdbIdToName(id)).filter(Boolean),
							originalLanguage: movie.original_language,
							mediaType:        'movie',
						},
					},
					{ upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
				);
				totalSaved++;
			}
		}

		// Also fetch trending this week
		const { data: trending } = await axios.get(
			`${TMDB_BASE_URL}/trending/movie/week`,
			{ params: { api_key: TMDB_API_KEY } }
		);

		for (const movie of trending.results) {
			await Movie.findOneAndUpdate(
				{ tmdbId: movie.id },
				{
					$set: {
						tmdbId:      movie.id,
						title:       movie.title,
						overview:    movie.overview,
						posterPath:  movie.poster_path
							? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
							: null,
						releaseDate: movie.release_date,
						voteAverage: movie.vote_average,
						voteCount:   movie.vote_count,
						ratingCount: movie.vote_count || 0,
						popularity:  movie.popularity,
						genres:      movie.genre_ids || [],
						mediaType:   'movie',
					},
				},
				{ upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
			);
			totalSaved++;
		}

		res.json({ success: true, message: `Synced ${totalSaved} popular movies from TMDB` });
	} catch (err) {
		console.error('syncPopularMovies error:', err.message);
		res.status(500).json({ success: false, message: err.message });
	}
};

const syncPopularTV = async (req, res) => {
	try {
		const axios = require('axios');
		const TMDB_API_KEY = process.env.TMDB_API_KEY;
		const TMDB_BASE_URL = process.env.TMDB_BASE_URL;

		let totalSaved = 0;

		for (let page = 1; page <= 5; page++) {
			const { data } = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
				params: { api_key: TMDB_API_KEY, language: 'en-US', page },
			});

			for (const show of data.results) {
				await Movie.findOneAndUpdate(
					{ tmdbId: show.id },
					{
						$set: {
							tmdbId:           show.id,
							title:            show.name,
							overview:         show.overview,
							posterPath:       show.poster_path
								? `https://image.tmdb.org/t/p/w500${show.poster_path}`
								: null,
							backdropPath:     show.backdrop_path
								? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
								: null,
							releaseDate:      show.first_air_date,
							voteAverage:      show.vote_average,
							voteCount:        show.vote_count,
							ratingCount:      show.vote_count || 0,
							popularity:       show.popularity,
							genres:           show.genre_ids || [],
							originalLanguage: show.original_language,
							mediaType:        'tv',
						},
					},
					{ upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
				);
				totalSaved++;
			}
		}

		const { data: trending } = await axios.get(
			`${TMDB_BASE_URL}/trending/tv/week`,
			{ params: { api_key: TMDB_API_KEY } }
		);

		for (const show of trending.results) {
			await Movie.findOneAndUpdate(
				{ tmdbId: show.id },
				{
					$set: {
						tmdbId:      show.id,
						title:       show.name,
						overview:    show.overview,
						posterPath:  show.poster_path
							? `https://image.tmdb.org/t/p/w500${show.poster_path}`
							: null,
						releaseDate: show.first_air_date,
						voteAverage: show.vote_average,
						voteCount:   show.vote_count,
						ratingCount: show.vote_count || 0,
						popularity:  show.popularity,
						genres:      show.genre_ids || [],
						mediaType:   'tv',
					},
				},
				{ upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
			);
			totalSaved++;
		}

		res.json({ success: true, message: `Synced ${totalSaved} popular TV shows from TMDB` });
	} catch (err) {
		console.error('syncPopularTV error:', err.message);
		res.status(500).json({ success: false, message: err.message });
	}
};

module.exports = {
	getMovies,
	searchMovies,
	getMovieById,
	syncPopularMovies,
	syncPopularTV,
};
