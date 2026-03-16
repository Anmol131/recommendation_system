import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MdClose } from 'react-icons/md';
import MediaCard from '../components/MediaCard';
import * as endpoints from '../api/endpoints';

const GENRE_OPTIONS = {
  movies: ['Action', 'Comedy', 'Drama', 'Thriller', 'Sci-Fi', 'Horror', 'Romance', 'Animation', 'Documentary', 'Fantasy', 'Crime', 'Adventure'],
  books: ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'History', 'Self-Help', 'Thriller', 'Children'],
  games: ['Action', 'RPG', 'Strategy', 'Sports', 'Racing', 'Adventure', 'Puzzle', 'Simulation', 'Fighting', 'Shooter', 'Casual', 'Arcade'],
  music: ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Jazz', 'Classical', 'Country', 'Latin', 'Indie', 'Metal', 'Folk'],
};

const MUSIC_GENRE_MAP = {
  Pop: 'pop',
  Rock: 'rock',
  'Hip-Hop': 'hip-hop',
  'R&B': 'r-b',
  Electronic: 'electronic',
  Jazz: 'jazz',
  Classical: 'classical',
  Country: 'country',
  Latin: 'latin',
  Indie: 'indie',
  Metal: 'metal',
  Folk: 'folk',
};

const toMusicGenreValue = (genre) => {
  const directMatch = MUSIC_GENRE_MAP[genre];
  if (directMatch) {
    return directMatch;
  }

  // Handle mixed/case-variant labels from URL or user state.
  const matchedKey = Object.keys(MUSIC_GENRE_MAP).find(
    (key) => key.toLowerCase() === String(genre || '').toLowerCase()
  );
  if (matchedKey) {
    return MUSIC_GENRE_MAP[matchedKey];
  }

  return String(genre || '').toLowerCase();
};

const typeConfig = {
  movies: {
    label: 'Movies',
    cardType: 'movie',
    getList: endpoints.getMovies,
    sortOptions: ['rating', 'year'],
  },
  books: {
    label: 'Books',
    cardType: 'book',
    getList: endpoints.getBooks,
    sortOptions: ['rating', 'year'],
  },
  games: {
    label: 'Games',
    cardType: 'game',
    getList: endpoints.getGames,
    sortOptions: ['rating', 'popularity'],
  },
  music: {
    label: 'Music',
    cardType: 'music',
    getList: endpoints.getMusic,
    sortOptions: ['popularity'],
  },
};

const defaultFilters = {
  genres: [],
  sortBy: 'rating',
  platform: '',
  page: 1,
};

