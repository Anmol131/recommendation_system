const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRE,
	});
};

const sanitizeUser = (userDoc) => {
	const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
	delete user.password;
	return user;
};

const register = async (req, res) => {
	try {
		const { name, email, password } = req.body;

		if (!name || !email || !password) {
			return res.status(400).json({ success: false, message: 'Name, email and password are required' });
		}

		const existingUser = await User.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			return res.status(400).json({ success: false, message: 'Email already registered' });
		}

		const user = await User.create({ name, email, password });
		const token = generateToken(user._id);

		return res.status(201).json({
			success: true,
			data: {
				token,
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

		const user = await User.findOne({ email: email.toLowerCase() });
		if (!user) {
			return res.status(401).json({ success: false, message: 'Invalid credentials' });
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

module.exports = {
	register,
	login,
	getMe,
};
