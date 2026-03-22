import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Diamond,
  Loader2,
  Lock,
  Mail,
  Palette,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import * as endpoints from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!terms) {
      setError('You must accept the terms to continue.');
      return;
    }

    setSubmitting(true);

    try {
      const authPayload = await endpoints.register({ name: name.trim(), email: email.trim(), password });
      await login(authPayload);
      navigate('/');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="relative w-full max-w-[480px]">
          <div className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-secondary-container/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-primary-container/20 blur-3xl" />

          <div className="relative rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)] md:p-12">
            <header className="mb-10 text-center">
              <h1 className="mb-2 text-2xl font-bold tracking-tighter text-primary">Vibeify</h1>
              <h2 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-on-surface">Join the Curated World.</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Start your journey as a digital curator today.</p>
            </header>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="ml-1 block text-xs font-semibold uppercase tracking-widest text-on-surface-variant" htmlFor="name">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Alex Rivers"
                      className="w-full rounded-lg bg-surface-container-high py-3 pl-11 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-all duration-300 focus:bg-surface-container-highest focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 block text-xs font-semibold uppercase tracking-widest text-on-surface-variant" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="curator@vibeify.com"
                      className="w-full rounded-lg bg-surface-container-high py-3 pl-11 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-all duration-300 focus:bg-surface-container-highest focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 block text-xs font-semibold uppercase tracking-widest text-on-surface-variant" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg bg-surface-container-high py-3 pl-11 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-all duration-300 focus:bg-surface-container-highest focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 block text-xs font-semibold uppercase tracking-widest text-on-surface-variant" htmlFor="confirm-password">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg bg-surface-container-high py-3 pl-11 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-all duration-300 focus:bg-surface-container-highest focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 px-1">
                <input
                  id="terms"
                  type="checkbox"
                  checked={terms}
                  onChange={(event) => setTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded bg-surface-container-high text-primary focus:ring-primary/30"
                />
                <label className="text-xs leading-relaxed text-on-surface-variant" htmlFor="terms">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary underline-offset-4 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary underline-offset-4 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>

              {error && (
                <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-primary to-primary-dim py-4 font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <div className="mt-8 text-center">
                <p className="text-sm text-on-surface-variant">
                  Already have an account?
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="ml-1 font-semibold text-primary underline-offset-4 transition-all hover:underline"
                  >
                    Login
                  </button>
                </p>
              </div>
            </form>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">
              Trusted by 2M+ Curators Worldwide
            </p>
            <div className="mt-4 flex justify-center gap-6 opacity-30 grayscale transition-all duration-500 hover:grayscale-0">
              <Sparkles className="h-5 w-5" />
              <Diamond className="h-5 w-5" />
              <Palette className="h-5 w-5" />
              <BadgeCheck className="h-5 w-5" />
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto w-full bg-purple-50 px-8 py-12 text-xs font-semibold uppercase tracking-widest">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-lg font-bold text-purple-700">Vibeify</div>
          <div className="flex items-center gap-8 text-purple-900/40">
            <Link className="opacity-80 transition-colors duration-200 hover:text-purple-700 hover:opacity-100" to="/privacy">
              Privacy
            </Link>
            <Link className="opacity-80 transition-colors duration-200 hover:text-purple-700 hover:opacity-100" to="/terms">
              Terms
            </Link>
            <a className="opacity-80 transition-colors duration-200 hover:text-purple-700 hover:opacity-100" href="#" aria-label="Twitter">
              Twitter
            </a>
            <a className="opacity-80 transition-colors duration-200 hover:text-purple-700 hover:opacity-100" href="#" aria-label="Instagram">
              Instagram
            </a>
          </div>
          <div className="text-purple-900/40">© 2024 Vibeify. The Digital Curator.</div>
        </div>
      </footer>
    </div>
  );
}

export default RegisterPage;
