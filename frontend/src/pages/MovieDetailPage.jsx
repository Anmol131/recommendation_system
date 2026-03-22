import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  ChevronDown,
  Moon,
  Search,
  SlidersHorizontal,
  Star,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as endpoints from '../api/endpoints';

const DEFAULT_GENRES = ['Drama', 'Sci-Fi', 'Thriller', 'Action', 'Comedy', 'Horror', 'Romance', 'Adventure'];
const LIMIT = 12;

const CATEGORY_LINKS = [
  { label: 'All', path: '/explore' },
  { label: 'Movies', path: '/movies', active: true },
  { label: 'Books', path: '/books' },
  { label: 'Games', path: '/games' },
  { label: 'Music', path: '/music' },
];

const SORT_TABS = [
  { label: 'Popular', value: 'popularity' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Latest', value: 'year' },
];

const YEARS = ['all', ...Array.from({ length: 25 }, (_, index) => String(2024 - index))];

const unwrapItems = (payload) => {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const unwrapTotal = (payload, fallbackLength = 0) => {
  const value = payload?.data?.totalItems ?? payload?.totalItems;
  return typeof value === 'number' ? value : fallbackLength;
};

const normalizeGenres = (movie) => {
  if (Array.isArray(movie?.genres)) {
    return movie.genres
      .flatMap((genre) => String(genre).split(/[|,]/))
      .map((genre) => genre.trim())
      .filter(Boolean);
  }

  if (typeof movie?.genres === 'string') {
    return movie.genres
      .split(/[|,]/)
      .map((genre) => genre.trim())
      .filter(Boolean);
  }

  if (typeof movie?.genre === 'string') {
    return [movie.genre.trim()].filter(Boolean);
  }

  return [];
};

const getMovieYear = (movie) => {
  const value = movie?.year || movie?.releaseDate;
  if (!value) return '';
  const text = String(value);
  const match = text.match(/(19|20)\d{2}/);
  return match ? match[0] : text.slice(0, 4);
};

const getMovieRating = (movie) => {
  const candidate = movie?.avgRating ?? movie?.voteAverage ?? movie?.rating;
  const value = Number(candidate);
  return Number.isNaN(value) ? 0 : value;
};

const getMovieId = (movie) => movie?._id || movie?.movieId || movie?.tmdbId || movie?.id;
const getPoster = (movie) => movie?.poster || movie?.posterPath || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900';

function LoadingSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl bg-white/75 shadow-[0_14px_35px_-18px_rgba(62,37,72,0.2)] animate-pulse"
        >
          <div className="aspect-[4/5] bg-surface-container-high" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-2/3 rounded bg-surface-container-high" />
            <div className="h-3 w-1/4 rounded bg-surface-container-high" />
            <div className="h-3 w-full rounded bg-surface-container-high" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MovieDetailPage() {
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [genreOptions, setGenreOptions] = useState(DEFAULT_GENRES);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedYear, setSelectedYear] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState('popularity');
  const [query, setQuery] = useState('');

  const [page, setPage] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const response = await endpoints.getMovies({ limit: 100, sort: 'popularity' });
        const unique = new Set();

        unwrapItems(response).forEach((movie) => {
          normalizeGenres(movie).forEach((genre) => {
            unique.add(genre);
          });
        });

        if (unique.size > 0) {
          setGenreOptions(Array.from(unique).sort((a, b) => a.localeCompare(b)));
        }
      } catch {
        setGenreOptions(DEFAULT_GENRES);
      }
    };

    loadGenres();
  }, []);

  useEffect(() => {
    setPage(1);
    setMovies([]);
    setHasMore(true);
  }, [sort, selectedYear, minRating, selectedGenres, query]);

  useEffect(() => {
    let cancelled = false;

    const loadMovies = async () => {
      const isFirstPage = page === 1;
      if (isFirstPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = {
          limit: LIMIT,
          page,
          sort,
          genre: selectedGenres[0] || undefined,
          year: selectedYear === 'all' ? undefined : selectedYear,
          minRating: minRating > 0 ? minRating : undefined,
        };

        const response = await endpoints.getMovies(params);
        if (cancelled) return;

        const incoming = unwrapItems(response);
        const apiTotal = unwrapTotal(response, incoming.length);

        const filtered = incoming
          .filter((movie) => {
            const movieGenres = normalizeGenres(movie);
            const movieYear = getMovieYear(movie);
            const rating = getMovieRating(movie);

            const genreOk = selectedGenres.length === 0
              || selectedGenres.some((selectedGenre) => movieGenres.includes(selectedGenre));
            const yearOk = selectedYear === 'all' || movieYear === selectedYear;
            const ratingOk = rating >= minRating;
            const queryOk = query.trim().length === 0
              || String(movie?.title || '').toLowerCase().includes(query.trim().toLowerCase());

            return genreOk && yearOk && ratingOk && queryOk;
          })
          .sort((a, b) => {
            if (sort !== 'year') return 0;
            return Number(getMovieYear(b) || 0) - Number(getMovieYear(a) || 0);
          });

        setTotalMovies(apiTotal);
        setMovies((current) => (isFirstPage ? filtered : [...current, ...filtered]));
        setHasMore(page * LIMIT < apiTotal && incoming.length > 0);
      } catch {
        if (cancelled) return;
        if (isFirstPage) {
          setMovies([]);
          setTotalMovies(0);
        }
        setHasMore(false);
      } finally {
        if (cancelled) return;
        setLoading(false);
        setLoadingMore(false);
      }
    };

    loadMovies();

    return () => {
      cancelled = true;
    };
  }, [page, sort, selectedGenres, selectedYear, minRating, query]);

  const visibleCount = movies.length;

  const handleGenreToggle = (genre) => {
    setSelectedGenres((current) => {
      if (current.includes(genre)) {
        return current.filter((entry) => entry !== genre);
      }
      return [...current, genre];
    });
  };

  const handleClearFilters = () => {
    setSelectedGenres([]);
    setSelectedYear('all');
    setMinRating(0);
    setQuery('');
    setSort('popularity');
  };

  const handleBookmark = async (movie) => {
    const itemId = getMovieId(movie);
    if (!itemId) return;

    try {
      await endpoints.addHistory('movie', itemId, 'bookmark');
    } catch {
      // Swallow bookmark errors silently to keep browsing smooth.
    }
  };

  const handleShowMore = () => {
    if (!hasMore || loadingMore) return;
    setPage((current) => current + 1);
  };

  const ratingLabel = useMemo(() => minRating.toFixed(1), [minRating]);

  return (
    <div className="min-h-screen bg-[#fff3fd] pb-16 text-[#3e2548] font-['Inter'] antialiased">
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 sm:px-8 lg:px-10">
        <div className="mb-10 flex justify-center">
          <div className="flex flex-wrap items-center gap-1.5 rounded-full bg-surface-container-high p-1.5 shadow-inner">
            {CATEGORY_LINKS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.path)}
                className={[
                  'rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300',
                  item.active
                    ? 'bg-primary text-on-primary shadow-[0_12px_30px_-16px_rgba(131,25,218,0.45)]'
                    : 'text-on-surface-variant hover:bg-surface-container-highest',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <header className="mb-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="mb-2 text-5xl font-bold leading-tight tracking-tight text-on-background">Movies Hub</h1>
              <p className="max-w-xl text-lg text-on-surface-variant">
                Discover cinematic masterpieces and hidden gems from across the globe.
              </p>
            </div>

            <div className="flex w-full items-center gap-3 md:w-auto">
              <div className="group relative w-full md:w-96">
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search movies, directors..."
                  className="h-14 w-full rounded-xl bg-surface-container-high px-5 pr-12 text-on-surface placeholder:text-on-surface-variant/70 transition-all duration-300 focus:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Search size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 transition-colors group-focus-within:text-primary" />
              </div>

              <button
                type="button"
                className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-primary"
                aria-label="Toggle theme"
              >
                <Moon size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-10 lg:flex-row">
          <aside className="w-full lg:w-64 lg:flex-shrink-0">
            <div className="space-y-7 rounded-2xl bg-surface-container-lowest p-6 shadow-[0_18px_45px_-26px_rgba(62,37,72,0.22)] lg:sticky lg:top-24">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant/70">
                <SlidersHorizontal size={16} />
                Filters
              </h2>

              <div className="space-y-3">
                <label className="text-sm font-bold text-on-surface">Genre</label>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                  {genreOptions.map((genre) => (
                    <label key={genre} className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedGenres.includes(genre)}
                        onChange={() => handleGenreToggle(genre)}
                        className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20"
                      />
                      <span className="text-sm text-on-surface-variant">{genre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label htmlFor="movies-year" className="text-sm font-bold text-on-surface">Year</label>
                <select
                  id="movies-year"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                  className="w-full rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year === 'all' ? 'All Years' : year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label htmlFor="movies-rating" className="text-sm font-bold text-on-surface">
                  Min. Rating ({ratingLabel})
                </label>
                <input
                  id="movies-rating"
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={minRating}
                  onChange={(event) => setMinRating(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-container accent-primary"
                />
                <div className="flex justify-between text-[10px] font-bold uppercase text-on-surface-variant/60">
                  <span>0.0</span>
                  <span>5.0</span>
                  <span>10.0</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearFilters}
                className="w-full rounded-xl bg-surface-container-highest py-3 text-xs font-bold uppercase tracking-widest text-primary transition-all duration-300 hover:bg-primary hover:text-on-primary"
              >
                Clear Filters
              </button>
            </div>
          </aside>

          <section className="min-w-0 flex-1">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {SORT_TABS.map((tab) => {
                  const active = tab.value === sort;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setSort(tab.value)}
                      className={[
                        'rounded-full px-5 py-2 text-xs font-bold transition-all duration-300',
                        active
                          ? 'bg-primary text-on-primary shadow-[0_12px_30px_-16px_rgba(131,25,218,0.45)]'
                          : 'border border-outline-variant/10 bg-surface-container-lowest text-on-surface-variant hover:bg-primary/5',
                      ].join(' ')}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">Sort by:</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors hover:bg-surface-container-high"
                >
                  Date Added
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            {loading ? (
              <LoadingSkeletons />
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                {movies.map((movie, index) => {
                  const id = getMovieId(movie);
                  const genres = normalizeGenres(movie);
                  const firstGenre = genres[0] || 'Curated';
                  const year = getMovieYear(movie) || 'N/A';

                  return (
                    <article
                      key={`${id || 'movie'}-${index}`}
                      className="group flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_14px_35px_-18px_rgba(62,37,72,0.2)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_28px_55px_-25px_rgba(62,37,72,0.26)]"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden">
                        <img
                          src={getPoster(movie)}
                          alt={movie?.title || 'Movie poster'}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />

                        <div className="absolute right-4 top-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleBookmark(movie)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-[0_10px_28px_-14px_rgba(62,37,72,0.35)]"
                            aria-label="Bookmark movie"
                          >
                            <Bookmark size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="flex h-full flex-col p-5">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="line-clamp-1 text-xl font-bold text-on-surface">{movie?.title || 'Untitled Movie'}</h3>
                          <div className="inline-flex items-center gap-1 text-[#a03648]">
                            <Star size={14} fill="#a03648" color="#a03648" />
                            <span className="text-xs font-bold">{getMovieRating(movie).toFixed(1)}</span>
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between rounded-xl bg-surface-container-highest/45 px-3 py-2">
                          <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/80">
                            {firstGenre} • {year}
                          </span>
                          <button
                            type="button"
                            onClick={() => navigate(`/movies/${encodeURIComponent(String(id || movie?._id || ''))}`)}
                            className="group/btn inline-flex items-center gap-1 text-xs font-bold text-primary"
                          >
                            View Details
                            <ArrowRight size={14} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!loading && movies.length === 0 ? (
              <div className="rounded-2xl bg-white/70 px-6 py-14 text-center shadow-[0_14px_40px_-24px_rgba(62,37,72,0.2)]">
                <p className="text-lg font-semibold text-on-surface">No movies matched your filters.</p>
                <p className="mt-2 text-sm text-on-surface-variant">Try broadening genre, year, or rating.</p>
              </div>
            ) : null}

            {!loading && movies.length > 0 ? (
              <div className="mt-16 flex flex-col items-center gap-4">
                {hasMore ? (
                  <button
                    type="button"
                    onClick={handleShowMore}
                    disabled={loadingMore}
                    className="group inline-flex items-center gap-2 rounded-full bg-surface-container-highest px-9 py-3 font-bold text-on-surface shadow-[0_14px_35px_-20px_rgba(62,37,72,0.2)] transition-all duration-300 hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loadingMore ? 'Loading more movies...' : 'Show more movies'}
                    <ChevronDown size={18} className="transition-transform duration-300 group-hover:translate-y-1" />
                  </button>
                ) : null}

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant/70">
                  Viewing {visibleCount} of {totalMovies} movies
                </p>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}

export default MovieDetailPage;