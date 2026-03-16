const express = require('express');
const { getMusic, searchMusic, getMusicByTrackId, getSimilarTracks } = require('../controllers/musicController');

const router = express.Router();

router.get('/', getMusic);
router.get('/search', searchMusic);
router.get('/:trackId', getMusicByTrackId);
router.get('/:trackId/similar', getSimilarTracks);

module.exports = router;
