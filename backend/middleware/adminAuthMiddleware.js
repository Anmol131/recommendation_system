const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
		}

		const token = authHeader.split(' ')[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		const user = await User.findById(decoded.id).select('-password');

		if (!user) {
			return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
		}

		req.user = user;
		next();
	} catch (error) {
		return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
	}
};

const adminOnly = async (req, res, next) => {
	try {
		if (!req.user) {
			return res.status(401).json({ success: false, message: 'Not authorized, no user' });
		}

		if (req.user.role !== 'admin') {
			return res.status(403).json({ success: false, message: 'Forbidden, admin access required' });
		}

		next();
	} catch (error) {
		return res.status(403).json({ success: false, message: 'Forbidden' });
	}
};

module.exports = { protect, adminOnly };
