const express = require('express');
const {
  getProfile,
  updatePreferences,
  updateAvatar,
  updateBio,
  addHistory,
  getHistory,
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/preferences', updatePreferences);
router.put('/avatar', protect, updateAvatar);
router.put('/bio', protect, updateBio);
router.post('/history', addHistory);
router.get('/history', getHistory);
router.get('/favorites', (req, res, next) => {
  console.log('GET /favorites route hit, user:', req.user?.id);
  next();
}, getFavorites);
router.post('/favorites', (req, res, next) => {
  console.log('POST /favorites route hit, user:', req.user?.id, 'body:', req.body);
  next();
}, addFavorite);
router.delete('/favorites/:itemType/:itemId', (req, res, next) => {
  console.log('DELETE /favorites route hit, user:', req.user?.id, 'params:', req.params);
  next();
}, removeFavorite);
router.get('/favorites/check/:itemType/:itemId', (req, res, next) => {
  console.log('GET /favorites/check route hit, user:', req.user?.id, 'params:', req.params);
  next();
}, checkFavorite);

module.exports = router;
