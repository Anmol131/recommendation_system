import { useMemo, useState } from 'react';
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as endpoints from '../api/endpoints';
import { useToast } from '../context/ToastContext';

const STRENGTH_META = {
  1: { label: 'Weak', color: 'bg-red-500' },
  2: { label: 'Moderate', color: 'bg-amber-500' },
  3: { label: 'Strong', color: 'bg-primary' },
  4: { label: 'Very Strong', color: 'bg-green-500' },
};

function getStrengthLevel(password) {
  const checks = [
    password.length >= 8,
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
    /[A-Z]/.test(password),
  ];

  const score = checks.filter(Boolean).length;
  return Math.max(1, score);
}

function ChangePasswordPage() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [error, setError] = useState('');
  const toastApi = useToast();
  const [submitting, setSubmitting] = useState(false);

  const strengthLevel = useMemo(() => getStrengthLevel(newPassword), [newPassword]);
  const strengthMeta = STRENGTH_META[strengthLevel];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password must match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    const passwordUpdater = endpoints.changePassword || endpoints.updatePassword;

    if (typeof passwordUpdater !== 'function') {
      setError('Password update endpoint is not configured yet.');
      return;
    }

    setSubmitting(true);

    try {
      await passwordUpdater({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toastApi.show({ message: 'Password changed successfully', type: 'success' });
    } catch (err) {
      const serverMessage = err?.response?.data?.message || 'Could not update password. Please try again.';
      if (/current password|invalid credentials|incorrect/i.test(serverMessage)) {
        setError('Current password is incorrect.');
        toastApi.show({ message: 'Current password is incorrect', type: 'error' });
        return;
      }
      setError(serverMessage);
      toastApi.show({ message: serverMessage, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-light-bg dark:bg-dark-bg px-6 pb-20 pt-14 text-light-text dark:text-dark-text md:px-10 lg:px-12 transition-colors duration-300">
      <main className="mx-auto w-full max-w-2xl">
        <section className="mb-10">
          <h1 className="text-5xl font-bold tracking-tight text-light-text dark:text-dark-text md:text-6xl">Security</h1>
          <p className="mt-3 max-w-xl text-base text-light-text-secondary dark:text-dark-text-secondary md:text-lg">
            Update your password to keep your curated collections secure.
          </p>
        </section>

        <section className="relative overflow-hidden rounded-lg border border-light-surface-alt dark:border-dark-surface-alt bg-light-surface dark:bg-dark-surface p-8 shadow-md dark:shadow-2xl">
          <div className="absolute left-0 top-0 h-full w-1 bg-primary" />

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="current-password"
                className="mb-3 ml-1 block text-[0.75rem] font-semibold uppercase tracking-widest text-light-text-secondary/60 dark:text-dark-text-secondary/60"
              >
                Current Password
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-light-surface-alt dark:border-dark-surface-alt bg-light-surface dark:bg-dark-surface px-5 py-4 pr-14 text-light-text dark:text-dark-text placeholder:text-light-text-secondary/40 dark:placeholder:text-dark-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-light-text-secondary/60 dark:text-dark-text-secondary/60 transition-all duration-200 hover:bg-light-surface-alt dark:hover:bg-dark-surface-alt hover:text-primary"
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="mb-3 ml-1 block text-[0.75rem] font-semibold uppercase tracking-widest text-light-text-secondary/60 dark:text-dark-text-secondary/60"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 8 characters"
                  className="w-full rounded-lg border border-light-surface-alt dark:border-dark-surface-alt bg-light-surface dark:bg-dark-surface px-5 py-4 pr-14 text-light-text dark:text-dark-text placeholder:text-light-text-secondary/40 dark:placeholder:text-dark-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-light-text-secondary/60 dark:text-dark-text-secondary/60 transition-all duration-200 hover:bg-light-surface-alt dark:hover:bg-dark-surface-alt hover:text-primary"
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-1.5 px-1">
                {Array.from({ length: 4 }).map((_, index) => {
                  const isFilled = index < strengthLevel;
                  return (
                    <div
                      key={`strength-${index + 1}`}
                      className={`h-1.5 rounded-full ${isFilled ? strengthMeta.color : 'bg-light-surface-alt dark:bg-dark-surface-alt'}`}
                    />
                  );
                })}
              </div>
              <p className="mt-2 px-1 text-xs text-light-text-secondary/60 dark:text-dark-text-secondary/60">
                Strength: {strengthMeta.label}
              </p>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-3 ml-1 block text-[0.75rem] font-semibold uppercase tracking-widest text-light-text-secondary/60 dark:text-dark-text-secondary/60"
              >
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-light-surface-alt dark:border-dark-surface-alt bg-light-surface dark:bg-dark-surface px-5 py-4 text-light-text dark:text-dark-text placeholder:text-light-text-secondary/40 dark:placeholder:text-dark-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-100 dark:bg-red-950/50 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="flex flex-col justify-between gap-4 pt-2 md:flex-row md:items-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-left text-sm font-semibold uppercase tracking-widest text-primary transition-colors duration-200 hover:text-primary-light dark:hover:text-primary-light"
              >
                Forgot Password?
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary hover:shadow-xl px-8 py-4 font-bold text-white shadow-lg transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:shadow-lg"
              >
                {submitting ? 'Updating...' : 'Update Password'}
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </section>

        <section className="mt-10 flex items-start gap-4 rounded-xl bg-light-surface-alt dark:bg-dark-surface-alt p-6 ambient-shadow">
          <ShieldCheck size={20} className="mt-0.5 text-primary" />
          <div>
            <h2 className="text-sm font-bold text-light-text dark:text-dark-text">Two-Factor Authentication</h2>
            <p className="mt-1 text-xs leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
              For extra protection, we recommend enabling 2FA in your account settings after updating your password.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ChangePasswordPage;
