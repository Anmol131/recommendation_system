const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTPEmail } = require('../services/emailService');
const { generateOTP, getOTPExpiry } = require('../utils/otpHelper');

const generateToken = (id, role = 'user') => {
	return jwt.sign({ id, role }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRE,
	});
};

const sanitizeUser = (userDoc) => {
	const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
	delete user.password;
	return user;
};

const normalizeEmail = (email) => (email || '').toLowerCase();

const register = async (req, res) => {
	try {
		const { name, email, password } = req.body;

		if (!name || !email || !password) {
			return res.status(400).json({ success: false, message: 'Name, email and password are required' });
		}

		const existingUser = await User.findOne({ email: normalizeEmail(email) });
		if (existingUser) {
			return res.status(400).json({ success: false, message: 'Email already registered' });
		}

		// NEW: OTP FEATURE
		const otp = generateOTP();
		const otpExpiry = getOTPExpiry();

		const user = await User.create({
			name,
			email: normalizeEmail(email),
			password,
			isVerified: false,
			otp,
			otpExpiry,
		});

		// NEW: OTP FEATURE
		await sendOTPEmail(user.email, otp);

		return res.status(201).json({
			success: true,
			message: 'OTP sent to your email',
			data: {
				user: sanitizeUser(user),
			},
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to register user' });
	}
};

const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ success: false, message: 'Email and password are required' });
		}

		const user = await User.findOne({ email: normalizeEmail(email) });
		if (!user) {
			return res.status(401).json({ success: false, message: 'Invalid credentials' });
		}

		// NEW: OTP FEATURE
		if (!user.isVerified) {
			return res.status(401).json({ success: false, message: 'Please verify your email before logging in' });
		}

		const isMatch = await user.matchPassword(password);
		if (!isMatch) {
			return res.status(401).json({ success: false, message: 'Invalid credentials' });
		}

		const token = generateToken(user._id);

		return res.status(200).json({
			success: true,
			data: {
				token,
				user: sanitizeUser(user),
			},
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to login user' });
	}
};

const getMe = async (req, res) => {
	try {
		return res.status(200).json({
			success: true,
			data: req.user,
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
	}
};

// NEW: OTP FEATURE
const verifyOTP = async (req, res) => {
	try {
		const { email, otp } = req.body;

		if (!email || !otp) {
			return res.status(400).json({ success: false, message: 'Email and OTP are required' });
		}

		const user = await User.findOne({ email: normalizeEmail(email) });
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		if (user.isVerified) {
			return res.status(400).json({ success: false, message: 'User already verified' });
		}

		if (!user.otp || user.otp !== otp) {
			return res.status(400).json({ success: false, message: 'Invalid OTP' });
		}

		if (!user.otpExpiry || user.otpExpiry < new Date()) {
			return res.status(400).json({ success: false, message: 'OTP expired' });
		}

		user.isVerified = true;
		user.otp = undefined;
		user.otpExpiry = undefined;
		await user.save();

		return res.status(200).json({
			success: true,
			message: 'Email verified. Account created.',
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
	}
};

// NEW: OTP FEATURE
const resendOTP = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({ success: false, message: 'Email is required' });
		}

		const user = await User.findOne({ email: normalizeEmail(email) });
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		if (user.isVerified) {
			return res.status(400).json({ success: false, message: 'User already verified' });
		}

		const otp = generateOTP();
		const otpExpiry = getOTPExpiry();

		user.otp = otp;
		user.otpExpiry = otpExpiry;
		await user.save();

		await sendOTPEmail(user.email, otp);

		return res.status(200).json({
			success: true,
			message: 'New OTP sent',
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to resend OTP' });
	}
};

module.exports = {
	register,
	login,
	getMe,
	verifyOTP,
	resendOTP,
};
