const Game = require('../models/Game');

const getGames = async (req, res) => {
	try {
		const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
		const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);

		const query = {};

		if (req.query.platform) {
			query.platform = req.query.platform;
		}

		if (req.query.genre) {
			query.genres = req.query.genre;
		}

		const sortBy = req.query.sortBy === 'rating' ? 'rating' : 'totalReviews';
		const sort = { [sortBy]: -1 };

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

		const query = {
			$text: {
				$search: q,
			},
		};

		if (platform) {
			query.platform = platform;
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
