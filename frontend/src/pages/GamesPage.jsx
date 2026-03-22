import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  ChevronDown,
  Compass,
  Gamepad2,
  Home,
  Search,
  SlidersHorizontal,
  Star,
  User,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as endpoints from '../api/endpoints';

const LIMIT = 12;

const CATEGORY_LINKS = [
  { label: 'All', path: '/explore', active: false },
  { label: 'Movies', path: '/movies', active: false },
  { label: 'Books', path: '/books', active: false },
  { label: 'Games', path: '/games', active: true },
  { label: 'Music', path: '/music', active: false },
];

const GENRES = ['Action RPG', 'Strategy', 'Simulation', 'Indie', 'FPS', 'Adventure', 'Sports', 'Puzzle'];

const PLATFORM_OPTIONS = [
  { label: 'PC', value: 'pc' },
  { label: 'PlayStation', value: 'playstation' },
  { label: 'Xbox', value: 'xbox' },
  { label: 'Mobile', value: 'mobile' },
];

const MODE_OPTIONS = ['Singleplayer', 'Multiplayer', 'Co-op'];

const unwrapItems = (payload) => {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const unwrapTotal = (payload, fallbackLength = 0) => {
  const total = payload?.data?.totalItems ?? payload?.totalItems;
  return typeof total === 'number' ? total : fallbackLength;
};

const normalizeGenres = (item) => {
  if (Array.isArray(item?.genres)) {
    return item.genres
      .flatMap((genre) => String(genre).split(/[|,]/))
      .map((genre) => genre.trim())
      .filter(Boolean);
  }

  if (typeof item?.genres === 'string') {
    return item.genres
      .split(/[|,]/)
      .map((genre) => genre.trim())
      .filter(Boolean);
  }

  if (typeof item?.genre === 'string') {
    return [item.genre.trim()].filter(Boolean);
  }

  return [];
};

const normalizeRating = (item) => {
  const value = Number(item?.rating ?? item?.avgRating ?? item?.averageRating);
  return Number.isNaN(value) ? 0 : value;
};

const normalizePlatformText = (item) => {
  return [item?.platform, item?.pcPlatform]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const normalizePlatformLabel = (item) => {
  const text = normalizePlatformText(item);
  if (text.includes('playstation') || text.includes('ps5') || text.includes('ps4')) return 'PlayStation';
  if (text.includes('xbox')) return 'Xbox';
  if (text.includes('mobile') || text.includes('android') || text.includes('ios')) return 'Mobile';
  if (text.includes('pc') || text.includes('steam') || text.includes('windows')) return 'PC';
  return item?.platform || 'Platform N/A';
};

const platformMatches = (item, selectedPlatforms) => {
  if (selectedPlatforms.length === 0) return true;

  const text = normalizePlatformText(item);

  const platformKeywords = {
    pc: ['pc', 'steam', 'windows', 'desktop'],
    playstation: ['playstation', 'ps5', 'ps4'],
    xbox: ['xbox', 'series x', 'series s'],
    mobile: ['mobile', 'android', 'ios', 'google play', 'app store'],
  };

  return selectedPlatforms.some((platform) => {
    const keywords = platformKeywords[platform] || [platform];
    return keywords.some((keyword) => text.includes(keyword));
  });
};

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
            <div className="h-4 w-3/5 rounded bg-surface-container-high" />
            <div className="h-3 w-2/5 rounded bg-surface-container-high" />
            <div className="h-3 w-full rounded bg-surface-container-high" />
            <div className="h-3 w-4/5 rounded bg-surface-container-high" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GamesPage() {
  const navigate = useNavigate();

  const [games, setGames] = useState([]);
  const [page, setPage] = useState(1);
  const [totalGames, setTotalGames] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedModes, setSelectedModes] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const queryDebounceRef = useRef(null);

  useEffect(() => {
    if (queryDebounceRef.current) {
      clearTimeout(queryDebounceRef.current);
    }

    queryDebounceRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 350);

    return () => {
      if (queryDebounceRef.current) {
        clearTimeout(queryDebounceRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    setPage(1);
    setGames([]);
    setHasMore(true);
  }, [selectedPlatforms]);

  useEffect(() => {
    let cancelled = false;

    const loadGames = async () => {
      const firstPage = page === 1;
      if (firstPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const platformForApi =
          selectedPlatforms.length === 1 && ['pc', 'mobile'].includes(selectedPlatforms[0])
            ? selectedPlatforms[0]
            : undefined;

        const response = await endpoints.getGames({
          limit: LIMIT,
          sort: 'rating',
          platform: platformForApi,
          page,
        });

        if (cancelled) return;

        const incoming = unwrapItems(response);
        const apiTotal = unwrapTotal(response, incoming.length);

        setTotalGames(apiTotal);
        setGames((current) => (firstPage ? incoming : [...current, ...incoming]));
        setHasMore(page * LIMIT < apiTotal && incoming.length > 0);
      } catch {
        if (cancelled) return;

        if (page === 1) {
          setGames([]);
          setTotalGames(0);
        }

        setHasMore(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    loadGames();

    return () => {
      cancelled = true;
    };
  }, [page, selectedPlatforms]);

  const filteredGames = useMemo(() => {
    return games.filter((item) => {
      const itemGenres = normalizeGenres(item);
      const rating = normalizeRating(item);

      const genreOk = selectedGenres.length === 0
        || selectedGenres.some((selected) => itemGenres.some((entry) => entry.toLowerCase() === selected.toLowerCase()));

      const platformOk = platformMatches(item, selectedPlatforms);
      const ratingOk = rating >= minRating;

      const text = `${item?.title || ''} ${item?.description || ''}`.toLowerCase();
      const queryOk = debouncedQuery.length === 0 || text.includes(debouncedQuery);

      return genreOk && platformOk && ratingOk && queryOk;
    });
  }, [games, selectedGenres, selectedPlatforms, minRating, debouncedQuery]);

  const handleGenreToggle = (genre) => {
    setSelectedGenres((current) => {
      if (current.includes(genre)) {
        return current.filter((entry) => entry !== genre);
      }
      return [...current, genre];
    });
  };

  const handlePlatformToggle = (platformValue) => {
    setSelectedPlatforms((current) => {
      if (current.includes(platformValue)) {
        return current.filter((entry) => entry !== platformValue);
      }
      return [...current, platformValue];
    });
  };

  const handleModeToggle = (mode) => {
    setSelectedModes((current) => {
      if (current.includes(mode)) {
        return current.filter((entry) => entry !== mode);
      }
      return [...current, mode];
    });
  };

  const handleResetFilters = () => {
    setSelectedGenres([]);
    setSelectedPlatforms([]);
    setSelectedModes([]);
    setMinRating(0);
    setQuery('');
    setDebouncedQuery('');
  };

  const handleShowMore = () => {
    if (!hasMore || loadingMore) return;
    setPage((current) => current + 1);
  };

  const visibleCount = filteredGames.length;
  const totalLabel = totalGames || games.length;

  return (
    <div className="min-h-screen bg-[#fff3fd] pb-20 text-[#3e2548] font-['Inter'] antialiased">
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 sm:px-8 lg:px-10">
        <header className="mb-12 space-y-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="mb-2 text-5xl font-bold leading-tight tracking-tight text-on-background">Games</h1>
              <p className="max-w-xl text-lg text-on-surface-variant">
                Immersive worlds and competitive challenges curated for your style.
              </p>
            </div>

            <div className="group relative w-full md:w-96">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for your next game..."
                className="h-14 w-full rounded-xl bg-surface-container-high px-5 pr-12 text-on-surface placeholder:text-on-surface-variant/70 transition-all duration-300 focus:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Search size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 transition-colors group-focus-within:text-primary" />
            </div>
          </div>

          <nav className="mb-2 flex items-center justify-center gap-6 overflow-x-auto sm:gap-8">
            {CATEGORY_LINKS.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={[
                  'relative whitespace-nowrap px-1 pb-4 text-sm font-bold uppercase tracking-[0.2em] transition-colors duration-300',
                  item.active
                    ? "text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary after:content-['']"
                    : 'text-on-surface-variant/50 hover:text-primary',
                ].join(' ')}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="flex flex-col gap-10 lg:flex-row">
          <aside className="w-full lg:w-72 lg:flex-shrink-0">
            <div className="space-y-7 rounded-2xl bg-surface-container-lowest p-6 shadow-[0_18px_45px_-26px_rgba(62,37,72,0.22)] lg:sticky lg:top-24">
              <div className="flex items-center justify-between">
                <h2 className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
                  <SlidersHorizontal size={16} />
                  Filters
                </h2>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded-lg bg-surface-container-highest px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-primary transition-all duration-300 hover:bg-primary hover:text-on-primary"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70">Genre</h3>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((genre) => {
                    const active = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => handleGenreToggle(genre)}
                        className={[
                          'rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                          active
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high',
                        ].join(' ')}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70">Platform</h3>
                <div className="space-y-2.5">
                  {PLATFORM_OPTIONS.map((option) => (
                    <label key={option.value} className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(option.value)}
                        onChange={() => handlePlatformToggle(option.value)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm text-on-surface-variant transition-colors hover:text-primary">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70">Mode</h3>
                <div className="flex flex-wrap gap-2">
                  {MODE_OPTIONS.map((mode) => {
                    const active = selectedModes.includes(mode);
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleModeToggle(mode)}
                        className={[
                          'rounded-md border px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.13em] transition-colors',
                          active
                            ? 'border-primary text-primary'
                            : 'border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary',
                        ].join(' ')}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70">Min. Rating</h3>
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-[#a03648]" fill="#a03648" />
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={minRating}
                    onChange={(event) => setMinRating(Number(event.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-high accent-primary"
                  />
                  <span className="min-w-12 text-right text-xs font-bold text-on-surface-variant">{minRating.toFixed(1)}+</span>
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0 flex-1">
            {loading ? (
              <LoadingSkeletons />
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                {filteredGames.map((item, index) => {
                  const genres = normalizeGenres(item);
                  const rating = normalizeRating(item);

                  return (
                    <article
                      key={`${item?._id || item?.gameId || item?.id || 'game'}-${index}`}
                      className="group flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_14px_35px_-18px_rgba(62,37,72,0.2)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_28px_55px_-25px_rgba(62,37,72,0.26)]"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden">
                        <img
                          src={item?.image || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800'}
                          alt={item?.title || 'Game cover'}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />

                        <div className="absolute left-4 top-4">
                          <span className="rounded-full bg-white/25 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_-16px_rgba(0,0,0,0.45)] backdrop-blur-md">
                            {genres[0] || 'Game'}
                          </span>
                        </div>

                        <div className="absolute right-4 top-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary shadow-[0_10px_24px_-16px_rgba(62,37,72,0.4)]"
                            aria-label="Bookmark game"
                          >
                            <Bookmark size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="flex h-full flex-col p-5">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="line-clamp-1 text-xl font-bold text-on-surface transition-colors group-hover:text-primary">
                            {item?.title || 'Untitled Game'}
                          </h3>
                          <div className="inline-flex items-center gap-1 text-[#a03648]">
                            <Star size={14} fill="#a03648" color="#a03648" />
                            <span className="text-xs font-bold">{rating.toFixed(1)}</span>
                          </div>
                        </div>

                        <p className="mb-5 line-clamp-2 text-sm text-on-surface-variant/80">
                          {item?.description || 'Step into an expertly curated game recommendation designed around your vibe.'}
                        </p>

                        <div className="mt-auto flex items-center justify-between gap-3 rounded-xl bg-surface-container-highest/45 px-3 py-2">
                          <span className="line-clamp-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/80">
                            {normalizePlatformLabel(item)} • {item?.developer || 'Unknown Studio'}
                          </span>
                          <button
                            type="button"
                            onClick={() => navigate(`/games/${encodeURIComponent(String(item?._id || item?.gameId || item?.id || ''))}`)}
                            className="group/btn inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary"
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

            {!loading && filteredGames.length === 0 ? (
              <div className="rounded-2xl bg-white/70 px-6 py-14 text-center shadow-[0_14px_40px_-24px_rgba(62,37,72,0.2)]">
                <p className="text-lg font-semibold text-on-surface">No games matched your filters.</p>
                <p className="mt-2 text-sm text-on-surface-variant">Try adjusting genres, platform, search, or minimum rating.</p>
              </div>
            ) : null}

            {!loading && filteredGames.length > 0 ? (
              <div className="mt-16 flex flex-col items-center gap-4">
                {hasMore ? (
                  <button
                    type="button"
                    onClick={handleShowMore}
                    disabled={loadingMore}
                    className="group inline-flex items-center gap-2 rounded-full bg-surface-container-highest px-9 py-3 font-bold text-on-surface shadow-[0_14px_35px_-20px_rgba(62,37,72,0.2)] transition-all duration-300 hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loadingMore ? 'Loading more discoveries...' : 'Show more discoveries'}
                    <ChevronDown size={18} className="transition-transform duration-300 group-hover:translate-y-1" />
                  </button>
                ) : null}

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant/70">
                  Viewing {visibleCount} of {totalLabel} titles
                </p>
              </div>
            ) : null}
          </section>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around bg-white/85 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex flex-col items-center gap-1 text-on-background/40"
        >
          <Home size={18} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Home</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/games')}
          className="flex flex-col items-center gap-1 text-primary"
        >
          <Gamepad2 size={18} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Games</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/explore')}
          className="flex flex-col items-center gap-1 text-on-background/40"
        >
          <Compass size={18} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Explore</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex flex-col items-center gap-1 text-on-background/40"
        >
          <User size={18} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Account</span>
        </button>
      </nav>
    </div>
  );
}

export default GamesPage;
