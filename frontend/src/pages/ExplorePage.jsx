import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Calendar,
  ChevronDown,
  Compass,
  Film,
  Home,
  Search,
  SlidersHorizontal,
  Star,
  User,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as endpoints from '../api/endpoints';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'movies', label: 'Movies' },
  { key: 'books', label: 'Books' },
  { key: 'games', label: 'Games' },
  { key: 'music', label: 'Music' },
];

const TAB_TYPE = {
  all: 'all',
  movies: 'movie',
  books: 'book',
  games: 'game',
  music: 'music',
};

const TYPE_LABEL = {
  movie: 'Movie',
  book: 'Book',
  game: 'Game',
  music: 'Music',
};

const getListRequest = {
  movies: (page, limit) => endpoints.getMovies({ page, limit, sort: 'rating' }),
  books: (page, limit) => endpoints.getBooks({ page, limit, sort: 'rating' }),
  games: (page, limit) => endpoints.getGames({ page, limit, sort: 'rating' }),
  music: (page, limit) => endpoints.getMusic({ page, limit, sort: 'popularity' }),
};

const getSearchRequest = {
  movies: (query) => endpoints.searchMovies(query),
  books: (query) => endpoints.searchBooks(query),
  games: (query) => endpoints.searchGames(query),
  music: (query) => endpoints.searchMusic(query),
};

const initialBuckets = {
  movies: [],
  books: [],
  games: [],
  music: [],
};

const imageFallback = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800';

const unwrapItems = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const unwrapTotal = (payload, fallbackLength) => {
  const direct = payload?.data?.totalItems ?? payload?.totalItems;
  if (typeof direct === 'number') {
    return direct;
  }
  return fallbackLength;
};

const normalizeGenres = (item) => {
  if (Array.isArray(item?.genres) && item.genres.length > 0) {
    return item.genres.filter(Boolean).map((genre) => String(genre));
  }
  if (typeof item?.genres === 'string') {
    return item.genres.split(',').map((genre) => genre.trim()).filter(Boolean);
  }
  if (typeof item?.genre === 'string') {
    return [item.genre];
  }
  return [];
};

const normalizeYear = (item) => {
  const value = item?.year || item?.releaseYear || item?.releaseDate || item?.publishedDate;
  if (!value) return 'N/A';
  const text = String(value);
  const match = text.match(/(19|20)\d{2}/);
  return match ? match[0] : text.slice(0, 4);
};

const normalizeRating = (item) => {
  const candidate = item?.avgRating ?? item?.rating ?? item?.voteAverage ?? item?.averageRating;
  const numeric = Number(candidate);
  if (Number.isNaN(numeric)) return null;
  return numeric.toFixed(1);
};

const normalizeDescription = (item) => item?.description || item?.overview || item?.summary || 'A fresh recommendation that fits your current vibe.';

const getImage = (item) => item?.poster || item?.cover || item?.image || item?.posterPath || imageFallback;

const getTitle = (item) => item?.title || item?.name || 'Untitled';

const getItemId = (item, type) => {
  if (type === 'movie') return item?.movieId ?? item?.tmdbId ?? item?.id ?? item?._id;
  if (type === 'book') return item?.isbn ?? item?.id ?? item?._id;
  if (type === 'game') return item?.gameId ?? item?.id ?? item?._id;
  return item?.trackId ?? item?.id ?? item?._id;
};

const getDetailPath = (item, type) => {
  const itemId = getItemId(item, type);
  if (!itemId) return '/browse';
  if (type === 'movie') return `/movies/${encodeURIComponent(itemId)}`;
  if (type === 'book') return `/books/${encodeURIComponent(itemId)}`;
  if (type === 'game') return `/games/${encodeURIComponent(itemId)}`;
  return `/music/${encodeURIComponent(itemId)}`;
};

