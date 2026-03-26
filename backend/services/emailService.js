const nodemailer = require('nodemailer');

// NEW: OTP FEATURE
const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

// NEW: OTP FEATURE
const sendOTPEmail = async (toEmail, otp) => {
	const mailOptions = {
		from: `"Recommendation Platform" <${process.env.EMAIL_USER}>`,
		to: toEmail,
		subject: 'Verify your email - OTP Code',
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
				<h2 style="color: #111827;">Email Verification</h2>
				<p>Welcome to Recommendation Platform. Use the OTP below to verify your email address:</p>
				<div style="margin: 20px 0; padding: 16px; text-align: center; background: #f3f4f6; border-radius: 8px;">
					<span style="font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #111827;">${otp}</span>
				</div>
				<p>This OTP expires in <strong>10 minutes</strong>.</p>
				<p style="margin-top: 24px; font-size: 12px; color: #6b7280;">If you did not request this, you can safely ignore this email.</p>
			</div>
		`,
	};

	await transporter.sendMail(mailOptions);
};

module.exports = {
	sendOTPEmail,
};