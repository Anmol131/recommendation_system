const express = require('express');
const { register, login, getMe, verifyOTP, resendOTP } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
// NEW: OTP FEATURE
router.post('/verify-otp', verifyOTP);
// NEW: OTP FEATURE
router.post('/resend-otp', resendOTP);
router.get('/me', protect, getMe);

module.exports = router;
