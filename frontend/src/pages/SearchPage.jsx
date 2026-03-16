import { useEffect, useMemo, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { MdClose } from 'react-icons/md';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const emptyBuckets = {
  movies: [],
  books: [],
  games: [],
  music: [],
};

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [resultBuckets, setResultBuckets] = useState(emptyBuckets);
  const [tabCounts, setTabCounts] = useState({ movies: 0, books: 0, games: 0, music: 0 });
  const activeTab = searchParams.get('type') || 'all';
  const searchQuery = searchParams.get('q') || '';

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
    setQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const fetchAllResults = async () => {
      if (!searchQuery.trim()) {
        setResultBuckets(emptyBuckets);
        setTabCounts({ movies: 0, books: 0, games: 0, music: 0 });
        setResults([]);
        return;
      }

      setLoading(true);

      try {
        const responses = await Promise.allSettled([
          endpoints.searchMovies(searchQuery),
          endpoints.searchBooks(searchQuery),
          endpoints.searchGames(searchQuery),
          endpoints.searchMusic(searchQuery),
        ]);

        const nextBuckets = {
          movies: responses[0].status === 'fulfilled' ? responses[0].value.data?.items ?? responses[0].value.data ?? [] : [],
          books: responses[1].status === 'fulfilled' ? responses[1].value.data?.items ?? responses[1].value.data ?? [] : [],
          games: responses[2].status === 'fulfilled' ? responses[2].value.data?.items ?? responses[2].value.data ?? [] : [],
          music: responses[3].status === 'fulfilled' ? responses[3].value.data?.items ?? responses[3].value.data ?? [] : [],
        };

        setResultBuckets(nextBuckets);
        setTabCounts({
          movies: nextBuckets.movies.length,
          books: nextBuckets.books.length,
          games: nextBuckets.games.length,
          music: nextBuckets.music.length,
        });
      } catch (error) {
        setResultBuckets(emptyBuckets);
        setTabCounts({ movies: 0, books: 0, games: 0, music: 0 });
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllResults();
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === 'all') {
      const combined = [
        ...resultBuckets.movies.map((item) => ({ ...item, __type: 'movie' })),
        ...resultBuckets.books.map((item) => ({ ...item, __type: 'book' })),
        ...resultBuckets.games.map((item) => ({ ...item, __type: 'game' })),
        ...resultBuckets.music.map((item) => ({ ...item, __type: 'music' })),
      ];
      setResults(combined);
      return;
    }

    const selected = endpointsMap[activeTab];
    const bucket = resultBuckets[activeTab] || [];
    setResults(bucket.map((item) => ({ ...item, __type: selected.type })));
  }, [activeTab, endpointsMap, resultBuckets]);

  const submitSearch = (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.set('q', trimmedQuery);
    setSearchParams(params);
  };

  const switchTab = (tabKey) => {
    const params = new URLSearchParams(searchParams);
    if (tabKey === 'all') {
      params.delete('type');
    } else {
      params.set('type', tabKey);
    }
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <form onSubmit={submitSearch} className="flex flex-col gap-3 rounded-2xl border border-surface2 bg-surface p-4 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
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
                activeTab === tab.key ? 'bg-primary text-bg' : 'bg-surface text-muted hover:text-white'
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
            {loading ? 'Searching...' : `Found ${results.length} results for '${searchQuery}'`}
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
              <p className="text-lg font-semibold text-white">No results found for '{searchQuery || 'your search'}'</p>
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