import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Sparkles, Star } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as endpoints from '../api/endpoints';

const CATEGORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'movies', label: 'Movies' },
  { key: 'books', label: 'Books' },
  { key: 'games', label: 'Games' },
  { key: 'music', label: 'Music' },
];

const YEAR_OPTIONS = ['2020 - Present', '2010 - 2019', 'Classic Era'];

const LIST_REQUESTS = {
  movies: (page, limit) => endpoints.getMovies({ page, limit, sort: 'rating' }),
  books: (page, limit) => endpoints.getBooks({ page, limit, sort: 'rating' }),
  games: (page, limit) => endpoints.getGames({ page, limit, sort: 'rating' }),
  music: (page, limit) => endpoints.getMusic({ page, limit, sort: 'popularity' }),
};

const SEARCH_REQUESTS = {
  movies: (query) => endpoints.searchMovies(query),
  books: (query) => endpoints.searchBooks(query),
  games: (query) => endpoints.searchGames(query),
  music: (query) => endpoints.searchMusic(query),
};

const TYPE_LABEL = {
  movie: 'Movie',
  book: 'Book',
  game: 'Game',
  music: 'Music',
};

const IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800';

const unwrapItems = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const unwrapTotal = (payload, fallbackLength) => {
  const direct = payload?.data?.totalItems ?? payload?.totalItems;
  return typeof direct === 'number' ? direct : fallbackLength;
};

const parseYear = (item) => {
  const value = item?.year || item?.releaseYear || item?.releaseDate || item?.publishedDate;
  if (!value) return null;
  const text = String(value);
  const match = text.match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
};

const parseGenres = (item) => {
  if (Array.isArray(item?.genres)) return item.genres.filter(Boolean).map((entry) => String(entry).trim());
  if (typeof item?.genres === 'string') {
    return item.genres.split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  if (typeof item?.genre === 'string') return [item.genre.trim()];
  return [];
};

const parseRating = (item) => {
  const candidate = item?.avgRating ?? item?.rating ?? item?.voteAverage ?? item?.averageRating;
  const numeric = Number(candidate);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(1)) : null;
};

const parseTitle = (item) => item?.title || item?.name || 'Untitled';

const parseMeta = (item, type) => {
  if (type === 'movie') return item?.director ? `Director: ${item.director}` : `Genre: ${parseGenres(item)[0] || 'N/A'}`;
  if (type === 'book') return item?.author ? `Author: ${item.author}` : `Genre: ${parseGenres(item)[0] || 'N/A'}`;
  if (type === 'game') return item?.developer ? `Developer: ${item.developer}` : `Genre: ${parseGenres(item)[0] || 'N/A'}`;
  return item?.artist ? `Artist: ${item.artist}` : `Genre: ${parseGenres(item)[0] || 'N/A'}`;
};

const parseImage = (item) => item?.poster || item?.cover || item?.image || item?.posterPath || IMAGE_FALLBACK;

const parseId = (item, type) => {
  if (type === 'movie') return item?.movieId ?? item?.tmdbId ?? item?.id ?? item?._id;
  if (type === 'book') return item?.isbn ?? item?.id ?? item?._id;
  if (type === 'game') return item?.gameId ?? item?.id ?? item?._id;
  return item?.trackId ?? item?.id ?? item?._id;
};

const mapMedia = (rawItems, type) => rawItems.map((item, index) => ({
  id: parseId(item, type) || `${type}-${index}`,
  type,
  typeLabel: TYPE_LABEL[type],
  title: parseTitle(item),
  rating: parseRating(item),
  meta: parseMeta(item, type),
  image: parseImage(item),
  genres: parseGenres(item),
  year: parseYear(item),
  source: item,
}));

const matchesYearBucket = (itemYear, selectedYears) => {
  if (selectedYears.length === 0) return true;
  if (!itemYear) return false;
  return selectedYears.some((bucket) => {
    if (bucket === '2020 - Present') return itemYear >= 2020;
    if (bucket === '2010 - 2019') return itemYear >= 2010 && itemYear <= 2019;
    return itemYear < 2010;
  });
};

function ExplorePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [selectedYears, setSelectedYears] = useState([]);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const fetchTokenRef = useRef(0);

  useEffect(() => {
    const urlQuery = (searchParams.get('q') || '').trim();
    const urlType = (searchParams.get('type') || '').trim().toLowerCase();

    setQuery(urlQuery);
    setAppliedQuery(urlQuery);

    if (['all', 'movies', 'books', 'games', 'music'].includes(urlType)) {
      setActiveCategory(urlType);
    } else if (!urlType) {
      setActiveCategory('all');
    }
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, appliedQuery]);

  useEffect(() => {
    const token = Date.now();
    fetchTokenRef.current = token;

    const loadData = async () => {
      const isFirstPage = page === 1;
      if (isFirstPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError('');

      try {
        let fetchedItems = [];
        let fetchedTotal = 0;

        if (activeCategory === 'all') {
          if (appliedQuery) {
            const [moviesRes, booksRes, gamesRes, musicRes] = await Promise.allSettled([
              SEARCH_REQUESTS.movies(appliedQuery),
              SEARCH_REQUESTS.books(appliedQuery),
              SEARCH_REQUESTS.games(appliedQuery),
              SEARCH_REQUESTS.music(appliedQuery),
            ]);

            if (fetchTokenRef.current !== token) return;

            const movies = moviesRes.status === 'fulfilled' ? mapMedia(unwrapItems(moviesRes.value), 'movie') : [];
            const books = booksRes.status === 'fulfilled' ? mapMedia(unwrapItems(booksRes.value), 'book') : [];
            const games = gamesRes.status === 'fulfilled' ? mapMedia(unwrapItems(gamesRes.value), 'game') : [];
            const music = musicRes.status === 'fulfilled' ? mapMedia(unwrapItems(musicRes.value), 'music') : [];

            fetchedItems = [...movies, ...books, ...games, ...music];
            fetchedTotal = fetchedItems.length;
          } else {
            const limitPerType = 4;
            const [moviesRes, booksRes, gamesRes, musicRes] = await Promise.allSettled([
              LIST_REQUESTS.movies(page, limitPerType),
              LIST_REQUESTS.books(page, limitPerType),
              LIST_REQUESTS.games(page, limitPerType),
              LIST_REQUESTS.music(page, limitPerType),
            ]);

            if (fetchTokenRef.current !== token) return;

            const moviesPayload = moviesRes.status === 'fulfilled' ? moviesRes.value : null;
            const booksPayload = booksRes.status === 'fulfilled' ? booksRes.value : null;
            const gamesPayload = gamesRes.status === 'fulfilled' ? gamesRes.value : null;
            const musicPayload = musicRes.status === 'fulfilled' ? musicRes.value : null;

            const movies = mapMedia(unwrapItems(moviesPayload), 'movie');
            const books = mapMedia(unwrapItems(booksPayload), 'book');
            const games = mapMedia(unwrapItems(gamesPayload), 'game');
            const music = mapMedia(unwrapItems(musicPayload), 'music');

            fetchedItems = [...movies, ...books, ...games, ...music];
            fetchedTotal = [
              unwrapTotal(moviesPayload, movies.length),
              unwrapTotal(booksPayload, books.length),
              unwrapTotal(gamesPayload, games.length),
              unwrapTotal(musicPayload, music.length),
            ].reduce((sum, value) => sum + value, 0);
          }
        } else {
          const typeMap = {
            movies: 'movie',
            books: 'book',
            games: 'game',
            music: 'music',
          };
          const resolvedType = typeMap[activeCategory];

          if (appliedQuery) {
            const payload = await SEARCH_REQUESTS[activeCategory](appliedQuery);
            if (fetchTokenRef.current !== token) return;

            fetchedItems = mapMedia(unwrapItems(payload), resolvedType);
            fetchedTotal = fetchedItems.length;
          } else {
            const payload = await LIST_REQUESTS[activeCategory](page, 16);
            if (fetchTokenRef.current !== token) return;

            fetchedItems = mapMedia(unwrapItems(payload), resolvedType);
            fetchedTotal = unwrapTotal(payload, fetchedItems.length);
          }
        }

        setItems((current) => (isFirstPage ? fetchedItems : [...current, ...fetchedItems]));
        setTotalItems(fetchedTotal);
      } catch (fetchError) {
        if (fetchTokenRef.current !== token) return;
        if (page === 1) {
          setItems([]);
          setTotalItems(0);
        }
        setError(fetchError?.response?.data?.message || 'Failed to load explore content.');
      } finally {
        if (fetchTokenRef.current === token) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    loadData();
  }, [activeCategory, appliedQuery, page]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (appliedQuery) {
      nextParams.set('q', appliedQuery);
    }
    if (activeCategory !== 'all') {
      nextParams.set('type', activeCategory);
    }
    setSearchParams(nextParams, { replace: true });
  }, [activeCategory, appliedQuery, setSearchParams]);

  const availableGenres = useMemo(() => {
    const setOfGenres = new Set();
    items.forEach((item) => {
      item.genres.forEach((genre) => {
        if (genre) setOfGenres.add(genre);
      });
    });
    return ['All', ...Array.from(setOfGenres).sort((a, b) => a.localeCompare(b)).slice(0, 16)];
  }, [items]);

  const filteredItems = useMemo(() => items.filter((item) => {
    const genreMatch = activeGenre === 'All' || item.genres.includes(activeGenre);
    const ratingMatch = minRating <= 0 || (item.rating !== null && item.rating >= minRating);
    const yearMatch = matchesYearBucket(item.year, selectedYears);
    return genreMatch && ratingMatch && yearMatch;
  }), [activeGenre, items, minRating, selectedYears]);

  const canLoadMore = useMemo(() => {
    if (appliedQuery) return false;
    return items.length < totalItems;
  }, [appliedQuery, items.length, totalItems]);

  const toggleYear = (yearLabel) => {
    setSelectedYears((current) => {
      if (current.includes(yearLabel)) {
        return current.filter((entry) => entry !== yearLabel);
      }
      return [...current, yearLabel];
    });
  };

  const handleBrowseSearch = (e) => {
    e.preventDefault();
    setAppliedQuery(query.trim());
    setPage(1);
  };

  const handleAiRecommend = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      navigate('/recommend');
      return;
    }
    navigate(`/recommend?query=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg font-body text-light-text dark:text-dark-text antialiased transition-colors duration-300">
      <main className="mx-auto max-w-screen-2xl px-8 pb-24 pt-16">
        <header className="mb-16 space-y-4 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface dark:text-white md:text-6xl">
            Explore Everything
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-medium text-light-text dark:text-dark-text/95 dark:text-white/70 opacity-90">
            A curated universe of movies, literature, soundscapes, and interactive worlds.
            Discover your next obsession through the lens of Vibefy.
          </p>
        </header>

        <div className="mx-auto mb-4 max-w-6xl">
          <form onSubmit={handleBrowseSearch} className="flex flex-col gap-3 lg:flex-row">
            <div className="flex flex-1 items-center rounded-lg border border-surface-container bg-white dark:bg-slate-900 px-6 py-4 shadow-md dark:shadow-dark-md transition-all focus-within:ring-2 focus-within:ring-primary/20">
              <Search size={18} className="mr-3 text-on-surface/60 dark:text-white/60" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search across all categories..."
                className="w-full border-none bg-transparent font-medium text-on-surface dark:text-white placeholder:text-on-surface/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-0"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="ml-2 text-on-surface/50 hover:text-on-surface dark:text-white/60 dark:hover:text-white transition-colors duration-200"
                  aria-label="Clear search"
                >
                  ×
                </button>
              ) : null}
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg border border-primary/30 bg-surface-container-low px-6 py-4 text-sm font-semibold text-primary transition-all duration-200 hover:bg-surface-container-high active:scale-95"
            >
              Search
            </button>

            <button
              type="button"
              onClick={handleAiRecommend}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-4 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.01] active:scale-95"
            >
              <Sparkles size={16} />
              AI Recommend
            </button>
          </form>
        </div>

        <div className="mx-auto mb-12 max-w-6xl text-center">
          <p className="text-sm text-light-text dark:text-dark-text/80">
            Use
            <span className="font-semibold text-primary"> Search </span>
            for regular browsing, or
            <span className="font-semibold text-primary"> AI Recommend </span>
            for natural-language recommendations.
          </p>
        </div>

        <div className="mb-16 flex justify-center">
          <div className="hide-scrollbar flex items-center gap-1 overflow-x-auto rounded-full bg-surface-container-low p-1.5">
            {CATEGORY_TABS.map((tab) => {
              const isActive = tab.key === activeCategory;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveCategory(tab.key)}
                  className={[
                    'rounded-full px-8 py-2.5 text-sm transition-all active:scale-95',
                    isActive
                      ? 'bg-primary font-semibold text-on-primary shadow-md'
                      : 'font-medium text-light-text dark:text-dark-text/95 hover:bg-surface-container-highest',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-12 lg:flex-row">
          <aside className="w-full space-y-10 lg:w-64">
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface/60">Genre</h3>
              <div className="flex flex-wrap gap-2">
                {availableGenres.map((chip) => {
                  const active = chip === activeGenre;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setActiveGenre(chip)}
                      className={[
                        'rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                        active
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-surface-container-highest text-light-text dark:text-dark-text/95 hover:bg-secondary-container hover:text-on-secondary-container',
                      ].join(' ')}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface/60">Min. Rating</h3>
                <span className="font-bold text-primary">{minRating.toFixed(1)}+</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={minRating}
                onChange={(event) => setMinRating(Number(event.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-highest accent-primary"
              />
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface/60">Year</h3>
              <div className="space-y-3">
                {YEAR_OPTIONS.map((year) => {
                  const checked = selectedYears.includes(year);
                  return (
                    <label key={year} className="group flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleYear(year)}
                        className="sr-only"
                      />
                      <div
                        className={[
                          'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                          checked ? 'border-primary bg-primary/10' : 'border-outline-variant group-hover:border-primary',
                        ].join(' ')}
                      >
                        {checked ? <span className="text-xs font-bold text-primary">✓</span> : null}
                      </div>
                      <span className="text-sm font-medium text-light-text dark:text-dark-text/95">{year}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {error ? (
              <div className="rounded-lg border border-error/20 bg-error/5 px-5 py-4 text-sm font-medium text-error">
                {error}
              </div>
            ) : null}

            {!loading && filteredItems.length === 0 ? (
              <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-6 py-16 text-center text-light-text dark:text-dark-text/95">
                No results found for the selected filters.
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <article
                  key={`${item.type}-${item.id}`}
                  className="group overflow-hidden rounded-lg bg-surface-container-lowest shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)] transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="relative aspect-[2/3]">
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-tighter text-primary backdrop-blur">
                      {item.typeLabel}
                    </div>
                  </div>
                  <div className="space-y-2 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="truncate pr-2 font-bold text-on-surface dark:text-white">{item.title}</h4>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="fill-primary text-primary" />
                        <span className="text-xs font-bold text-on-surface dark:text-white">
                          {item.rating?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-light-text dark:text-dark-text/95">{item.meta}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-20 text-center">
              <button
                type="button"
                disabled={!canLoadMore || loadingMore}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-primary/10 bg-surface-container-low px-10 py-4 font-bold text-primary transition-all hover:bg-surface-container-high active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Show More Discoveries'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ExplorePage;