import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, Bookmark, BookmarkCheck, ChevronLeft, Play, RefreshCw, Share2, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import * as endpoints from '../api/endpoints';
import { resolveImageUrl } from '../utils/imageResolver';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const TYPE_COPY = {
  movie: { label: 'Movies', explore: '/explore?type=movies' },
  book: { label: 'Books', explore: '/explore?type=books' },
  music: { label: 'Music', explore: '/explore?type=music' },
  game: { label: 'Games', explore: '/explore?type=games' },
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200';

const normalizeTypeLabel = (rawType) => {
  const typeMap = {
    movie: 'Movie',
    movies: 'Movie',
    book: 'Book',
    books: 'Book',
    music: 'Music',
    musics: 'Music',
    game: 'Game',
    games: 'Game',
  };
  if (!rawType || typeof rawType !== 'string') return 'Content';
  return typeMap[rawType.toLowerCase()] || `${rawType.charAt(0).toUpperCase()}${rawType.slice(1).toLowerCase()}`;
};

const cleanTitleForSearch = (title) => {
  if (!title || typeof title !== 'string') return '';
  let cleaned = title.trim();
  cleaned = cleaned.replace(/\s*,\s*(The|A|An)$/i, (_, article) => `${article} ${cleaned.replace(/\s*,\s*(The|A|An)$/i, '').trim()}`);
  cleaned = cleaned.replace(/[\u2018\u2019]/g, "'");
  cleaned = cleaned.replace(/[^\w\s'-]/g, ' ');
  return cleaned.replace(/\s+/g, ' ').trim();
};

const makeSearchUrl = (platform, query) => {
  const encoded = encodeURIComponent((query || '').trim().replace(/\s+/g, ' '));
  if (platform === 'youtube') return `https://www.youtube.com/results?search_query=${encoded}`;
  if (platform === 'googleBooks') return `https://www.google.com/search?tbm=bks&q=${encoded}`;
  if (platform === 'spotify') return `https://open.spotify.com/search/${encoded}`;
  return `https://www.google.com/search?q=${encoded}`;
};

const normalizeImdbId = (imdbId) => {
  if (!imdbId) return '';
  const raw = String(imdbId).trim();
  if (/^tt\d+$/i.test(raw)) return raw.toLowerCase();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return `tt${digits.padStart(7, '0')}`;
};

const getActionButtons = (item = {}, type) => {
  const title = cleanTitleForSearch(item.title || item.name || '');
  const year = item.year || item.releaseDate || '';
  const author = item.author || item.artist || item.director || '';
  const artist = item.artist || '';
  const searchTitle = title;
  const direct = {
    trailer: item.trailer || null,
    previewLink: item.previewLink || null,
    imdbId: item.imdbId || item.originalData?.imdbId || null,
  };

  if (type === 'movie') {
    const normalizedImdbId = normalizeImdbId(direct.imdbId);
    const imdbUrl = normalizedImdbId
      ? `https://www.imdb.com/title/${normalizedImdbId}`
      : makeSearchUrl('google', `${searchTitle} ${year} IMDb`);

    return [
      {
        label: 'Watch Trailer',
        url: direct.trailer || makeSearchUrl('youtube', `${searchTitle} ${year} trailer`),
        variant: 'primary',
      },
      {
        label: 'Watch Review',
        url: makeSearchUrl('youtube', `${searchTitle} ${year} movie review`),
        variant: 'secondary',
      },
      {
        label: 'IMDb Search',
        url: imdbUrl,
        variant: 'secondary',
      },
    ];
  }

  if (type === 'book') {
    return [
      {
        label: 'Read Preview',
        url: direct.previewLink || makeSearchUrl('googleBooks', `${searchTitle} ${author} preview`),
        variant: 'primary',
      },
      {
        label: 'Book Review',
        url: makeSearchUrl('youtube', `${searchTitle} ${author} book review`),
        variant: 'secondary',
      },
      {
        label: 'Google Books',
        url: makeSearchUrl('googleBooks', `${searchTitle} ${author}`),
        variant: 'secondary',
      },
    ];
  }

  if (type === 'music') {
    return [
      {
        label: 'Listen on YouTube',
        url: makeSearchUrl('youtube', `${searchTitle} ${artist}`),
        variant: 'primary',
      },
      {
        label: 'Lyrics',
        url: makeSearchUrl('google', `${searchTitle} ${artist} lyrics`),
        variant: 'secondary',
      },
      {
        label: 'Spotify Search',
        url: makeSearchUrl('spotify', `${searchTitle} ${artist}`),
        variant: 'secondary',
      },
    ];
  }

  if (type === 'game') {
    return [
      {
        label: 'Watch Trailer',
        url: direct.trailer || makeSearchUrl('youtube', `${searchTitle} game trailer`),
        variant: 'primary',
      },
      {
        label: 'Watch Gameplay',
        url: makeSearchUrl('youtube', `${searchTitle} gameplay`),
        variant: 'secondary',
      },
      {
        label: 'Game Review',
        url: makeSearchUrl('youtube', `${searchTitle} game review`),
        variant: 'secondary',
      },
    ];
  }

  return [];
};

function DetailsPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const similarSectionRef = useRef(null);

  const [item, setItem] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const toastApi = useToast();

  const typeInfo = TYPE_COPY[type] || TYPE_COPY.movie;
  const typeLabel = normalizeTypeLabel(type);

  useEffect(() => {
    const fetchData = async () => {
      if (!type || !id) {
        setError('Invalid details route');
        setLoading(false);
        setSimilarLoading(false);
        return;
      }

      setLoading(true);
      setSimilarLoading(true);
      setError('');

      try {
        const [detailResult, similarResult] = await Promise.allSettled([
          endpoints.getContentDetails(type, id),
          endpoints.getSimilarContent(type, id),
        ]);

        if (detailResult.status === 'rejected') {
          throw detailResult.reason;
        }

        const details = detailResult.value?.data || detailResult.value;
        if (!details) {
          throw new Error('Content not found');
        }

        setItem(details);
        setSimilar(similarResult.status === 'fulfilled' ? similarResult.value?.data || similarResult.value || [] : []);

        if (!authLoading && isAuthenticated) {
          try {
            const favoriteCheck = await endpoints.checkFavorite(type, id);
            setIsFavorite(favoriteCheck?.isFavorite || false);
          } catch (favError) {
            console.warn('Could not check favorite status:', favError);
            setIsFavorite(false);
          }
        } else {
          setIsFavorite(false);
        }
      } catch (err) {
        const message = err?.response?.data?.message || err?.message || 'Failed to load details';
        setError(message);
        setItem(null);
        setSimilar([]);
      } finally {
        setLoading(false);
        setSimilarLoading(false);
      }
    };

    fetchData();
  }, [id, retryCount, type, isAuthenticated, authLoading]);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: item?.title || 'Vibeify', text: item?.title || 'Vibeify content', url });
        toastApi.show({ message: 'Share link opened', type: 'success' });
        return;
      } catch (shareError) {
        if (shareError?.name !== 'AbortError') {
          console.error('Share failed:', shareError);
          toastApi.show({ message: 'Share failed', type: 'error' });
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toastApi.show({ message: 'Link copied to clipboard', type: 'success' });
    } catch (clipboardError) {
      console.error('Clipboard copy failed:', clipboardError);
      toastApi.show({ message: 'Share failed', type: 'error' });
    }
  };

  const handleToggleSaved = async () => {
    if (!item || favoriteLoading || authLoading) return;

    if (!isAuthenticated) {
      toastApi.show({ message: 'Please login to save favorites', type: 'info' });
      navigate('/login');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        await endpoints.removeFavorite(type, id);
        setIsFavorite(false);
        toastApi.show({ message: 'Removed from favorites', type: 'success' });
      } else {
        // Add to favorites
        const favoriteData = {
          itemId: id,
          itemType: type,
          title: item.title || item.name || 'Untitled',
          imageUrl: resolveImageUrl(item, type) || '',
          year: item.year || item.releaseDate || item.publishedYear || '',
          rating: item.rating || item.avgRating || item.averageRating || null,
          genre: item.genre || (item.genres && item.genres[0]) || '',
        };
        await endpoints.addFavorite(favoriteData);
        setIsFavorite(true);
        toastApi.show({ message: 'Added to favorites', type: 'success' });
      }
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || 'Failed to update favorites';

      if (status === 401 || status === 403) {
        toastApi.show({ message: 'You must be logged in to save favorites. Redirecting to login...', type: 'error' });
        setTimeout(() => navigate('/login'), 1200);
      } else {
        toastApi.show({ message, type: 'error' });
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleViewAll = () => {
    navigate(typeInfo.explore);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/explore');
    }
  };

  const scrollToSimilar = () => {
    similarSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const actionButtons = useMemo(() => getActionButtons(item || {}, type), [item, type]);

  const retry = () => setRetryCount((count) => count + 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg px-4 py-8 text-light-text dark:text-dark-text sm:px-6 lg:px-8 transition-colors duration-300">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-6 w-56 rounded-full bg-light-surface-alt dark:bg-dark-surface-alt" />
          <div className="grid gap-8 rounded-[2rem] border border-light-surface-alt bg-light-surface p-5 lg:grid-cols-[400px_minmax(0,1fr)] lg:p-7 dark:border-dark-surface-alt dark:bg-dark-surface">
            <div className="space-y-4">
              <div className="aspect-[2/3] rounded-[2rem] bg-light-surface-alt dark:bg-dark-surface-alt" />
            </div>
            <div className="space-y-4 py-2">
              <div className="h-8 w-40 rounded-full bg-light-surface-alt dark:bg-dark-surface-alt" />
              <div className="h-14 w-3/4 rounded-2xl bg-light-surface-alt dark:bg-dark-surface-alt" />
              <div className="flex gap-3 pt-4">
                <div className="h-11 w-36 rounded-full bg-light-surface-alt dark:bg-dark-surface-alt" />
                <div className="h-11 w-36 rounded-full bg-light-surface-alt dark:bg-dark-surface-alt" />
                <div className="h-11 w-36 rounded-full bg-light-surface-alt dark:bg-dark-surface-alt" />
              </div>
              <div className="space-y-3 pt-6">
                <div className="h-6 w-24 rounded-full bg-light-surface-alt dark:bg-dark-surface-alt" />
                <div className="h-20 w-full rounded-xl bg-light-surface-alt dark:bg-dark-surface-alt" />
                <div className="h-6 w-20 rounded-full bg-light-surface-alt dark:bg-dark-surface-alt" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-16 rounded-xl bg-light-surface-alt dark:bg-dark-surface-alt" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg px-4 py-8 text-light-text dark:text-dark-text sm:px-6 lg:px-8 transition-colors duration-300">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-light-surface-alt bg-light-surface px-4 py-2 text-sm font-semibold text-light-text transition hover:border-primary/30 hover:bg-primary/5 dark:border-dark-surface-alt dark:bg-dark-surface dark:text-dark-text dark:hover:bg-dark-surface-alt"
          >
            Back
          </button>

          <div className="rounded-[2rem] border border-light-surface-alt bg-light-surface p-8 text-center shadow-lg dark:border-dark-surface-alt dark:bg-dark-surface dark:text-dark-text dark:shadow-dark-lg">
            <AlertCircle className="mx-auto mb-4 text-rose-400" size={42} />
            <h1 className="text-2xl font-semibold text-light-text dark:text-dark-text">Could not load details</h1>
            <p className="mt-3 text-sm leading-7 text-light-text-secondary dark:text-dark-text-secondary">{error || 'The selected content is not available right now.'}</p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                <RefreshCw size={16} />
                Retry
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-full border border-light-surface-alt bg-light-surface px-5 py-3 text-sm font-semibold text-light-text transition hover:border-primary/30 hover:bg-primary/5 dark:border-dark-surface-alt dark:bg-dark-surface dark:text-dark-text dark:hover:bg-dark-surface-alt"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300">
      <div className="absolute inset-0 -z-10 bg-transparent dark:bg-[radial-gradient(circle_at_top,_rgba(120,80,255,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(68,56,255,0.12),_transparent_20%)]" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-full border border-light-surface-alt bg-light-surface px-4 py-2 text-sm font-semibold text-light-text transition hover:border-primary/30 hover:bg-primary/5 dark:border-dark-surface-alt dark:bg-dark-surface dark:text-dark-text dark:hover:bg-dark-surface-alt"
          >
            <ChevronLeft size={16} />
            Back
          </button>
        </div>

        {/* Main Hero Section - Split Layout */}
        <section className="rounded-[2rem] border border-light-surface-alt bg-light-surface shadow-lg dark:border-dark-surface-alt dark:bg-dark-surface dark:shadow-dark-lg backdrop-blur overflow-hidden transition-colors duration-300">
          <div className="grid gap-8 lg:grid-cols-[400px_minmax(0,1fr)]">
            {/* Left Column - Poster */}
            <div className="relative">
              <div className="aspect-[2/3] overflow-hidden rounded-l-[2rem] lg:rounded-l-[2rem] lg:rounded-r-none bg-light-surface-alt dark:bg-dark-surface-alt">
                <img
                  src={resolveImageUrl(item, type) || FALLBACK_IMAGE}
                  alt={item?.title || 'Content artwork'}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="flex flex-col justify-center p-6 lg:p-8">
              {/* Badges */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {[
                  { label: item?.rating ? `★ ${item.rating}` : null },
                  { label: item?.year || item?.releaseDate },
                  { label: item?.genre || (item?.genres && item.genres[0]) },
                  { label: typeLabel },
                ].filter(badge => badge.label).map((badge) => (
                  <span
                    key={badge.label}
                    className="rounded-full border border-light-surface-alt bg-light-surface-alt px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-light-text-secondary dark:border-dark-surface-alt dark:bg-dark-surface-alt dark:text-dark-text-secondary"
                  >
                    {badge.label}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="mb-3 text-3xl font-semibold tracking-tight text-light-text dark:text-dark-text sm:text-4xl lg:text-5xl">
                {item?.title || 'Untitled'}
              </h1>

              {/* Action Buttons */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                {actionButtons
                  .filter((button) => button.label && button.url)
                  .slice(0, 2) // Only show first 2 action buttons
                  .map((button, idx) => (
                    <button
                      key={`${button.label}-${idx}`}
                      type="button"
                      onClick={() => window.open(button.url, '_blank', 'noopener,noreferrer')}
                      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${button.variant === 'primary' ? 'bg-primary text-white shadow-lg shadow-primary/15 hover:bg-primary-dark' : 'border border-light-surface-alt bg-light-surface-alt text-light-text hover:border-primary/30 hover:bg-primary/5 dark:border-dark-surface-alt dark:bg-dark-surface-alt dark:text-dark-text dark:hover:bg-dark-surface'}`}
                    >
                      {button.label}
                    </button>
                  ))}

                <button
                  type="button"
                  onClick={handleToggleSaved}
                  disabled={favoriteLoading}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-light-surface-alt bg-light-surface-alt text-light-text transition hover:border-primary/30 hover:bg-primary/5 dark:border-dark-surface-alt dark:bg-dark-surface-alt dark:text-dark-text dark:hover:bg-dark-surface"
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorite ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-light-surface-alt bg-light-surface-alt text-light-text transition hover:border-primary/30 hover:bg-primary/5 dark:border-dark-surface-alt dark:bg-dark-surface-alt dark:text-dark-text dark:hover:bg-dark-surface"
                  aria-label="Share content"
                >
                  <Share2 size={18} />
                </button>
              </div>

              {/* Overview Section */}
              <div className="mb-6">
                <h2 className="mb-3 text-lg font-semibold text-light-text dark:text-dark-text">Overview</h2>
                <p className="text-sm leading-7 text-light-text-secondary dark:text-dark-text-secondary sm:text-base">
                  {item?.description || 'No overview available. Check similar mood suggestions below for more great recommendations.'}
                </p>
              </div>

              {/* Details Section */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-light-text dark:text-dark-text">Details</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Type', value: typeLabel || 'Content' },
                    { label: 'Genre', value: item?.genre || (item?.genres && item.genres[0]) || 'N/A' },
                    { label: 'Language', value: item?.language || 'N/A' },
                    { label: 'Rating', value: item?.rating || 'N/A' },
                    { label: 'Year', value: item?.year || item?.releaseDate || 'N/A' },
                    ...(type === 'movie'
                      ? [
                          { label: 'Director', value: item?.director || 'N/A' },
                          { label: 'Runtime', value: item?.runtime || 'N/A' },
                          { label: 'Cast', value: (item?.cast || []).slice(0, 3).join(', ') || 'N/A' },
                        ]
                      : type === 'book'
                      ? [
                          { label: 'Author', value: item?.author || 'N/A' },
                          { label: 'Publisher', value: item?.publisher || 'N/A' },
                          { label: 'Pages', value: item?.pages || 'N/A' },
                        ]
                      : type === 'music'
                      ? [
                          { label: 'Artist', value: item?.artist || 'N/A' },
                          { label: 'Album', value: item?.album || 'N/A' },
                          { label: 'Duration', value: item?.duration || 'N/A' },
                        ]
                      : type === 'game'
                      ? [
                          { label: 'Developer', value: item?.developer || 'N/A' },
                          { label: 'Platform', value: item?.platform || 'N/A' },
                          { label: 'Release Date', value: item?.releaseDate || 'N/A' },
                        ]
                      : []),
                  ].map((detail) => (
                    <div key={detail.label} className="rounded-xl border border-light-surface-alt bg-light-surface-alt p-4 dark:border-dark-surface-alt dark:bg-dark-surface-alt">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-light-text-secondary dark:text-dark-text-secondary">{detail.label}</p>
                      <p className="mt-2 text-sm font-semibold text-light-text dark:text-dark-text">{detail.value || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Similar Mood Section - Below the hero */}
        <section className="mt-10 rounded-[2rem] border border-light-surface-alt bg-light-surface p-6 shadow-lg dark:border-dark-surface-alt dark:bg-dark-surface dark:shadow-dark-lg backdrop-blur sm:p-8 transition-colors duration-300">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary/80">Similar Mood</p>
              <h2 className="mt-2 text-xl font-semibold text-light-text dark:text-dark-text sm:text-2xl">More titles with the same energy</h2>
            </div>
            <button
              type="button"
              onClick={handleViewAll}
              className="inline-flex items-center gap-2 rounded-full border border-light-surface-alt bg-light-surface-alt px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-light-text transition hover:border-primary/30 hover:bg-primary/5 dark:border-dark-surface-alt dark:bg-dark-surface-alt dark:text-dark-text dark:hover:bg-dark-surface"
            >
              Explore All
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="mt-6 flex gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-4 xl:overflow-visible xl:pb-0">
            {(similarLoading
              ? Array.from({ length: 4 }, (_, index) => ({
                  _placeholder: true,
                  id: `placeholder-${index}`,
                  title: 'Loading...',
                  metadata: 'Curated mood',
                  imageUrl: FALLBACK_IMAGE,
                }))
              : similar.slice(0, 4)).map((card) => {
              const imageUrl = card._placeholder ? FALLBACK_IMAGE : resolveImageUrl(card, card.type || type);
              const label = card._placeholder ? 'Loading...' : card.title || 'Untitled';
              const metadata = card._placeholder
                ? 'Finding matching mood'
                : [card.year, card.type?.toUpperCase(), card.genre].filter(Boolean).join(' • ');

              return (
                <button
                  key={card._id || card.id || label}
                  type="button"
                  disabled={card._placeholder}
                  onClick={() => !card._placeholder && navigate(`/details/${card.type || type}/${card._id || card.id}`)}
                  className="group min-w-[280px] shrink-0 overflow-hidden rounded-[1.75rem] border border-light-surface-alt bg-light-surface text-left transition hover:-translate-y-1 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-wait disabled:opacity-60 dark:border-dark-surface-alt dark:bg-dark-surface xl:min-w-0"
                >
                  <div className="relative overflow-hidden bg-light-surface-alt dark:bg-dark-surface-alt">
                    <img src={imageUrl} alt={label} className="h-56 w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="space-y-3 p-4">
                    <h3 className="text-sm font-semibold text-light-text dark:text-dark-text">{label}</h3>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-light-text-secondary dark:text-dark-text-secondary">{metadata}</p>
                    {!card._placeholder && (
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
                        <Sparkles size={12} />
                        Open details
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* toasts handled by global ToastProvider */}
    </div>
  );
}

export default DetailsPage;
