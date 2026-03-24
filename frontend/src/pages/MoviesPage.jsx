import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as endpoints from '../api/endpoints';

const CATEGORY_LINKS = [
  { label: 'All', path: '/explore', active: false },
  { label: 'Movies', path: '/explore?type=movies', active: true },
  { label: 'Books', path: '/explore?type=books', active: false },
  { label: 'Games', path: '/explore?type=games', active: false },
  { label: 'Music', path: '/explore?type=music', active: false },
];

const unwrapItems = (payload) => {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const normalizeRating = (item) => {
  const value = Number(item?.avgRating ?? item?.rating);
  return Number.isNaN(value) ? 'N/A' : value.toFixed(1);
};

const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1000';

function MoviesPage() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadMovies = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await endpoints.getMovies({ limit: 24, sort: 'rating' });
        if (cancelled) return;
        setMovies(unwrapItems(response));
      } catch {
        if (!cancelled) {
          setMovies([]);
          setError('load-failed');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMovies();

    return () => {
      cancelled = true;
    };
  }, []);

  const total = useMemo(() => movies.length, [movies]);

  return (
    <div className="min-h-screen bg-background pb-20 text-on-background font-['Inter'] antialiased">
      <main className="mx-auto max-w-7xl px-6 pb-16 pt-10 sm:px-8 lg:px-10">
        <div className="mb-10 flex justify-center">
          <nav className="flex items-center gap-1 rounded-2xl bg-surface-container-low p-1.5 shadow-[0_14px_35px_-24px_rgba(62,37,72,0.24)]">
            {CATEGORY_LINKS.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={[
                  'rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-300',
                  item.active
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/25'
                    : 'text-on-surface-variant hover:bg-surface-container-high',
                ].join(' ')}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <header className="mb-10">
          <h1 className="text-5xl font-bold tracking-tight text-on-background">Movies</h1>
          <p className="mt-3 max-w-2xl text-on-surface-variant">
            Explore top-rated picks from your catalog and open any title for full details.
          </p>
          <p className="mt-2 text-sm font-medium text-on-surface-variant/80">{total} titles loaded</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_16px_40px_-20px_rgba(62,37,72,0.22)]"
              >
                <div className="aspect-[2/3] animate-pulse bg-surface-container-high" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-surface-container-high" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-surface-container-high" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-2xl bg-surface-container-low p-8 text-center shadow-[0_20px_40px_-20px_rgba(62,37,72,0.3)]">
            <h2 className="text-2xl font-bold">Could not load movies</h2>
            <p className="mt-2 text-on-surface-variant">Please try again in a moment.</p>
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {movies.map((item) => {
              const detailId = item?._id;

              return (
                <article
                  key={String(detailId || item?.title)}
                  className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_16px_40px_-20px_rgba(62,37,72,0.22)]"
                >
                  <div className="relative aspect-[2/3]">
                    <img
                      src={item?.poster || FALLBACK_POSTER}
                      alt={item?.title || 'Movie poster'}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-md bg-surface/80 px-2 py-1 text-xs font-bold backdrop-blur-md">
                      <Star size={12} className="fill-current" />
                      {normalizeRating(item)}
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <h2 className="line-clamp-1 text-xl font-bold text-on-surface">{item?.title || 'Untitled movie'}</h2>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {(item?.year || 'Year N/A')} • {item?.genres?.[0] || item?.genre || 'Movie'}
                      </p>
                    </div>

                    <p className="line-clamp-3 text-sm leading-relaxed text-on-surface-variant">
                      {item?.description || 'No description available for this title yet.'}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        if (!detailId) return;
                        navigate('/explore?type=movies');
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-[0_15px_30px_-18px_rgba(131,25,218,0.8)] transition-all hover:gap-3"
                    >
                      View Details
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default MoviesPage;
