const Movie = require('../models/Movie');
const { searchMoviesWithFallback, getMovieDetails } = require('../services/tmdbService');

const getMovies = async (req, res) => {
	try {
		const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
		const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);

		const query = {};

		if (req.query.genre) {
			query.genres = req.query.genre;
		}

		if (req.query.year) {
			query.year = Number(req.query.year);
		}

		const sortBy = req.query.sortBy === 'year' ? 'year' : 'avgRating';
		const sort = { [sortBy]: -1 };

		const totalItems = await Movie.countDocuments(query);
		const totalPages = Math.ceil(totalItems / limit) || 1;

		const movies = await Movie.find(query)
			.sort(sort)
			.skip((page - 1) * limit)
			.limit(limit);

		return res.status(200).json({
			success: true,
			data: {
				items: movies,
				totalPages,
				currentPage: page,
				totalItems,
			},
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to fetch movies' });
	}
};

const searchMovies = async (req, res) => {
	try {
		const { q } = req.query;

		if (!q) {
			return res.status(400).json({ success: false, message: 'Search query q is required' });
		}

		const results = await searchMoviesWithFallback(q);

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

module.exports = {
	getMovies,
	searchMovies,
	getMovieById,
};
