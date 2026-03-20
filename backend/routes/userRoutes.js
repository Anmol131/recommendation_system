const express = require('express');
const {
  getProfile,
  updatePreferences,
  updateAvatar,
  addHistory,
  getHistory,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/preferences', updatePreferences);
router.put('/avatar', protect, updateAvatar);
router.post('/history', addHistory);
router.get('/history', getHistory);

module.exports = router;
