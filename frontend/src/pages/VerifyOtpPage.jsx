import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Mail, KeyRound, Loader2 } from 'lucide-react';
import * as endpoints from '../api/endpoints';

function VerifyOtpPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const initialEmail = (location.state && location.state.email) || '';

	const [email, setEmail] = useState(initialEmail);
	const [otp, setOtp] = useState('');
	const [error, setError] = useState('');
	const [message, setMessage] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [resending, setResending] = useState(false);

	const handleVerify = async (event) => {
		event.preventDefault();
		setError('');
		setMessage('');

		if (!email.trim() || !otp.trim()) {
			setError('Email and OTP are required.');
			return;
		}

		setSubmitting(true);
		try {
			await endpoints.verifyOtp({ email: email.trim(), otp: otp.trim() });
			setMessage('Email verified. You can now log in.');
			setTimeout(() => navigate('/login'), 1500);
		} catch (apiError) {
			setError(apiError.response?.data?.message || 'Failed to verify OTP.');
		} finally {
			setSubmitting(false);
		}
	};

	const handleResend = async () => {
		setError('');
		setMessage('');

		if (!email.trim()) {
			setError('Enter your email to resend OTP.');
			return;
		}

		setResending(true);
		try {
			await endpoints.resendOtp({ email: email.trim() });
			setMessage('New OTP sent to your email.');
		} catch (apiError) {
			setError(apiError.response?.data?.message || 'Failed to resend OTP.');
		} finally {
			setResending(false);
		}
	};

	return (
		<div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text flex items-center justify-center px-6 py-20">
			<div className="w-full max-w-md rounded-lg border border-light-surface-alt dark:border-dark-surface-alt bg-light-surface dark:bg-dark-surface p-8 shadow-lg">
				<h1 className="mb-2 text-2xl font-semibold text-center">Verify your email</h1>
				<p className="mb-6 text-sm text-center text-light-text-secondary dark:text-dark-text-secondary">
					We sent a one-time passcode (OTP) to your email. Enter it below to activate your account.
				</p>
				<form className="space-y-5" onSubmit={handleVerify}>
					<div className="space-y-1.5">
						<label className="ml-1 block text-xs font-semibold uppercase tracking-widest text-light-text-secondary/60 dark:text-dark-text-secondary/60" htmlFor="email">
							Email Address
						</label>
						<div className="relative">
							<Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-light-text-secondary/50 dark:text-dark-text-secondary/50" />
							<input
								id="email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder="your@email.com"
								className="w-full rounded-lg border border-light-surface-alt dark:border-dark-surface-alt bg-light-surface dark:bg-dark-surface py-3 pl-11 pr-4 text-sm text-light-text dark:text-dark-text placeholder:text-light-text-secondary/40 dark:placeholder:text-dark-text-secondary/40 outline-none focus:ring-2 focus:ring-primary/30"
							/>
						</div>
					</div>
					<div className="space-y-1.5">
						<label className="ml-1 block text-xs font-semibold uppercase tracking-widest text-light-text-secondary/60 dark:text-dark-text-secondary/60" htmlFor="otp">
							OTP Code
						</label>
						<div className="relative">
							<KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-light-text-secondary/50 dark:text-dark-text-secondary/50" />
							<input
								id="otp"
								type="text"
								value={otp}
								onChange={(event) => setOtp(event.target.value)}
								maxLength={6}
								placeholder="Enter OTP"
								className="w-full rounded-lg border border-light-surface-alt dark:border-dark-surface-alt bg-light-surface dark:bg-dark-surface py-3 pl-11 pr-4 text-sm text-light-text dark:text-dark-text placeholder:text-light-text-secondary/40 dark:placeholder:text-dark-text-secondary/40 outline-none focus:ring-2 focus:ring-primary/30 tracking-[0.3em]"
							/>
						</div>
					</div>
					{error && (
						<p className="rounded-lg bg-red-100 dark:bg-red-950/50 px-3 py-2 text-sm text-red-600 dark:text-red-400" role="alert">
							{error}
						</p>
					)}
					{message && !error && (
						<p className="rounded-lg bg-emerald-100 dark:bg-emerald-950/40 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400" role="status">
							{message}
						</p>
					)}
					<button
						type="submit"
						disabled={submitting}
						className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary py-3 font-semibold text-white shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70"
					>
						{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify OTP'}
					</button>
				</form>
				<button
					type="button"
					onClick={handleResend}
					disabled={resending}
					className="mt-4 w-full text-sm font-medium text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
				>
					{resending ? 'Resending OTP...' : 'Resend OTP'}
				</button>
			</div>
		</div>
	);
}

export default VerifyOtpPage;
