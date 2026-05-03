import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  Heart,
  Share2,
  ArrowLeft,
  Loader,
  AlertCircle,
  ExternalLink,
  Zap,
  TrendingUp,
} from 'lucide-react';
import * as endpoints from '../api/endpoints';
import Toast from '../components/Toast';

const DetailsPage = () => {
  const { mediaType, id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        let result;
        switch (mediaType) {
          case 'movie':
            result = await endpoints.getMovieById(id);
            break;
          case 'book':
            result = await endpoints.getBookByIsbn(id);
            break;
          case 'game':
            result = await endpoints.getGameById(id);
            break;
          case 'music':
            result = await endpoints.getMusicByTrackId(id);
            break;
          default:
            throw new Error('Unknown media type');
        }

        setData(result?.data || result);
      } catch (err) {
        console.error('Error fetching details:', err);
        setError(err?.response?.data?.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };

    if (id && mediaType) {
      fetchDetails();
    }
  }, [id, mediaType]);

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    setToast({
      message: isFavorite ? 'Removed from favorites' : 'Added to favorites',
      type: 'success',
      visible: true,
    });
    setTimeout(() => setToast({ ...toast, visible: false }), 3000);
  };

  const handleShare = async () => {
    const shareText = `Check out this ${mediaType}: ${data?.title || 'content'}`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: data?.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setToast({
          message: 'Link copied to clipboard',
          type: 'success',
          visible: true,
        });
        setTimeout(() => setToast({ ...toast, visible: false }), 3000);
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader size={48} className="animate-spin text-primary" />
          <p className="text-light-text dark:text-dark-text">Loading details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
        <div className="container mx-auto px-4 py-10">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
          <div className="rounded-lg border border-error/20 bg-error/5 px-6 py-8 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-error" />
            <p className="mb-4 text-light-text dark:text-dark-text">{error || 'Unable to load content'}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary px-6 py-2 font-semibold text-white transition hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mediaLabel = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
  const posterImage =
    data?.poster ||
    data?.image ||
    data?.cover ||
    data?.albumArt ||
    data?.thumbnail ||
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800';
  const rating = data?.rating || data?.avgRating || data?.voteAverage || 0;
  const year = data?.year || data?.releaseYear || data?.releaseDate || data?.publishedDate || 'N/A';

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      {/* Hero Section with Gradient Overlay */}
      <div className="relative h-96 overflow-hidden md:h-[500px]">
        <img
          src={posterImage}
          alt={data?.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-light-bg via-transparent to-transparent dark:from-dark-bg" />
        <div className="absolute inset-0 bg-gradient-to-r from-light-bg via-transparent dark:from-dark-bg" />

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 z-10 rounded-full bg-black/40 p-2 text-white backdrop-blur transition hover:bg-black/60 dark:hover:bg-white/20"
        >
          <ArrowLeft size={24} />
        </button>

        {/* Badges */}
        <div className="absolute right-4 top-4 z-10 flex flex-wrap gap-2">
          {rating >= 8 && (
            <span className="rounded-full bg-yellow-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">
              <span className="flex items-center gap-1">
                <Star size={12} className="fill-current" /> Top Rated
              </span>
            </span>
          )}
          {rating >= 7.5 && (
            <span className="rounded-full bg-blue-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">
              <span className="flex items-center gap-1">
                <TrendingUp size={12} /> Popular
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Left Column - Poster Card */}
          <div className="md:col-span-1">
            <div className="sticky top-8">
              <div className="overflow-hidden rounded-xl shadow-2xl">
                <img
                  src={posterImage}
                  alt={data?.title}
                  className="aspect-[2/3] w-full object-cover"
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleToggleFavorite}
                  className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition ${
                    isFavorite
                      ? 'bg-primary/10 text-primary'
                      : 'bg-surface-container-high text-light-text dark:bg-surface-container-low dark:text-dark-text hover:bg-surface-container-highest dark:hover:bg-surface-container-highest'
                  }`}
                >
                  <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
                  {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary/90"
                >
                  <Share2 size={20} />
                  Share
                </button>
              </div>

              {/* Quick Info Box */}
              <div className="mt-6 space-y-4 rounded-lg bg-surface-container-lowest p-4 dark:bg-surface-container-low">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-light-text/60 dark:text-dark-text/60">
                    Type
                  </p>
                  <p className="mt-1 font-semibold text-light-text dark:text-dark-text">
                    {mediaLabel}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-light-text/60 dark:text-dark-text/60">
                    Year
                  </p>
                  <p className="mt-1 font-semibold text-light-text dark:text-dark-text">
                    {year}
                  </p>
                </div>

                {rating > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-light-text/60 dark:text-dark-text/60">
                      Rating
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={
                              i < Math.round(rating / 2)
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'text-light-text/20 dark:text-dark-text/20'
                            }
                          />
                        ))}
                      </div>
                      <span className="font-bold text-light-text dark:text-dark-text">
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="md:col-span-2 space-y-8">
            {/* Title Section */}
            <div>
              <h1 className="mb-3 text-4xl font-bold text-light-text dark:text-dark-text md:text-5xl">
                {data?.title}
              </h1>
              {data?.subtitle && (
                <p className="text-lg text-light-text/70 dark:text-dark-text/70">
                  {data.subtitle}
                </p>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {data?.genres && data.genres.length > 0 && (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-light-text/60 dark:text-dark-text/60">
                    Genres
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(Array.isArray(data.genres)
                      ? data.genres
                      : typeof data.genres === 'string'
                        ? data.genres.split(',')
                        : []
                    )
                      .slice(0, 5)
                      .map((genre, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                        >
                          {typeof genre === 'string' ? genre.trim() : genre}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {(data?.director || data?.author || data?.artist || data?.developer) && (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-light-text/60 dark:text-dark-text/60">
                    {data?.director ? 'Director' : data?.author ? 'Author' : data?.artist ? 'Artist' : 'Developer'}
                  </p>
                  <p className="mt-2 font-medium text-light-text dark:text-dark-text">
                    {data?.director || data?.author || data?.artist || data?.developer || 'N/A'}
                  </p>
                </div>
              )}

              {data?.duration && (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-light-text/60 dark:text-dark-text/60">
                    Duration
                  </p>
                  <p className="mt-2 font-medium text-light-text dark:text-dark-text">
                    {data.duration}
                  </p>
                </div>
              )}

              {data?.language && (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-light-text/60 dark:text-dark-text/60">
                    Language
                  </p>
                  <p className="mt-2 font-medium text-light-text dark:text-dark-text">
                    {data.language}
                  </p>
                </div>
              )}

              {data?.publisher && (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-light-text/60 dark:text-dark-text/60">
                    Publisher
                  </p>
                  <p className="mt-2 font-medium text-light-text dark:text-dark-text">
                    {data.publisher}
                  </p>
                </div>
              )}

              {data?.album && (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-light-text/60 dark:text-dark-text/60">
                    Album
                  </p>
                  <p className="mt-2 font-medium text-light-text dark:text-dark-text">
                    {data.album}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {data?.description && (
              <div>
                <h2 className="mb-3 text-xl font-bold text-light-text dark:text-dark-text">
                  Overview
                </h2>
                <p className="leading-relaxed text-light-text/80 dark:text-dark-text/80">
                  {data.description}
                </p>
              </div>
            )}

            {/* Cast / Contributors */}
            {data?.cast && data.cast.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-light-text dark:text-dark-text">
                  Cast
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {data.cast.slice(0, 6).map((member, idx) => (
                    <div
                      key={idx}
                      className="overflow-hidden rounded-lg bg-surface-container-lowest dark:bg-surface-container-low"
                    >
                      {member.image && (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="aspect-square w-full object-cover"
                        />
                      )}
                      <div className="p-3">
                        <p className="font-semibold text-light-text dark:text-dark-text">
                          {member.name}
                        </p>
                        {member.role && (
                          <p className="text-sm text-light-text/60 dark:text-dark-text/60">
                            {member.role}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords/Tags */}
            {data?.keywords && data.keywords.length > 0 && (
              <div>
                <h2 className="mb-3 text-xl font-bold text-light-text dark:text-dark-text">
                  Keywords
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.keywords.slice(0, 15).map((keyword, idx) => (
                    <span
                      key={idx}
                      className="rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-medium text-light-text dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-dark-text/80"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />
      )}
    </div>
  );
};

export default DetailsPage;
