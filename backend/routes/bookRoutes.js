const express = require('express');
const { getBooks, searchBooks, getBookByIsbn } = require('../controllers/bookController');

const router = express.Router();

router.get('/', getBooks);
router.get('/search', searchBooks);
router.get('/:isbn', getBookByIsbn);

module.exports = router;
