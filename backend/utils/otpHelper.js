const crypto = require('crypto');

// NEW: OTP FEATURE
const generateOTP = () => {
	return crypto.randomInt(100000, 1000000).toString();
};

// NEW: OTP FEATURE
const getOTPExpiry = () => {
	return new Date(Date.now() + 10 * 60 * 1000);
};

module.exports = {
	generateOTP,
	getOTPExpiry,
};