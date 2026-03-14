const express = require('express');
const { getMusic, searchMusic, getMusicByTrackId } = require('../controllers/musicController');

const router = express.Router();

router.get('/', getMusic);
router.get('/search', searchMusic);
router.get('/:trackId', getMusicByTrackId);

module.exports = router;
