import React, { useCallback, useEffect, useRef, useState } from 'react';
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

export default function RecommendationPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const lastAutoQueryRef = useRef('');
  const toastApi = useToast();

  const runSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setError('Please enter a query.');
      toastApi.show({ message: 'Please enter what you want to discover', type: 'info' });
      setData(null);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const loadingToastId = toastApi.showLoading({ message: 'Generating recommendations...' });
      const result = await analyzeQuery(searchQuery, 5);
      setData(result);
      toastApi.update({ id: loadingToastId, message: 'Recommendations ready', type: 'success' });
      if (!result?.results?.length) {
        toastApi.show({ message: 'No recommendations found', type: 'info' });
      }
    } catch (err) {
      const message = handleApiError(err, 'Failed to generate recommendations');
      setError(message);
      setData(null);
      toastApi.show({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toastApi]);

  useEffect(() => {
    const incomingQuery = (searchParams.get('query') || '').trim();

    if (!incomingQuery) return;
    if (incomingQuery === lastAutoQueryRef.current) return;

    lastAutoQueryRef.current = incomingQuery;
    setQuery(incomingQuery);
    runSearch(incomingQuery);
  }, [searchParams, runSearch]);

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
    const trimmed = query.trim();
    if (!trimmed) {
      navigate('/explore');
      return;
    }
    navigate(`/explore?q=${encodeURIComponent(trimmed)}`);
  };

  const handleExampleClick = async (example) => {
    setQuery(example);
    lastAutoQueryRef.current = example;
    setSearchParams({ query: example });
    await runSearch(example);
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300">
      <main className="mx-auto max-w-6xl px-6 py-16">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface dark:text-white">
            AI Recommendation Search
          </h1>
          <p className="mt-3 text-base text-light-text dark:text-dark-text/90">
            Try natural language queries like{' '}
            <span className="font-semibold">Recommend me action movies like John Wick</span>
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-3 lg:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your recommendation query..."
            className="flex-1 rounded-lg border border-surface-container-highest bg-white dark:bg-slate-900 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
          />

          <button
            type="button"
            onClick={handleBrowseSearch}
            className="rounded-lg border border-primary/30 bg-surface-container-low px-6 py-3 font-semibold text-primary transition hover:bg-surface-container-high"
          >
            Search
          </button>

          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            {loading ? 'Searching...' : 'AI Recommend'}
          </button>
        </form>

        <div className="mb-8 flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleExampleClick(example)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {example}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mb-8 rounded-lg bg-surface-container-low px-5 py-6 shadow-sm">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Analyzing your query and preparing recommendations...
            </p>
          </div>
        ) : null}

        {data ? (
          <div className="space-y-8">
            <section className="rounded-lg bg-surface-container-low px-5 py-4 shadow-sm">
              <h2 className="mb-3 text-xl font-bold text-on-surface dark:text-white">
                Parsed Query
              </h2>
              <div className="space-y-1 text-sm">
                <p><strong>Intent:</strong> {data.intent}</p>
                <p><strong>Content Type:</strong> {data.content_types?.join(', ')}</p>
                <p><strong>Keywords:</strong> {data.keywords?.join(', ')}</p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-on-surface dark:text-white">
                Results
              </h2>

              {data.results && data.results.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {data.results.map((item, index) => (
                    <RecommendationCard
                      key={
                        item.movieId
                        || item.gameId
                        || item.isbn
                        || item.trackId
                        || index
                      }
                      item={item}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white px-5 py-6 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  No results found for this query. Try one of the example prompts above.
                </div>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}