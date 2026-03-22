import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Chrome, Lock, Mail } from 'lucide-react';
import * as endpoints from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const authPayload = await endpoints.login({ email, password });
      await login(authPayload);
      navigate('/');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-8 sm:p-12">
        <div className="pointer-events-none absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-secondary/5 blur-3xl" />

        <div className="relative z-10 w-full max-w-[440px]">
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)] md:p-10">
            <header className="mb-10 text-center">
              <h1 className="mb-2 text-3xl font-bold tracking-tighter text-primary">Vibeify</h1>
              <p className="text-sm font-medium text-on-surface-variant">The Digital Curator awaits you.</p>
            </header>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
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
                    className="w-full rounded-lg bg-surface-container-high py-3.5 pl-11 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-all duration-300 focus:bg-surface-container-highest focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant" htmlFor="password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/change-password')}
                    className="text-[10px] font-bold uppercase tracking-wider text-primary transition-colors hover:text-primary-dim"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-surface-container-high py-3.5 pl-11 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-all duration-300 focus:bg-surface-container-highest focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-gradient-to-br from-primary to-primary-container px-6 py-4 text-sm font-bold tracking-wide text-on-primary shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'LOGGING IN...' : 'LOGIN'}
              </button>
            </form>

            <div className="relative my-8 flex items-center">
              <div className="h-px flex-grow bg-outline-variant/20" />
              <span className="mx-4 shrink-0 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">or continue with</span>
              <div className="h-px flex-grow bg-outline-variant/20" />
            </div>

            <div className="mb-10 grid grid-cols-2 gap-4">
              <button
                type="button"
                className="group flex items-center justify-center gap-2 rounded-lg bg-surface-container-low px-4 py-3 transition-colors hover:bg-surface-container-high"
              >
                <Chrome className="h-5 w-5 text-on-surface-variant transition-colors group-hover:text-primary" />
                <span className="text-xs font-semibold text-on-surface-variant">Google</span>
              </button>
              <button
                type="button"
                className="group flex items-center justify-center gap-2 rounded-lg bg-surface-container-low px-4 py-3 transition-colors hover:bg-surface-container-high"
              >
                <span className="text-sm font-bold text-on-surface-variant transition-colors group-hover:text-primary">A</span>
                <span className="text-xs font-semibold text-on-surface-variant">Apple</span>
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs font-medium text-on-surface-variant">
                Don't have an account?
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="ml-1 font-bold text-primary underline-offset-4 hover:underline"
                >
                  Register
                </button>
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-8">
            <Link className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40 transition-colors hover:text-primary" to="/privacy">
              Privacy
            </Link>
            <Link className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40 transition-colors hover:text-primary" to="/terms">
              Terms
            </Link>
            <Link className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40 transition-colors hover:text-primary" to="/support">
              Support
            </Link>
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

export default LoginPage;
