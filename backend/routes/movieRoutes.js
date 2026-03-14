const express = require('express');
const { getMovies, searchMovies, getMovieById } = require('../controllers/movieController');

const router = express.Router();

router.get('/', getMovies);
router.get('/search', searchMovies);
router.get('/:id', getMovieById);

module.exports = router;