const parseGenreParam = (value) => {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((genre) => genre.trim())
    .filter(Boolean);
};

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-xl bg-surface animate-pulse">
          <div className="h-56 bg-surface2" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 rounded bg-surface2" />
            <div className="h-3 w-1/2 rounded bg-surface2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentType = searchParams.get('type') || 'movies';
  const safeType = typeConfig[currentType] ? currentType : 'movies';
  const config = typeConfig[safeType];
  const [filters, setFilters] = useState({
    genres: parseGenreParam(searchParams.get('genre')),
    sortBy: searchParams.get('sortBy') || (safeType === 'music' ? 'popularity' : defaultFilters.sortBy),
    platform: searchParams.get('platform') || defaultFilters.platform,
    page: Number(searchParams.get('page') || defaultFilters.page),
  });
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const currentGenreOptions = useMemo(() => GENRE_OPTIONS[safeType] || [], [safeType]);

  useEffect(() => {
    setFilters({
      genres: parseGenreParam(searchParams.get('genre')),
      sortBy: searchParams.get('sortBy') || (safeType === 'music' ? 'popularity' : 'rating'),
      platform: searchParams.get('platform') || '',
      page: Number(searchParams.get('page') || 1),
    });
  }, [searchParams, safeType]);

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);

      try {
        const params = {
          page: filters.page,
          limit: 12,
        };

        if (filters.genres.length > 0) {
          const mappedGenres = safeType === 'music'
            ? filters.genres.map(toMusicGenreValue)
            : filters.genres;
          params.genre = mappedGenres.join(',');
        }

        if (filters.sortBy) {
          params.sortBy = filters.sortBy;
        }

        if (safeType === 'games' && filters.platform) {
          params.platform = filters.platform;
        }

        const response = await config.getList(params);
        setItems(response.data.items || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.totalItems || 0);
      } catch (error) {
        setItems([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [config, filters, safeType]);

  const updateParams = (nextFilters, nextType = safeType) => {
    const params = new URLSearchParams();
    params.set('type', nextType);

    if (nextFilters.genres.length > 0) {
      params.set('genre', nextFilters.genres.join(','));
    }
    if (nextFilters.sortBy) {
      params.set('sortBy', nextFilters.sortBy);
    }
    if (nextFilters.platform && nextType === 'games') {
      params.set('platform', nextFilters.platform);
    }
    if (nextFilters.page > 1) {
      params.set('page', String(nextFilters.page));
    }

    setSearchParams(params);
  };

  const applyFilters = () => {
    updateParams({ ...filters, page: 1 });
  };

  const resetFilters = () => {
    const nextFilters = {
      genres: [],
      sortBy: safeType === 'music' ? 'popularity' : 'rating',
      platform: '',
      page: 1,
    };
    setFilters(nextFilters);
    updateParams(nextFilters);
  };

  const changePage = (page) => {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    updateParams(nextFilters);
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).slice(
    Math.max(filters.page - 3, 0),
    Math.max(filters.page - 3, 0) + 5
  );

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-10">
      <div className="grid gap-8 lg:grid-cols-[250px,1fr]">
        <aside className="h-fit rounded-2xl border border-surface2 bg-surface p-5 lg:sticky lg:top-36">
          <h2 className="text-xl font-semibold text-white">Filters</h2>

          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium text-muted">Type</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(typeConfig).map(([typeKey, value]) => (
                <button
                  key={typeKey}
                  onClick={() => {
                    const nextFilters = {
                      genres: [],
                      sortBy: typeKey === 'music' ? 'popularity' : 'rating',
                      platform: '',
                      page: 1,
                    };
                    setFilters(nextFilters);
                    updateParams(nextFilters, typeKey);
                  }}
                  className={`rounded-full px-3 py-2 text-sm transition ${
                    safeType === typeKey ? 'bg-primary text-bg' : 'bg-surface2 text-muted hover:text-white'
                  }`}
                >
                  {value.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-muted">Genre</label>
            <div className="flex flex-wrap gap-2">
              {currentGenreOptions.map((genre) => (
                <button
                  key={genre}
                  onClick={() => {
                    setFilters((current) => {
                      const exists = current.genres.includes(genre);
                      const nextGenres = exists
                        ? current.genres.filter((value) => value !== genre)
                        : [...current.genres, genre];
                      return { ...current, genres: nextGenres };
                    });
                  }}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    filters.genres.includes(genre)
                      ? 'border-primary bg-primary text-bg'
                      : 'border-surface2 text-muted hover:border-primary hover:text-primary'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            {filters.genres.length > 0 && (
              <div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {filters.genres.map((genre) => (
                    <span
                      key={genre}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-xs text-primary"
                    >
                      {genre}
                      <button
                        type="button"
                        onClick={() => {
                          setFilters((current) => ({
                            ...current,
                            genres: current.genres.filter((value) => value !== genre),
                          }));
                        }}
                        className="text-primary hover:text-white"
                      >
                        <MdClose size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setFilters((current) => ({ ...current, genres: [] }))}
                  className="mt-3 text-xs font-medium text-muted hover:text-white"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium text-muted">Sort by</p>
            <div className="space-y-2">
              {['rating', 'year', 'popularity'].filter((option) => config.sortOptions.includes(option)).map((option) => (
                <label key={option} className="flex items-center gap-3 text-sm text-white">
                  <input
                    type="radio"
                    name="sortBy"
                    checked={filters.sortBy === option}
                    onChange={() => setFilters((current) => ({ ...current, sortBy: option }))}
                    className="accent-primary"
                  />
                  <span className="capitalize">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {safeType === 'games' && (
            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium text-muted">Platform</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilters((current) => ({ ...current, platform: '' }))}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    filters.platform === '' ? 'bg-primary text-bg' : 'bg-surface2 text-muted hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilters((current) => ({ ...current, platform: 'pc' }))}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    filters.platform === 'pc'
                      ? 'text-white'
                      : 'bg-surface2 text-muted hover:text-white'
                  }`}
                  style={{ backgroundColor: filters.platform === 'pc' ? '#3B82F6' : undefined }}
                >
                  🖥️ PC
                </button>
                <button
                  onClick={() => setFilters((current) => ({ ...current, platform: 'mobile' }))}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    filters.platform === 'mobile'
                      ? 'text-white'
                      : 'bg-surface2 text-muted hover:text-white'
                  }`}
                  style={{ backgroundColor: filters.platform === 'mobile' ? '#10B981' : undefined }}
                >
                  📱 Mobile
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-3">
            <button
              onClick={applyFilters}
              className="rounded-xl bg-primary px-4 py-3 font-semibold text-bg transition hover:bg-primaryDark"
            >
              Apply filters
            </button>
            <button
              onClick={resetFilters}
              className="rounded-xl border border-surface2 px-4 py-3 font-medium text-muted transition hover:border-primary hover:text-white"
            >
              Reset
            </button>
          </div>
        </aside>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Browse {config.label}</h1>
              <p className="mt-2 text-sm text-muted">{loading ? 'Loading results...' : `${totalItems} results found`}</p>
            </div>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {items.map((item, index) => (
                  <MediaCard
                    key={item._id || item.movieId || item.trackId || item.isbn || item.gameId || index}
                    item={item}
                    type={config.cardType}
                  />
                ))}
              </div>

              {items.length === 0 && (
                <div className="rounded-2xl border border-dashed border-surface2 bg-surface px-6 py-16 text-center text-muted">
                  No items matched the current filters.
                </div>
              )}
            </>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-2">
            <button
              onClick={() => changePage(Math.max(filters.page - 1, 1))}
              disabled={filters.page === 1}
              className="rounded-lg border border-surface2 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => changePage(page)}
                className={`rounded-lg px-4 py-2 text-sm ${
                  filters.page === page ? 'bg-primary text-bg' : 'border border-surface2 text-white'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => changePage(Math.min(filters.page + 1, totalPages))}
              disabled={filters.page === totalPages}
              className="rounded-lg border border-surface2 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default BrowsePage;