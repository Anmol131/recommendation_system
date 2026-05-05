import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Sparkles, Star } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as endpoints from '../api/endpoints';
import { normalizeType, typeToLabel, normalizeTypeForUI } from '../utils/typeNormalizer';
import { resolveImageUrl } from '../utils/imageResolver';
import { useToast } from '../context/ToastContext';
import { handleApiError } from '../utils/handleApiError';

const CATEGORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'movies', label: 'Movies' },
  { key: 'games', label: 'Games' },
  { key: 'music', label: 'Music' },
  { key: 'books', label: 'Books' },
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

const TMDB_MOVIE_GENRES = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const mapTmdbIdToName = (id) => TMDB_MOVIE_GENRES[Number(id)] || null;

const ensureString = (v) => (v === null || v === undefined ? null : String(v).trim());

const parseGenres = (item, type) => {
  const result = [];

  if (!item) return result;

  const push = (val) => {
    const s = ensureString(val);
    if (s) result.push(s);
  };

  // MOVIES: handle TMDB numeric ids, objects {id,name}, strings
  if (type === 'movie') {
    if (Array.isArray(item?.genres)) {
      item.genres.forEach((entry) => {
        if (entry && typeof entry === 'object') {
          push(entry.name || entry.title || entry.genre);
        } else if (entry && !Number.isNaN(Number(entry))) {
          const mapped = mapTmdbIdToName(entry);
          if (mapped) push(mapped);
        } else {
          push(entry);
        }
      });
    }

    if (Array.isArray(item?.genre_ids)) {
      item.genre_ids.forEach((id) => {
        const mapped = mapTmdbIdToName(id);
        if (mapped) push(mapped);
      });
    }

    if (typeof item?.genres === 'string' && item.genres.includes(',')) {
      item.genres.split(',').forEach((g) => push(g));
    } else if (typeof item?.genres === 'string') {
      push(item.genres);
    }

    if (typeof item?.genre === 'string') push(item.genre);
  }

  // BOOKS
  else if (type === 'book') {
    if (Array.isArray(item?.genres)) item.genres.forEach(push);
    if (Array.isArray(item?.categories)) item.categories.forEach(push);
    if (Array.isArray(item?.volumeInfo?.categories)) item.volumeInfo.categories.forEach(push);
    if (typeof item?.genre === 'string') push(item.genre);
    if (typeof item?.category === 'string') push(item.category);
  }

  // GAMES
  else if (type === 'game') {
    if (Array.isArray(item?.genres)) item.genres.forEach((g) => {
      if (g && typeof g === 'object') push(g.name || g.genre);
      else push(g);
    });
    if (Array.isArray(item?.tags)) item.tags.forEach((t) => push(t));
    if (Array.isArray(item?.categories)) item.categories.forEach((c) => push(c));
    if (typeof item?.genre === 'string') push(item.genre);
  }

  // MUSIC
  else if (type === 'music') {
    if (Array.isArray(item?.genres)) item.genres.forEach(push);
    if (Array.isArray(item?.tags)) item.tags.forEach(push);
    if (Array.isArray(item?.artistGenre)) item.artistGenre.forEach(push);
    if (typeof item?.genre === 'string') push(item.genre);
  }

  // Fallback: generic fields
  if (result.length === 0) {
    if (Array.isArray(item?.genres)) item.genres.forEach(push);
    if (typeof item?.genres === 'string') item.genres.split(',').forEach((g) => push(g));
    if (typeof item?.genre === 'string') push(item.genre);
  }

  // Deduplicate and clean
  const seen = new Set();
  const final = [];
  result.forEach((g) => {
    const s = String(g).trim();
    if (!s) return;
    // skip numeric-only entries that couldn't be mapped
    if (/^\d+$/.test(s)) return;
    if (!seen.has(s)) {
      seen.add(s);
      final.push(s);
    }
  });

  return final;
};

const parseRating = (item) => {
  const candidate = item?.avgRating ?? item?.rating ?? item?.voteAverage ?? item?.averageRating;
  const numeric = Number(candidate);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(1)) : null;
};

const parseTitle = (item) => item?.title || item?.name || 'Untitled';

const parseMeta = (item, type) => {
  if (type === 'movie') return item?.director ? `Director: ${item.director}` : `Genre: ${parseGenres(item, type)[0] || 'N/A'}`;
  if (type === 'book') return item?.author ? `Author: ${item.author}` : `Genre: ${parseGenres(item, type)[0] || 'N/A'}`;
  if (type === 'game') return item?.developer ? `Developer: ${item.developer}` : `Genre: ${parseGenres(item, type)[0] || 'N/A'}`;
  return item?.artist ? `Artist: ${item.artist}` : `Genre: ${parseGenres(item, type)[0] || 'N/A'}`;
};

const parseImage = (item, type) => resolveImageUrl(item, type);

const parseId = (item, type) => {
  if (type === 'movie') return item?.movieId ?? item?.tmdbId ?? item?.id ?? item?._id;
  if (type === 'book') return item?.isbn ?? item?.id ?? item?._id;
  if (type === 'game') return item?.gameId ?? item?.id ?? item?._id;
  return item?.trackId ?? item?.id ?? item?._id;
};

