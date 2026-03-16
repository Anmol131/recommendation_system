const Music = require('../models/Music');
const lastfmService = require('../services/lastfmService');

// Spotify is disabled — requires premium subscription, always returns 403
const SPOTIFY_ENABLED = false;

// ─── GET /api/music ───────────────────────────────────────────────────────────
const getMusic = async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page,  10) || 1,  1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);

    const query = {};

    if (req.query.genre) {
      query.genres = { $regex: req.query.genre, $options: 'i' };
    }

    const totalItems = await Music.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const tracks = await Music.find(query)
      .sort({ popularity: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: { items: tracks, totalPages, currentPage: page, totalItems },
    });
  } catch (error) {
    console.error('getMusic error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch music' });
  }
};

// ─── GET /api/music/search?q= ─────────────────────────────────────────────────
const searchMusic = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Search query q is required' });

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 1. Try Last.fm first — fetch live results and upsert to MongoDB
    let lastfmResults = [];
    try {
      const { results } = await lastfmService.searchTracks(q, parseInt(limit));
      lastfmResults = results.filter(Boolean); // remove nulls from skipped tracks
    } catch (err) {
      console.error('Last.fm search failed:', err.message);
    }

    // 2. Always query MongoDB — combines seeded data + newly upserted Last.fm data
    const mongoQuery = {
      $or: [
        { title:  { $regex: q, $options: 'i' } },
        { artist: { $regex: q, $options: 'i' } },
        { album:  { $regex: q, $options: 'i' } },
      ],
    };

    const [tracks, total] = await Promise.all([
      Music.find(mongoQuery)
        .sort({ popularity: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Music.countDocuments(mongoQuery),
    ]);

    // 3. If MongoDB has results use them (includes freshly upserted Last.fm data)
    //    If MongoDB is empty (cold start), fall back to raw Last.fm results
    const results = tracks.length > 0 ? tracks : lastfmResults;

    return res.status(200).json({
      success: true,
      data: {
        items:       results,
        totalItems:  tracks.length > 0 ? total : lastfmResults.length,
        totalPages:  Math.ceil((tracks.length > 0 ? total : lastfmResults.length) / limit),
        currentPage: parseInt(page),
        source:      tracks.length > 0 ? 'mongodb' : 'lastfm',
      },
    });
  } catch (error) {
    console.error('searchMusic error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to search music' });
  }
};

// ─── GET /api/music/:trackId ──────────────────────────────────────────────────
const getMusicByTrackId = async (req, res) => {
  try {
    const { trackId } = req.params;

    // 1. Check MongoDB first (works for both seeded trackId and lastfmId)
    const track = await Music.findOne({
      $or: [{ trackId }, { lastfmId: trackId }],
    }).lean();

    if (track) {
      return res.status(200).json({ success: true, data: track });
    }

    // 2. Try Last.fm by splitting the lastfmId format "trackname-artistname"
    //    or just search for it
    try {
      const { results } = await lastfmService.searchTracks(trackId, 1);
      if (results.length > 0) {
        return res.status(200).json({ success: true, data: results[0] });
      }
    } catch (err) {
      console.error('Last.fm track lookup failed:', err.message);
    }

    return res.status(404).json({ success: false, message: 'Music track not found' });
  } catch (error) {
    console.error('getMusicByTrackId error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch music track' });
  }
};

// ─── GET /api/music/:trackId/similar ─────────────────────────────────────────
const getSimilarTracks = async (req, res) => {
  try {
    const { trackId } = req.params;

    // Find the source track to get artist + title for Last.fm lookup
    const track = await Music.findOne({
      $or: [{ trackId }, { lastfmId: trackId }],
    }).lean();

    if (!track) {
      return res.status(404).json({ success: false, message: 'Track not found' });
    }

    const similar = await lastfmService.getSimilarTracks(track.artist, track.title, 10);

    return res.status(200).json({
      success: true,
      data: similar.filter(Boolean),
    });
  } catch (error) {
    console.error('getSimilarTracks error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch similar tracks' });
  }
};

module.exports = { getMusic, searchMusic, getMusicByTrackId, getSimilarTracks };