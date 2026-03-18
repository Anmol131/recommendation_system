const express = require('express');
const { getMovies, searchMovies, getMovieById, syncPopularMovies, syncPopularTV } = require('../controllers/movieController');

const router = express.Router();

router.get('/', getMovies);
router.get('/search', searchMovies);
router.post('/sync-popular', syncPopularMovies);
router.post('/sync-tv', syncPopularTV);
router.get('/:id', getMovieById);

module.exports = router;
