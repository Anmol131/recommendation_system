import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, MapPin, Play, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import * as endpoints from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1600';

const getList = (payload) => {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const normalizeGenres = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/[|,]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const formatRating = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(1) : 'N/A';
};

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-surface text-on-surface animate-pulse">
      <div className="sticky top-0 z-50 h-20 bg-white/70 backdrop-blur-xl shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)]" />
      <div className="h-[78vh] bg-surface-container-high" />
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-8 py-16 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
          <div className="h-8 w-52 rounded bg-surface-container-highest" />
          <div className="h-28 rounded bg-surface-container-highest" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 rounded-xl bg-surface-container-highest" />
            ))}
          </div>
        </div>
        <div className="md:col-span-4 space-y-5">
          <div className="h-48 rounded-2xl bg-surface-container-highest" />
          <div className="h-24 rounded-2xl bg-surface-container-highest" />
        </div>
      </div>
    </div>
  );
}

function FriendlyError() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface px-6 py-20 text-on-surface">
      <div className="mx-auto max-w-2xl rounded-2xl bg-surface-container-low p-8 text-center shadow-[0_25px_55px_-26px_rgba(62,37,72,0.28)]">
        <h1 className="text-3xl font-bold tracking-tight">Book not available right now</h1>
        <p className="mt-3 text-on-surface-variant">
          We could not load this book at the moment. Try going back and opening another title.
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary shadow-[0_20px_35px_-20px_rgba(131,25,218,0.7)]"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    </div>
  );
}

