const Music = require('../models/Music');
const { searchTracksWithFallback, getTrackDetails } = require('../services/spotifyService');

const getMusic = async (req, res) => {
	try {
		const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
		const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);

		const query = {};

		if (req.query.genre) {
			query.genre = req.query.genre;
		}

		const sortBy = req.query.sortBy === 'popularity' ? 'popularity' : 'popularity';
		const sort = { [sortBy]: -1 };

		const totalItems = await Music.countDocuments(query);
		const totalPages = Math.ceil(totalItems / limit) || 1;

		const tracks = await Music.find(query)
			.sort(sort)
			.skip((page - 1) * limit)
			.limit(limit);

		return res.status(200).json({
			success: true,
			data: {
				items: tracks,
				totalPages,
				currentPage: page,
				totalItems,
			},
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to fetch music' });
	}
};

const searchMusic = async (req, res) => {
	try {
		const { q } = req.query;

		if (!q) {
			return res.status(400).json({ success: false, message: 'Search query q is required' });
		}

		const results = await searchTracksWithFallback(q);

		return res.status(200).json({ success: true, data: results });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to search music' });
	}
};

const getMusicByTrackId = async (req, res) => {
	try {
		const { trackId } = req.params;
		let track = await Music.findOne({ trackId });

		if (track) {
			if (!track.enriched) {
				track = await getTrackDetails(trackId);
			}
			return res.status(200).json({ success: true, data: track });
		}

		// Not in DB — fetch from Spotify
		track = await getTrackDetails(trackId);
		if (!track) {
			return res.status(404).json({ success: false, message: 'Music track not found' });
		}

		return res.status(200).json({ success: true, data: track });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to fetch music track' });
	}
};

module.exports = {
	getMusic,
	searchMusic,
	getMusicByTrackId,
};