const interleaveBuckets = (buckets) => {
  const keys = ['movies', 'books', 'games', 'music'];
  const max = Math.max(...keys.map((key) => buckets[key].length), 0);
  const merged = [];

  for (let index = 0; index < max; index += 1) {
    keys.forEach((key) => {
      if (buckets[key][index]) {
        merged.push(buckets[key][index]);
      }
    });
  }

  return merged;
};

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-outline-variant/5 bg-white/70 shadow-[0_20px_45px_-20px_rgba(62,37,72,0.18)] animate-pulse"
        >
          <div className="aspect-[4/5] bg-surface-container-high" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-2/3 rounded bg-surface-container-high" />
            <div className="h-3 w-1/3 rounded bg-surface-container-high" />
            <div className="h-3 w-full rounded bg-surface-container-high" />
            <div className="h-3 w-5/6 rounded bg-surface-container-high" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ExplorePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchTokenRef = useRef(0);
  const searchDebounceRef = useRef(null);
  const allBucketsRef = useRef(initialBuckets);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    setPage(1);
    setItems([]);
    allBucketsRef.current = initialBuckets;
    setTotalItems(0);
  }, [activeTab, debouncedQuery]);

  useEffect(() => {
    const token = Date.now();
    fetchTokenRef.current = token;

    const load = async () => {
      const initialLoad = page === 1;
      if (initialLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        if (debouncedQuery) {
          if (activeTab === 'all') {
            const [moviesRes, booksRes, gamesRes, musicRes] = await Promise.allSettled([
              getSearchRequest.movies(debouncedQuery),
              getSearchRequest.books(debouncedQuery),
              getSearchRequest.games(debouncedQuery),
              getSearchRequest.music(debouncedQuery),
            ]);

            if (fetchTokenRef.current !== token) return;

            const nextBuckets = {
              movies: moviesRes.status === 'fulfilled'
                ? unwrapItems(moviesRes.value).map((item) => ({ ...item, __type: 'movie' }))
                : [],
              books: booksRes.status === 'fulfilled'
                ? unwrapItems(booksRes.value).map((item) => ({ ...item, __type: 'book' }))
                : [],
              games: gamesRes.status === 'fulfilled'
                ? unwrapItems(gamesRes.value).map((item) => ({ ...item, __type: 'game' }))
                : [],
              music: musicRes.status === 'fulfilled'
                ? unwrapItems(musicRes.value).map((item) => ({ ...item, __type: 'music' }))
                : [],
            };

            const merged = interleaveBuckets(nextBuckets);
            setItems(merged);
            setTotalItems(merged.length);
            return;
          }

          const response = await getSearchRequest[activeTab](debouncedQuery);
          if (fetchTokenRef.current !== token) return;

          const foundItems = unwrapItems(response).map((item) => ({
            ...item,
            __type: TAB_TYPE[activeTab],
          }));

          setItems(foundItems);
          setTotalItems(unwrapTotal(response, foundItems.length));
          return;
        }

        if (activeTab === 'all') {
          const limitPerType = 3;
          const [moviesRes, booksRes, gamesRes, musicRes] = await Promise.allSettled([
            getListRequest.movies(page, limitPerType),
            getListRequest.books(page, limitPerType),
            getListRequest.games(page, limitPerType),
            getListRequest.music(page, limitPerType),
          ]);

          if (fetchTokenRef.current !== token) return;

          const incomingBuckets = {
            movies: moviesRes.status === 'fulfilled'
              ? unwrapItems(moviesRes.value).map((item) => ({ ...item, __type: 'movie' }))
              : [],
            books: booksRes.status === 'fulfilled'
              ? unwrapItems(booksRes.value).map((item) => ({ ...item, __type: 'book' }))
              : [],
            games: gamesRes.status === 'fulfilled'
              ? unwrapItems(gamesRes.value).map((item) => ({ ...item, __type: 'game' }))
              : [],
            music: musicRes.status === 'fulfilled'
              ? unwrapItems(musicRes.value).map((item) => ({ ...item, __type: 'music' }))
              : [],
          };

          const totals = [moviesRes, booksRes, gamesRes, musicRes].reduce((acc, result) => {
            if (result.status !== 'fulfilled') return acc;
            return acc + unwrapTotal(result.value, unwrapItems(result.value).length);
          }, 0);

          const nextBuckets = initialLoad
            ? incomingBuckets
            : {
              movies: [...allBucketsRef.current.movies, ...incomingBuckets.movies],
              books: [...allBucketsRef.current.books, ...incomingBuckets.books],
              games: [...allBucketsRef.current.games, ...incomingBuckets.games],
              music: [...allBucketsRef.current.music, ...incomingBuckets.music],
            };

          allBucketsRef.current = nextBuckets;
          setItems(interleaveBuckets(nextBuckets));
          setTotalItems(totals);
          return;
        }

        const response = await getListRequest[activeTab](page, 12);
        if (fetchTokenRef.current !== token) return;

        const fetched = unwrapItems(response).map((item) => ({
          ...item,
          __type: TAB_TYPE[activeTab],
        }));

        setItems((current) => (initialLoad ? fetched : [...current, ...fetched]));
        setTotalItems(unwrapTotal(response, fetched.length));
      } catch {
        if (fetchTokenRef.current !== token) return;
        if (initialLoad) {
          setItems([]);
          setTotalItems(0);
          allBucketsRef.current = initialBuckets;
        }
      } finally {
        if (fetchTokenRef.current === token) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    load();
  }, [activeTab, debouncedQuery, page]);

  const canLoadMore = useMemo(() => {
    if (debouncedQuery) {
      return false;
    }
    return items.length < totalItems;
  }, [debouncedQuery, items.length, totalItems]);

  const handleLoadMore = () => {
    if (!canLoadMore || loadingMore) return;
    setPage((current) => current + 1);
  };

  const handleCardClick = (item) => {
    const cardType = item.__type || 'movie';
    navigate(getDetailPath(item, cardType));
  };

  const bottomItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Explore', href: '/explore', icon: Compass },
    { label: 'Movies', href: '/movies', icon: Film },
    { label: 'Account', href: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#fff3fd] pb-24 text-[#3e2548] font-['Inter'] antialiased selection:bg-primary-container selection:text-on-primary">
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 sm:px-8 lg:px-10">
        <header className="space-y-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="mb-2 text-5xl font-bold leading-tight tracking-tight text-[#3e2548]">Explore</h1>
              <p className="max-w-xl text-lg text-on-surface-variant">
                Curated recommendations across every medium. Find your next favorite vibe.
              </p>
            </div>

            <div className="group relative w-full md:w-96">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search vibes, titles, authors..."
                className="h-14 w-full rounded-xl border border-outline-variant/10 bg-surface-container-high px-5 pr-12 text-on-surface placeholder:text-on-surface-variant/70 transition-all duration-300 focus:border-primary/20 focus:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_0_6px_rgba(131,25,218,0.12)]"
              />
              <Search size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 transition-colors group-focus-within:text-primary" />
            </div>
          </div>

          <div className="rounded-2xl bg-white/60 px-4 py-5 shadow-[0_14px_40px_-20px_rgba(62,37,72,0.15)] sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-3">
                {TABS.map((tab) => {
                  const active = tab.key === activeTab;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={[
                        'rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-500',
                        active
                          ? 'bg-primary text-on-primary shadow-[0_14px_30px_-16px_rgba(131,25,218,0.45)]'
                          : 'border border-outline-variant/20 bg-white text-on-surface-variant hover:bg-primary/5 hover:text-primary',
                      ].join(' ')}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="hidden items-center gap-2 text-on-surface-variant sm:flex">
                <button type="button" className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-surface-container-low hover:text-primary">
                  <SlidersHorizontal size={16} />
                  Genre
                </button>
                <button type="button" className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-surface-container-low hover:text-primary">
                  <Star size={16} />
                  Rating
                </button>
                <button type="button" className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-surface-container-low hover:text-primary">
                  <Calendar size={16} />
                  Year
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-10">
          {loading ? (
            <SkeletonCards />
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item, index) => {
                const type = item.__type || 'movie';
                const genres = normalizeGenres(item);
                const rating = normalizeRating(item);

                return (
                  <article
                    key={`${type}-${getItemId(item, type) || index}`}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-outline-variant/5 bg-white/75 shadow-[0_14px_35px_-18px_rgba(62,37,72,0.2)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_28px_55px_-25px_rgba(62,37,72,0.26)]"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img
                        src={getImage(item)}
                        alt={getTitle(item)}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />

                      <div className="absolute left-4 top-4">
                        <span className="rounded-full bg-white/35 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                          {TYPE_LABEL[type]}
                        </span>
                      </div>

                      <div className="absolute right-4 top-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                        <button
                          type="button"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/10 bg-white text-primary shadow-[0_12px_30px_-16px_rgba(62,37,72,0.35)]"
                          aria-label="Save recommendation"
                        >
                          <Bookmark size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="flex h-full flex-col p-5">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="line-clamp-1 text-xl font-bold text-on-surface">{getTitle(item)}</h3>
                        <div className="inline-flex items-center gap-1 text-[#a03648]">
                          <Star size={14} fill="#a03648" />
                          <span className="text-xs font-bold">{rating || 'N/A'}</span>
                        </div>
                      </div>

                      <p
                        className="mb-6 text-sm text-on-surface-variant"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {normalizeDescription(item)}
                      </p>

                      <div className="mt-auto flex items-center justify-between rounded-xl bg-surface-container-highest/45 px-3 py-2">
                        <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/80">
                          {(genres[0] || 'Curated')} • {normalizeYear(item)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCardClick(item)}
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

          {!loading && items.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant/10 bg-white/70 px-6 py-14 text-center shadow-[0_14px_40px_-24px_rgba(62,37,72,0.2)]">
              <p className="text-lg font-semibold text-on-surface">No recommendations match that vibe yet.</p>
              <p className="mt-2 text-sm text-on-surface-variant">Try another keyword or switch category.</p>
            </div>
          ) : null}
        </section>

        {!loading && items.length > 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3">
            {canLoadMore ? (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="group inline-flex items-center gap-2 rounded-full bg-surface-container-highest px-9 py-3 font-bold text-on-surface shadow-[0_14px_35px_-20px_rgba(62,37,72,0.2)] transition-all duration-300 hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingMore ? 'Loading more vibes...' : 'Show more vibes'}
                <ChevronDown size={18} className="transition-transform duration-300 group-hover:translate-y-1" />
              </button>
            ) : null}

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant/70">
              Viewing {items.length} of {totalItems} recommendations
            </p>
          </div>
        ) : null}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-outline-variant/10 bg-white/85 backdrop-blur-lg md:hidden">
        {bottomItems.map((item) => {
          const active = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <button
              key={item.href}
              type="button"
              onClick={() => navigate(item.href)}
              className={[
                'inline-flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-tight transition-colors',
                active ? 'text-primary' : 'text-on-surface-variant/75',
              ].join(' ')}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default ExplorePage;
