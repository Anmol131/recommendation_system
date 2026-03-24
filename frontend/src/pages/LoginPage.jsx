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
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text flex flex-col transition-colors duration-300">
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-8 sm:p-12">
        <div className="pointer-events-none absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-secondary/5 blur-3xl" />

        <div className="relative z-10 w-full max-w-[440px]">
          <div className="rounded-lg border border-light-surface-alt dark:border-dark-surface-alt bg-light-surface dark:bg-dark-surface p-8 shadow-lg dark:shadow-2xl md:p-10">
            <header className="mb-10 text-center">
              <h1 className="mb-2 text-3xl font-bold tracking-tighter text-primary">Vibeify</h1>
              <p className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">The Digital Curator awaits you.</p>
            </header>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="ml-1 block text-xs font-semibold uppercase tracking-widest text-light-text-secondary/60 dark:text-dark-text-secondary/60" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-light-text-secondary/50 dark:text-dark-text-secondary/50" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="curator@vibeify.com"
                    className="w-full rounded-lg border border-light-surface-alt dark:border-dark-surface-alt bg-light-surface dark:bg-dark-surface py-3.5 pl-11 pr-4 text-sm text-light-text dark:text-dark-text placeholder:text-light-text-secondary/40 dark:placeholder:text-dark-text-secondary/40 outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-light-text-secondary/60 dark:text-dark-text-secondary/60" htmlFor="password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/change-password')}
                    className="text-[10px] font-bold uppercase tracking-wider text-primary transition-colors duration-200 hover:text-primary-light dark:hover:text-primary-light"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-light-text-secondary/50 dark:text-dark-text-secondary/50" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-light-surface-alt dark:border-dark-surface-alt bg-light-surface dark:bg-dark-surface py-3.5 pl-11 pr-4 text-sm text-light-text dark:text-dark-text placeholder:text-light-text-secondary/40 dark:placeholder:text-dark-text-secondary/40 outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-red-100 dark:bg-red-950/50 px-3 py-2 text-sm text-red-600 dark:text-red-400" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-gradient-to-r from-primary to-secondary hover:shadow-xl px-6 py-4 text-sm font-bold tracking-wide text-white shadow-lg transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:shadow-lg"
              >
                {submitting ? 'LOGGING IN...' : 'LOGIN'}
              </button>
            </form>

            <div className="relative my-8 flex items-center">
              <div className="h-px flex-grow bg-light-surface-alt dark:bg-dark-surface-alt" />
              <span className="mx-4 shrink-0 text-[10px] font-bold uppercase tracking-widest text-light-text-secondary/40 dark:text-dark-text-secondary/40">or continue with</span>
              <div className="h-px flex-grow bg-light-surface-alt dark:bg-dark-surface-alt" />
            </div>

            <div className="mb-10 grid grid-cols-2 gap-4">
              <button
                type="button"
                className="group flex items-center justify-center gap-2 rounded-lg border border-light-surface-alt dark:border-dark-surface-alt bg-light-surface dark:bg-dark-surface px-4 py-3 transition-all duration-200 hover:bg-light-surface-alt dark:hover:bg-dark-surface-alt shadow-sm"
              >
                <Chrome className="h-5 w-5 text-light-text-secondary/60 dark:text-dark-text-secondary/60 transition-colors group-hover:text-primary" />
                <span className="text-xs font-semibold text-light-text-secondary/60 dark:text-dark-text-secondary/60">Google</span>
              </button>
              <button
                type="button"
                className="group flex items-center justify-center gap-2 rounded-lg border border-light-surface-alt dark:border-dark-surface-alt bg-light-surface dark:bg-dark-surface px-4 py-3 transition-all duration-200 hover:bg-light-surface-alt dark:hover:bg-dark-surface-alt shadow-sm"
              >
                <span className="text-sm font-bold text-light-text-secondary/60 dark:text-dark-text-secondary/60 transition-colors group-hover:text-primary">A</span>
                <span className="text-xs font-semibold text-light-text-secondary/60 dark:text-dark-text-secondary/60">Apple</span>
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary">
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
            <Link className="text-[10px] font-bold uppercase tracking-[0.2em] text-light-text-secondary/40 dark:text-dark-text-secondary/40 transition-colors hover:text-primary" to="/privacy">
              Privacy
            </Link>
            <Link className="text-[10px] font-bold uppercase tracking-[0.2em] text-light-text-secondary/40 dark:text-dark-text-secondary/40 transition-colors hover:text-primary" to="/terms">
              Terms
            </Link>
            <Link className="text-[10px] font-bold uppercase tracking-[0.2em] text-light-text-secondary/40 dark:text-dark-text-secondary/40 transition-colors hover:text-primary" to="/support">
              Support
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
