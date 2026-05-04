import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Sparkles, Wand2, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { analyzeQuery } from '../api/endpoints';
import RecommendationCard from '../components/RecommendationCard';
import { useToast } from '../context/ToastContext';
import { handleApiError } from '../utils/handleApiError';

const EXAMPLE_QUERIES = [
  'Recommend me action movies like John Wick',
  'Best mobile strategy games',
  'Best fantasy books',
  'Best songs by Drake',
];

const CACHE_KEY = 'vibeify:lastAiRecommendation';
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export default function RecommendationPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [ageGroup, setAgeGroup] = useState('all');
  const [interestMode, setInterestMode] = useState('mixed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryQuery, setRetryQuery] = useState('');
  const [data, setData] = useState(null);
  const mountedRef = useRef(false);
  const lastAutoQueryRef = useRef('');
  const inputRef = useRef(null);
  const toastApi = useToast();

  // Helper: Save data to cache
  const saveToCache = useCallback((submittedQuery, responseData) => {
    try {
      const cacheData = {
        query: submittedQuery,
        parsedQuery: responseData,
        results: responseData?.results || [],
        timestamp: Date.now(),
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch {
      console.warn('Failed to save to sessionStorage');
    }
  }, []);

  // Helper: Clear cache
  const clearCache = useCallback(() => {
    sessionStorage.removeItem(CACHE_KEY);
  }, []);

  const sanitizeDisplayQuery = useCallback((value) => {
    if (!value) return '';

    let text = String(value);
    text = text.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/\$[a-zA-Z_][a-zA-Z0-9_]*\b/g, ' ');
    text = text.replace(/\.\*|[{}()|^\\$*+?<>]|\[|\]/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }, []);

  const runSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setError('Please enter a valid recommendation query.');
      toastApi.show({ message: 'Please enter a valid query', type: 'info' });
      setData(null);
      setRetryQuery('');
      return;
    }

    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setRetryQuery('');
      const loadingToastId = toastApi.showLoading({ message: 'Generating recommendations...' });
      const result = await analyzeQuery(searchQuery, 5, ageGroup === 'all' ? null : ageGroup, interestMode === 'mixed' ? null : interestMode);
      setData(result);
      saveToCache(searchQuery, result);
      toastApi.update({ id: loadingToastId, message: 'Recommendations ready', type: 'success' });
      if (!result?.results?.length) {
        toastApi.show({ message: 'No recommendations found', type: 'info' });
      }
    } catch (err) {
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.toLowerCase().includes('timeout') || err?.response?.status === 504;
      const message = handleApiError(err, 'Failed to generate recommendations. Please try again.');
      setError(message);
      setData(null);
      if (isTimeout) {
        setRetryQuery(searchQuery);
        toastApi.show({ message: 'AI request timed out', type: 'error' });
      } else {
        if (err?.response?.status === 400) {
          toastApi.show({ message: 'Please enter a valid query', type: 'warning' });
        } else {
          toastApi.show({ message, type: 'error' });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [ageGroup, interestMode, loading, saveToCache, toastApi]);

  // On mount, restore from cache if available
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    // Call getCachedData directly without making it a dependency
    const isCacheValid = () => {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (!cached) return false;
        const parsed = JSON.parse(cached);
        const age = Date.now() - (parsed.timestamp || 0);
        return age < CACHE_TTL;
      } catch {
        return false;
      }
    };

    const getCachedDataForRestore = () => {
      if (!isCacheValid()) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    };

    const cached = getCachedDataForRestore();
    const urlQuery = (searchParams.get('query') || '').trim();

    if (cached) {
      setQuery(cached.query);
      setData(cached.parsedQuery);
      lastAutoQueryRef.current = cached.query;
    } else if (urlQuery) {
      setQuery(urlQuery);
      lastAutoQueryRef.current = urlQuery;
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      setError('Please enter a query.');
      setData(null);
      return;
    }

    lastAutoQueryRef.current = trimmed;
    setSearchParams({ query: trimmed });
    await runSearch(trimmed);
  };

  const handleBrowseSearch = () => {
    if (loading) {
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      navigate('/explore');
      return;
    }
    navigate(`/explore?q=${encodeURIComponent(trimmed)}`);
  };

  const handleExampleClick = (example) => {
    setQuery(example);
    setError('');
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleClearResults = () => {
    setQuery('');
    setData(null);
    setError('');
    clearCache();
    inputRef.current?.focus();
  };

  const hasSearched = Boolean(data);
  const results = Array.isArray(data?.results) ? data.results : [];

  return (
    <div className="min-h-screen bg-light-bg text-light-text transition-colors duration-300 dark:bg-dark-bg dark:text-dark-text">
      <div className="absolute inset-x-0 top-0 -z-10 h-[400px] bg-[radial-gradient(circle_at_top,_rgba(108,92,231,0.16),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(114,124,245,0.2),_transparent_65%)]" />

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 md:py-16">
        <header className="mb-10 rounded-3xl border border-light-surface-alt/80 bg-light-surface/90 p-8 shadow-[0_20px_50px_-22px_rgba(86,63,201,0.25)] backdrop-blur dark:border-dark-surface-alt dark:bg-dark-surface/85">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles size={14} />
            Smart Discovery
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface dark:text-white sm:text-4xl md:text-5xl">
            AI Recommendation Search
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-light-text-secondary dark:text-dark-text-secondary sm:text-lg">
            Describe what you want, and Vibeify will recommend movies, books, music, or games for you.
          </p>
        </header>

        <section className="mb-8 rounded-3xl border border-light-surface-alt/80 bg-light-surface/95 p-4 shadow-[0_16px_40px_-24px_rgba(36,22,91,0.35)] dark:border-dark-surface-alt dark:bg-dark-surface/92 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your taste, mood, genre, artist, author, or title..."
                  className="w-full rounded-2xl border border-light-surface-alt bg-white py-3.5 pl-11 pr-4 text-sm text-on-surface shadow-sm outline-none transition-all duration-200 placeholder:text-light-text-secondary/80 focus:border-primary focus:ring-4 focus:ring-primary/15 dark:border-dark-surface-alt dark:bg-slate-900 dark:text-white dark:placeholder:text-dark-text-secondary"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Age</span>
                  <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className="ml-1 rounded-xl border bg-white py-2 px-3 text-sm outline-none dark:bg-slate-900">
                    <option value="all">All</option>
                    <option value="child">Child</option>
                    <option value="teen">Teen</option>
                    <option value="adult">Adult</option>
                  </select>
                </label>

                <label className="flex items-center gap-2">
                  <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Mode</span>
                  <select value={interestMode} onChange={(e) => setInterestMode(e.target.value)} className="ml-1 rounded-xl border bg-white py-2 px-3 text-sm outline-none dark:bg-slate-900">
                    <option value="mixed">Mixed</option>
                    <option value="popular">Popular</option>
                    <option value="niche">Niche</option>
                    <option value="highly_rated">Highly rated</option>
                    <option value="recent">Recent</option>
                  </select>
                </label>

                <div className="flex gap-3 lg:w-auto">
                  <button
                    type="button"
                    onClick={handleBrowseSearch}
                    disabled={loading}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-primary/30 bg-light-surface-alt px-5 py-3 text-sm font-semibold text-primary transition-all hover:bg-primary/10 dark:bg-dark-surface-alt disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Search
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Wand2 size={16} />
                    {loading ? 'Searching...' : 'AI Recommend'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUERIES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => handleExampleClick(example)}
                    className="rounded-full border border-primary/20 bg-light-bg/90 px-3.5 py-1.5 text-xs font-medium text-light-text-secondary transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary dark:border-primary/25 dark:bg-dark-bg/70 dark:text-dark-text-secondary"
                  >
                    {example}
                  </button>
                ))}
              </div>
              {hasSearched && (
                <button
                  type="button"
                  onClick={handleClearResults}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-300/40 bg-red-50/60 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100/60 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
                  aria-label="Clear results"
                >
                  <Trash2 size={13} />
                  Clear
                </button>
              )}
            </div>
          </form>
        </section>

        {error ? (
          <section className="mb-8 rounded-2xl border border-red-300/80 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-950/35 dark:text-red-300">
            <p>{error}</p>
            {retryQuery ? (
              <button
                type="button"
                onClick={() => runSearch(retryQuery)}
                className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900"
              >
                Retry
              </button>
            ) : null}
          </section>
        ) : null}

        {loading ? (
          <section className="mb-8 space-y-4">
            <div className="rounded-2xl border border-light-surface-alt/80 bg-light-surface/95 p-5 dark:border-dark-surface-alt dark:bg-dark-surface/90">
              <div className="h-4 w-40 animate-pulse rounded bg-light-surface-alt dark:bg-dark-surface-alt" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-light-surface-alt dark:bg-dark-surface-alt" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <article
                  key={`recommendation-skeleton-${index}`}
                  className="overflow-hidden rounded-3xl border border-light-surface-alt/80 bg-light-surface/95 p-4 shadow-sm dark:border-dark-surface-alt dark:bg-dark-surface/90"
                >
                  <div className="mb-4 h-44 animate-pulse rounded-2xl bg-light-surface-alt dark:bg-dark-surface-alt" />
                  <div className="mb-3 h-5 w-3/4 animate-pulse rounded bg-light-surface-alt dark:bg-dark-surface-alt" />
                  <div className="mb-2 h-4 w-1/2 animate-pulse rounded bg-light-surface-alt dark:bg-dark-surface-alt" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-light-surface-alt dark:bg-dark-surface-alt" />
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && !hasSearched ? (
          <section className="rounded-2xl border border-light-surface-alt/80 bg-light-surface/95 px-6 py-12 text-center shadow-sm dark:border-dark-surface-alt dark:bg-dark-surface/92">
            <h2 className="text-2xl font-bold text-on-surface dark:text-white">Start discovering with AI</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Start by typing what you want to discover.
            </p>
          </section>
        ) : null}

        {!loading && hasSearched ? (
          <div className="space-y-8">
            <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5 shadow-sm dark:border-primary/25 dark:from-primary/15 dark:via-primary/10">
              <h2 className="mb-4 text-xl font-bold text-on-surface dark:text-white">Parsed Query</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <article className="rounded-xl border border-light-surface-alt bg-light-surface/95 p-4 dark:border-dark-surface-alt dark:bg-dark-surface/90">
                  <p className="text-xs font-semibold uppercase tracking-wide text-light-text-secondary dark:text-dark-text-secondary">Intent</p>
                  <p className="mt-2 inline-flex rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
                    {data?.intent || 'N/A'}
                  </p>
                </article>

                <article className="rounded-xl border border-light-surface-alt bg-light-surface/95 p-4 dark:border-dark-surface-alt dark:bg-dark-surface/90">
                  <p className="text-xs font-semibold uppercase tracking-wide text-light-text-secondary dark:text-dark-text-secondary">Content Type</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(data?.content_types?.length ? data.content_types : ['Any']).map((contentType) => (
                      <span
                        key={contentType}
                        className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary"
                      >
                        {contentType}
                      </span>
                    ))}
                  </div>
                </article>

                <article className="rounded-xl border border-light-surface-alt bg-light-surface/95 p-4 dark:border-dark-surface-alt dark:bg-dark-surface/90 sm:col-span-2 lg:col-span-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-light-text-secondary dark:text-dark-text-secondary">Keywords</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(data?.keywords?.length ? data.keywords : ['None']).map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </article>
              </div>
            </section>

            <section>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface dark:text-white">Top Matches</h2>
                  <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {results.length > 0
                      ? `Found ${results.length} recommendations for ${data?.displayQuery || data?.cleanedQuery || sanitizeDisplayQuery(query) || 'your query'}`
                      : 'No recommendations found. Try a different query.'}
                  </p>
                </div>
              </div>

              {results.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map((item, index) => (
                    <RecommendationCard
                      key={
                        item.movieId
                        || item.gameId
                        || item.isbn
                        || item.trackId
                        || item.id
                        || index
                      }
                      item={item}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-light-surface-alt/80 bg-light-surface/95 px-6 py-10 text-center text-sm text-light-text-secondary shadow-sm dark:border-dark-surface-alt dark:bg-dark-surface/92 dark:text-dark-text-secondary">
                  No recommendations found. Try a different query.
                </div>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}