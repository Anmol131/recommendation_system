const Game = require('../models/Game');
const { escapeRegex, validateSearch, validatePagination } = require('../utils/inputSanitizer');

const getGames = async (req, res) => {
	try {
const pagination = validatePagination(req.query.page, req.query.limit, 100);
	if (!pagination.valid) {
		return res.status(400).json({ success: false, message: pagination.error });
	}
	const page = pagination.page;
	const limit = pagination.limit;

	const query = {};

	if (req.query.platform) {
		const platformValidation = validateSearch(req.query.platform, 50);
		if (!platformValidation.valid) {
			return res.status(400).json({ success: false, message: platformValidation.error });
		}
		query.platform = { $regex: escapeRegex(platformValidation.value), $options: 'i' };
	}

	if (req.query.genre) {
		const genreValidation = validateSearch(req.query.genre, 50);
		if (!genreValidation.valid) {
			return res.status(400).json({ success: false, message: genreValidation.error });
		}
		query.genres = genreValidation.value;
		}

		// Sorting
		const sortParam = req.query.sort || 'popular';
		let sort = {};
		if (sortParam === 'popularity' || sortParam === 'popular') {
			sort = { rating: -1 };
		} else if (sortParam === 'rating') {
			sort = { rating: -1 };
		} else if (sortParam === 'newest') {
			sort = { releaseDate: -1 };
		} else if (sortParam === 'az') {
			sort = { title: 1 };
		} else {
			sort = { rating: -1 };
		}

		const totalItems = await Game.countDocuments(query);
		const totalPages = Math.ceil(totalItems / limit) || 1;

		const games = await Game.find(query)
			.sort(sort)
			.skip((page - 1) * limit)
			.limit(limit);

		return res.status(200).json({
			success: true,
			data: {
				items: games,
				totalPages,
				currentPage: page,
				totalItems,
			},
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to fetch games' });
	}
};

const searchGames = async (req, res) => {
	try {
		const { q, platform } = req.query;

		if (!q) {
			return res.status(400).json({ success: false, message: 'Search query q is required' });
		}

		const qValidation = validateSearch(q, 100);
		if (!qValidation.valid) {
			return res.status(400).json({ success: false, message: qValidation.error });
		}

		const query = {
			$text: {
				$search: qValidation.value,
			},
		};

		if (platform) {
			const platformValidation = validateSearch(platform, 50);
			if (!platformValidation.valid) {
				return res.status(400).json({ success: false, message: platformValidation.error });
			}
			query.platform = platformValidation.value;
		}

		const games = await Game.find(query, { score: { $meta: 'textScore' } })
			.sort({ score: { $meta: 'textScore' } })
			.limit(20);

		return res.status(200).json({ success: true, data: games });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to search games' });
	}
};

const getGameById = async (req, res) => {
	try {
		const { gameId } = req.params;
		const game = await Game.findOne({ gameId });

		if (!game) {
			return res.status(404).json({ success: false, message: 'Game not found' });
		}

		return res.status(200).json({ success: true, data: game });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to fetch game' });
	}
};

module.exports = {
	getGames,
	searchGames,
	getGameById,
};
