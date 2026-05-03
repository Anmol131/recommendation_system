const express = require('express');
const { getContentByType, getSimilarContent } = require('../controllers/contentController');

const router = express.Router();

router.get('/:type/:id/similar', getSimilarContent);
router.get('/:type/:id', getContentByType);

module.exports = router;