function BookDetailPage() {
  const navigate = useNavigate();
  const { isbn, id } = useParams();
  const { isAuthenticated } = useAuth();
  const lookupId = isbn || id;

  const [item, setItem] = useState(null);
  const [similarItems, setSimilarItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadPage = async () => {
      setLoading(true);
      setError('');

      try {
        const [detail, similar] = await Promise.all([
          endpoints.getBookByIsbn(lookupId),
          endpoints.getBooks({ limit: 4, sort: 'rating' }),
        ]);

        if (cancelled) return;

        const book = detail?.data || detail;
        const similarList = getList(similar)
          .filter((entry) => String(entry?.isbn || entry?._id) !== String(book?.isbn || book?._id))
          .slice(0, 4);

        setItem(book || null);
        setSimilarItems(similarList);
      } catch {
        if (!cancelled) setError('load-failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (lookupId) {
      loadPage();
    } else {
      setLoading(false);
      setError('missing-id');
    }

    return () => {
      cancelled = true;
    };
  }, [lookupId]);

  useEffect(() => {
    if (!lookupId || !isAuthenticated) return;
    endpoints.addHistory('book', lookupId, 'viewed').catch(() => {});
  }, [lookupId, isAuthenticated]);

  const genres = useMemo(() => normalizeGenres(item?.genres || item?.genre), [item]);

  if (loading) return <DetailSkeleton />;
  if (error || !item) return <FriendlyError />;

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <main>
        <section className="relative h-[86vh] min-h-[680px] w-full overflow-hidden bg-surface-container-lowest">
          <div className="absolute inset-0 z-0">
            <img src={item.cover || FALLBACK_IMAGE} alt={item.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 shadow-[inset_0_-120px_100px_-20px_rgba(62,37,72,0.9)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
          </div>

          <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-8 pb-24">
            <div className="max-w-3xl space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold uppercase tracking-widest text-on-secondary-container">
                  {genres[0] || 'Fiction'}
                </span>
                <div className="flex items-center gap-1 text-tertiary-fixed-dim">
                  <Star size={14} className="fill-current" />
                  <span className="text-sm font-bold">{formatRating(item.avgRating)} Rating</span>
                </div>
                <span className="text-sm font-medium text-white/80">{item.pageCount ? `${item.pageCount}pg` : 'Pages N/A'}</span>
              </div>

              <h1 className="text-5xl font-bold leading-[0.9] tracking-tighter text-white drop-shadow-2xl sm:text-7xl">
                {item.title}
              </h1>

              <p className="max-w-xl text-lg font-medium leading-relaxed text-white/90">
                {item.description || 'No synopsis is available for this book yet.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <button
                  type="button"
                  className="inline-flex items-center gap-3 rounded-lg bg-gradient-to-br from-primary to-primary-container px-8 py-4 text-lg font-bold text-on-primary shadow-xl transition-all hover:scale-105"
                >
                  <Play size={18} />
                  Read Sample
                </button>
                <a
                  href={`https://www.amazon.com/s?k=${encodeURIComponent(item.title || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 rounded-lg bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-xl transition-all hover:bg-white/20"
                >
                  <MapPin size={18} />
                  Find This Book
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-16 px-8 py-24 md:grid-cols-12">
          <div className="space-y-12 md:col-span-8">
            <div>
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold tracking-tight">
                <span className="h-[2px] w-12 bg-primary" />
                Storyline
              </h2>
              <p className="text-xl leading-relaxed text-on-surface-variant">
                {item.description || 'No description is available for this book yet.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-3">
              <div className="space-y-2 rounded-xl bg-surface-container-low p-6 shadow-[0_16px_35px_-24px_rgba(62,37,72,0.3)]">
                <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Author</span>
                <p className="text-lg font-bold">{item.author || 'Unknown'}</p>
              </div>
              <div className="space-y-2 rounded-xl bg-surface-container-low p-6 shadow-[0_16px_35px_-24px_rgba(62,37,72,0.3)]">
                <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Publisher</span>
                <p className="text-lg font-bold">{item.publisher || 'Not listed'}</p>
              </div>
              <div className="space-y-2 rounded-xl bg-surface-container-low p-6 shadow-[0_16px_35px_-24px_rgba(62,37,72,0.3)]">
                <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Year</span>
                <p className="text-lg font-bold">{item.year || 'N/A'}</p>
              </div>
            </div>
          </div>

          <aside className="space-y-8 md:col-span-4">
            <div className="space-y-6 rounded-2xl bg-surface-container-highest p-8 shadow-[0_20px_45px_-28px_rgba(62,37,72,0.4)]">
              <h3 className="text-xl font-bold">Where to Find</h3>
              <div className="space-y-4">
                <a
                  href={`https://www.amazon.com/s?k=${encodeURIComponent(item.title || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-lg bg-surface-container-lowest p-4 shadow-[0_12px_24px_-20px_rgba(62,37,72,0.35)]"
                >
                  <span className="font-semibold transition-colors group-hover:text-primary">Amazon</span>
                  <ExternalLink size={14} className="text-on-surface-variant" />
                </a>
                <a
                  href={`https://www.goodreads.com/search?q=${encodeURIComponent(item.title || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-lg bg-surface-container-lowest p-4 shadow-[0_12px_24px_-20px_rgba(62,37,72,0.35)]"
                >
                  <span className="font-semibold transition-colors group-hover:text-primary">Goodreads</span>
                  <ExternalLink size={14} className="text-on-surface-variant" />
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant/60">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {genres.length > 0 ? genres.map((genre) => (
                  <span key={genre} className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-medium">
                    {genre}
                  </span>
                )) : (
                  <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-medium">Fiction</span>
                )}
              </div>
            </div>
          </aside>
        </section>

        <section className="bg-surface-container-low py-24">
          <div className="mx-auto max-w-[1440px] px-8">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="mb-2 text-4xl font-bold leading-none tracking-tighter">Similar Discoveries</h2>
                <p className="font-medium text-on-surface-variant">Curated based on your reading taste.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/books')}
                className="group flex items-center gap-2 font-bold text-primary transition-all hover:gap-4"
              >
                Explore Full Library
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {similarItems.map((similar) => (
                <button
                  key={similar.isbn || similar._id}
                  type="button"
                  onClick={() => navigate(`/books/${similar.isbn || similar._id}`)}
                  className="group text-left"
                >
                  <div className="relative mb-4 aspect-[2/3] overflow-hidden rounded-xl shadow-lg transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl">
                    <img src={similar.cover || FALLBACK_IMAGE} alt={similar.title} className="h-full w-full object-cover" />
                    <div className="absolute right-4 top-4 rounded-md bg-surface/80 px-2 py-1 text-[10px] font-bold backdrop-blur-md">
                      {formatRating(similar.avgRating)}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold transition-colors group-hover:text-primary">{similar.title}</h3>
                  <p className="text-sm text-on-surface-variant">{similar.year || 'N/A'} • {(normalizeGenres(similar.genres)[0] || 'Book')}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full bg-[#f5f0f7] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 md:flex-row">
          <div className="flex flex-col items-center gap-1 md:items-start">
            <span className="text-lg font-semibold text-on-background">Vibeify</span>
            <p className="text-xs text-on-background/60">© 2024 Vibeify. The Digital Curator.</p>
          </div>
          <div className="flex gap-8">
            <button type="button" className="text-xs text-on-background/60 transition-colors hover:text-primary">Privacy</button>
            <button type="button" className="text-xs text-on-background/60 transition-colors hover:text-primary">Terms</button>
            <button type="button" className="text-xs text-on-background/60 transition-colors hover:text-primary">Feedback</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default BookDetailPage;