const mapMedia = (rawItems, type) => rawItems.map((item, index) => {
  const normalizedType = normalizeType(type);
  return {
    id: parseId(item, normalizedType) || `${normalizedType}-${index}`,
    type: normalizedType,
    typeLabel: typeToLabel(normalizedType),
    title: parseTitle(item),
    rating: parseRating(item),
    meta: parseMeta(item, normalizedType),
    image: parseImage(item, normalizedType),
    genres: parseGenres(item, normalizedType),
    year: parseYear(item),
    source: item,
  };
});

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

  // searchInput: draft state for the input field (allows normal editing/backspace)
  const [searchInput, setSearchInput] = useState('');
  // appliedQuery: the actual submitted query from URL (used for fetches)
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
  const toastApi = useToast();
  const toastApiRef = useRef(toastApi);

  const fetchTokenRef = useRef(0);

  // Keep toastApi ref updated so async functions get latest
  useEffect(() => {
    toastApiRef.current = toastApi;
  }, [toastApi]);

  // Derive selectedType from URL
  const selectedType = normalizeTypeForUI(searchParams.get("type") || "all");

  // Sync searchInput and appliedQuery from URL only (not on every keystroke)
  useEffect(() => {
    const urlQuery = (searchParams.get('q') || '').trim();
    // Sync input to URL query on page load or when URL changes
    setSearchInput(urlQuery);
    setAppliedQuery(urlQuery);
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [selectedType, appliedQuery]);

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
        
        if (selectedType === 'all') {
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
          const normalizedType = typeMap[selectedType];

          if (appliedQuery) {
            const payload = await SEARCH_REQUESTS[selectedType](appliedQuery);
            if (fetchTokenRef.current !== token) return;

            fetchedItems = mapMedia(unwrapItems(payload), normalizedType);
            fetchedTotal = fetchedItems.length;
          } else {
            const payload = await LIST_REQUESTS[selectedType](page, 16);
            if (fetchTokenRef.current !== token) return;

            fetchedItems = mapMedia(unwrapItems(payload), normalizedType);
            fetchedTotal = unwrapTotal(payload, fetchedItems.length);
          }
        }

        // Client-side filtering by type (defensive - backend should handle this)
        const displayItems = selectedType !== 'all' 
          ? fetchedItems.filter(item => normalizeType(selectedType) === item.type)
          : fetchedItems;

        setItems((current) => (isFirstPage ? displayItems : [...current, ...displayItems]));
        setTotalItems(fetchedTotal);

        if (appliedQuery && page === 1) {
          if (displayItems.length === 0) {
            toastApiRef.current.show({ message: 'No results found', type: 'info', toastId: 'explore-no-results' });
          } else {
            toastApiRef.current.show({ message: 'Search completed', type: 'success', toastId: 'explore-search-completed' });
          }
        }
      } catch (fetchError) {
        if (fetchTokenRef.current !== token) return;
        if (page === 1) {
          setItems([]);
          setTotalItems(0);
        }
        const message = handleApiError(fetchError, 'Failed to load explore content.');
        setError(message);
        toastApiRef.current.show({ message, type: 'error', toastId: 'explore-fetch-error' });
      } finally {
        if (fetchTokenRef.current === token) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    loadData();
  }, [selectedType, appliedQuery, page]);

  const availableGenres = useMemo(() => {
    const setOfGenres = new Set();
    
    // Filter items by type if a specific type is selected
    const itemsToUse = selectedType !== 'all' 
      ? items.filter(item => normalizeType(selectedType) === item.type)
      : items;
    
    itemsToUse.forEach((item) => {
      item.genres.forEach((genre) => {
        if (genre) setOfGenres.add(genre);
      });
    });
    
    const genres = ['All', ...Array.from(setOfGenres).sort((a, b) => a.localeCompare(b)).slice(0, 16)];
    return genres;
  }, [items, selectedType]);

  const filteredItems = useMemo(() => {
    let result = items;
    
    // Filter by type
    if (selectedType !== 'all') {
      const normalizedCategory = normalizeType(selectedType);
      result = result.filter(item => item.type === normalizedCategory);
    }
    
    // Filter by genre, rating, year
    result = result.filter((item) => {
      const genreMatch = activeGenre === 'All' || item.genres.includes(activeGenre);
      const ratingMatch = minRating <= 0 || (item.rating !== null && item.rating >= minRating);
      const yearMatch = matchesYearBucket(item.year, selectedYears);
      return genreMatch && ratingMatch && yearMatch;
    });
    return result;
  }, [activeGenre, items, minRating, selectedYears, selectedType]);

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
    const trimmed = searchInput.trim();
    
    const params = new URLSearchParams(searchParams);
    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }
    
    setSearchParams(params);
    
    if (trimmed) {
      toastApiRef.current.show({ message: 'Search started', type: 'info', toastId: 'explore-search-started' });
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    setSearchParams(params);
  };

  const handleAiRecommend = () => {
    const trimmed = searchInput.trim();
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
          <p className="mx-auto max-w-2xl text-lg font-medium text-light-text dark:text-dark-text/95 opacity-90">
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
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search across all categories..."
                className="w-full border-none bg-transparent font-medium text-on-surface dark:text-white placeholder:text-on-surface/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-0"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
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
              const isActive = tab.key === selectedType;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    if (tab.key === 'all') {
                      newParams.delete('type');
                    } else {
                      newParams.set('type', tab.key);
                    }
                    setSearchParams(newParams);
                  }}
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
                  className="group overflow-hidden rounded-lg bg-surface-container-lowest shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_24px_50px_-12px_rgba(62,37,72,0.14)]"
                  onClick={() => navigate(`/details/${item.type}/${item.id}`)}
                  style={{ cursor: 'pointer' }}
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
