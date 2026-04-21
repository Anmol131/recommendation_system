import React, { useState } from 'react';
import { analyzeQuery } from '../api/endpoints';
import RecommendationCard from '../components/RecommendationCard';

export default function RecommendationPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Please enter a query.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await analyzeQuery(query, 5);
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Something went wrong.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300">
      <main className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface dark:text-white">
            AI Recommendation Search
          </h1>
          <p className="mt-3 text-base text-light-text dark:text-dark-text/90">
            Try natural language queries like:
            {' '}
            <span className="font-semibold">Recommend me action movies like John Wick</span>
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your recommendation query..."
            className="flex-1 rounded-lg border border-surface-container-highest bg-white dark:bg-slate-900 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error}
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
                <p>No results found.</p>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}