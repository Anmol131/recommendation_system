const express = require('express');
const { getGames, searchGames, getGameById } = require('../controllers/gameController');

const router = express.Router();

router.get('/', getGames);
router.get('/search', searchGames);
router.get('/:gameId', getGameById);

module.exports = router;
