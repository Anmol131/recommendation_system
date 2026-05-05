const express = require('express');
const {
  getProfile,
  updatePreferences,
  updateAvatar,
  updateBio,
  updateUsername,
  updatePassword,
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
router.put('/profile/bio', protect, updateBio);
router.put('/profile/username', protect, updateUsername);
router.put('/profile/password', protect, updatePassword);
router.post('/history', addHistory);
router.get('/history', getHistory);
router.get('/favorites', getFavorites);
router.post('/favorites', addFavorite);
router.delete('/favorites/:itemType/:itemId', removeFavorite);
router.get('/favorites/check/:itemType/:itemId', checkFavorite);

module.exports = router;
