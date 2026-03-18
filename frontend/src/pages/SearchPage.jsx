import { useEffect, useMemo, useRef, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { MdClose } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';
import MediaCard from '../components/MediaCard';
import * as endpoints from '../api/endpoints';

const searchTabs = [
  { key: 'all', label: 'All' },
  { key: 'movies', label: 'Movies' },
  { key: 'books', label: 'Books' },
  { key: 'games', label: 'Games' },
  { key: 'music', label: 'Music' },
];

function SearchSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-xl bg-surface animate-pulse border-b-2 border-surface2">
          <div className="h-56 bg-surface2" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 rounded bg-surface2" />
            <div className="h-3 w-1/2 rounded bg-surface2" />
            <div className="h-3 w-1/3 rounded bg-surface2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [tabCounts, setTabCounts] = useState({ movies: 0, books: 0, games: 0, music: 0 });
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [debouncedQuery, setDebouncedQuery] = useState((searchParams.get('q') || '').trim());
  const searchDebounceRef = useRef(null);

  const endpointsMap = useMemo(
    () => ({
      movies: { fn: endpoints.searchMovies, type: 'movie' },
      books: { fn: endpoints.searchBooks, type: 'book' },
      games: { fn: endpoints.searchGames, type: 'game' },
      music: { fn: endpoints.searchMusic, type: 'music' },
    }),
    []
  );

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setType(searchParams.get('type') || 'all');
  }, [searchParams]);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      const normalizedQuery = query.trim();
      setDebouncedQuery(normalizedQuery);

      const nextParams = new URLSearchParams();
      if (normalizedQuery) {
        nextParams.set('q', normalizedQuery);
      }
      nextParams.set('type', type);
      setSearchParams(nextParams, { replace: true });
    }, 400);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [query, setSearchParams, type]);

  useEffect(() => {
    const parseItems = (payload) => payload?.data?.items ?? payload?.data ?? [];

    const fetchByActiveTab = async () => {
      if (!debouncedQuery) {
        setTabCounts({ movies: 0, books: 0, games: 0, music: 0 });
        setResults([]);
        return;
      }

      setLoading(true);

      try {
        if (type === 'all') {
          const keys = Object.keys(endpointsMap);
          const responses = await Promise.allSettled(keys.map((key) => endpointsMap[key].fn(debouncedQuery)));

          const nextBuckets = {
            movies: responses[0].status === 'fulfilled' ? parseItems(responses[0].value) : [],
            books: responses[1].status === 'fulfilled' ? parseItems(responses[1].value) : [],
            games: responses[2].status === 'fulfilled' ? parseItems(responses[2].value) : [],
            music: responses[3].status === 'fulfilled' ? parseItems(responses[3].value) : [],
          };

          setTabCounts({
            movies: nextBuckets.movies.length,
            books: nextBuckets.books.length,
            games: nextBuckets.games.length,
            music: nextBuckets.music.length,
          });

          setResults([
            ...nextBuckets.movies.map((item) => ({ ...item, __type: 'movie' })),
            ...nextBuckets.books.map((item) => ({ ...item, __type: 'book' })),
            ...nextBuckets.games.map((item) => ({ ...item, __type: 'game' })),
            ...nextBuckets.music.map((item) => ({ ...item, __type: 'music' })),
          ]);
          return;
        }

        const selected = endpointsMap[type];
        if (!selected) {
          setTabCounts({ movies: 0, books: 0, games: 0, music: 0 });
          setResults([]);
          return;
        }

        const response = await selected.fn(debouncedQuery);
        const items = parseItems(response);
        setTabCounts({
          movies: type === 'movies' ? items.length : 0,
          books: type === 'books' ? items.length : 0,
          games: type === 'games' ? items.length : 0,
          music: type === 'music' ? items.length : 0,
        });
        setResults(items.map((item) => ({ ...item, __type: selected.type })));
      } catch (error) {
        setTabCounts({ movies: 0, books: 0, games: 0, music: 0 });
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchByActiveTab();
  }, [debouncedQuery, endpointsMap, type]);

  const submitSearch = (event) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    setDebouncedQuery(normalizedQuery);

    const nextParams = new URLSearchParams();
    if (normalizedQuery) {
      nextParams.set('q', normalizedQuery);
    }
    nextParams.set('type', type);
    setSearchParams(nextParams);
  };

  const switchTab = (tabKey) => {
    setType(tabKey);
  };

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <form onSubmit={submitSearch} className="flex flex-col gap-3 rounded-2xl border border-surface2 bg-surface p-4 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              placeholder="Search across movies, books, games and music"
              className="h-12 w-full rounded-xl bg-surface2 px-4 pr-10 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition"
                aria-label="Clear search"
              >
                <MdClose size={20} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-bg transition hover:bg-primaryDark"
          >
            <FiSearch size={18} />
            Search
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-2">
          {searchTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                type === tab.key ? 'bg-primary text-bg' : 'bg-surface text-muted hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 text-sm text-muted">
          Movies ({tabCounts.movies}) | Books ({tabCounts.books}) | Games ({tabCounts.games}) | Music ({tabCounts.music})
        </div>

        <div className="mt-6">
          <p className="text-sm text-muted">
            {loading ? 'Searching...' : `Found ${results.length} results for '${query}'`}
          </p>
        </div>

        <div className="mt-8">
          {loading ? (
            <SearchSkeletons />
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-surface2 bg-surface px-6 py-16 text-center text-muted">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface2 text-primary">
                <FiSearch size={24} />
              </div>
              <p className="text-lg font-semibold text-white">No results found for '{query || 'your search'}'</p>
              <p className="mt-2 text-sm text-muted">Try different keywords, spelling, or a broader query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {results.map((item, index) => (
                <MediaCard
                  key={item._id || item.movieId || item.trackId || item.isbn || item.gameId || index}
                  item={item}
                  type={item.__type}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchPage;