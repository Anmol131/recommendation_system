import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, Bookmark, BookmarkCheck, ChevronLeft, Play, RefreshCw, Share2, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import * as endpoints from '../api/endpoints';
import Toast from '../components/Toast';

const TYPE_COPY = {
  movie: { label: 'Movies', explore: '/explore?type=movies' },
  book: { label: 'Books', explore: '/explore?type=books' },
  music: { label: 'Music', explore: '/explore?type=music' },
  game: { label: 'Games', explore: '/explore?type=games' },
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200';

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

const getActionButtons = (item = {}, type, onScrollSimilar) => {
  const title = cleanTitleForSearch(item.title || item.name || '');
  const year = item.year || item.releaseDate || '';
  const author = item.author || item.artist || item.director || '';
  const artist = item.artist || '';
  const director = item.director || '';
  const searchTitle = title;
  const build = (platform, query) => ({ url: makeSearchUrl(platform, query), variant: 'secondary' });
  const direct = {
    trailer: item.trailer || null,
    previewLink: item.previewLink || null,
    spotifyUrl: item.spotifyUrl || item.originalData?.spotifyUrl || null,
    website: item.originalData?.website || item.originalData?.url || item.originalData?.link || null,
  };

  if (type === 'movie') {
    return [
      { label: 'Watch Trailer', url: direct.trailer || makeSearchUrl('youtube', `${searchTitle} ${year} trailer`), variant: 'primary' },
      build('youtube', `${searchTitle} ${year} review`),
      build('google', `${searchTitle} ${year} IMDb`),
      { label: 'Recommend Similar', action: onScrollSimilar, variant: 'secondary' },
    ];
  }

  if (type === 'book') {
    return [
      { label: 'Read Preview', url: direct.previewLink || makeSearchUrl('googleBooks', `${searchTitle} ${author} preview`), variant: 'primary' },
      build('youtube', `${searchTitle} ${author} book review`),
      build('google', `${searchTitle} ${author} book`),
      { label: 'Recommend Similar', action: onScrollSimilar, variant: 'secondary' },
    ];
  }

  if (type === 'music') {
    return [
      { label: 'Listen on YouTube', url: direct.previewLink || direct.spotifyUrl || makeSearchUrl('youtube', `${searchTitle} ${artist}`), variant: 'primary' },
      build('google', `${searchTitle} ${artist} lyrics`),
      { url: direct.spotifyUrl || makeSearchUrl('spotify', `${searchTitle} ${artist}`), label: 'Spotify Search', variant: 'secondary' },
      { label: 'Recommend Similar', action: onScrollSimilar, variant: 'secondary' },
    ];
  }

  if (type === 'game') {
    return [
      { label: 'Watch Trailer', url: direct.trailer || makeSearchUrl('youtube', `${searchTitle} game trailer`), variant: 'primary' },
      build('youtube', `${searchTitle} gameplay`),
      build('youtube', `${searchTitle} game review`),
      build('google', `${searchTitle} game official`),
      { label: 'Recommend Similar', action: onScrollSimilar, variant: 'secondary' },
    ];
  }

  return [
    { label: 'Recommend Similar', action: onScrollSimilar, variant: 'primary' },
  ];
};

function DetailsPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const similarSectionRef = useRef(null);

  const [item, setItem] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false });

  const typeInfo = TYPE_COPY[type] || TYPE_COPY.movie;

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
  }, [id, retryCount, type]);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: item?.title || 'Vibeify', text: item?.title || 'Vibeify content', url });
        return;
      } catch (shareError) {
        if (shareError?.name !== 'AbortError') {
          console.error('Share failed:', shareError);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setToast({ message: 'Link copied to clipboard', type: 'success', visible: true });
      setTimeout(() => setToast((current) => ({ ...current, visible: false })), 2500);
    } catch (clipboardError) {
      console.error('Clipboard copy failed:', clipboardError);
    }
  };

  const handleToggleSaved = () => {
    setSaved((current) => !current);
    setToast({
      message: saved ? 'Removed from saved items' : 'Saved to watchlist',
      type: 'success',
      visible: true,
    });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 2500);
  };

  const handleViewAll = () => {
    navigate(typeInfo.explore);
  };

  const scrollToSimilar = () => {
    similarSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const actionButtons = useMemo(() => getActionButtons(item || {}, type, scrollToSimilar), [item, type, scrollToSimilar]);

  const retry = () => setRetryCount((count) => count + 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050b16] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-6 w-56 rounded-full bg-white/10" />
          <div className="grid gap-8 rounded-[2rem] border border-white/10 bg-white/5 p-5 lg:grid-cols-[340px_minmax(0,1fr)] lg:p-7">
            <div className="space-y-4">
              <div className="aspect-[2/3] rounded-[1.75rem] bg-slate-800/80" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-20 rounded-2xl bg-slate-800/80" />
                <div className="h-20 rounded-2xl bg-slate-800/80" />
                <div className="h-20 rounded-2xl bg-slate-800/80" />
              </div>
            </div>
            <div className="space-y-4 py-2">
              <div className="h-8 w-40 rounded-full bg-slate-800/80" />
              <div className="h-14 w-3/4 rounded-2xl bg-slate-800/80" />
              <div className="h-5 w-2/3 rounded-full bg-slate-800/80" />
              <div className="flex gap-3 pt-4">
                <div className="h-11 w-36 rounded-full bg-slate-800/80" />
                <div className="h-11 w-36 rounded-full bg-slate-800/80" />
                <div className="h-11 w-36 rounded-full bg-slate-800/80" />
              </div>
              <div className="grid gap-3 pt-6 sm:grid-cols-2 xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-20 rounded-2xl bg-slate-800/80" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-[#050b16] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-violet-400/30 hover:bg-violet-500/15"
          >
            Back
          </button>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-[0_24px_80px_-40px_rgba(96,69,190,0.8)]">
            <AlertCircle className="mx-auto mb-4 text-rose-400" size={42} />
            <h1 className="text-2xl font-semibold text-slate-50">Could not load details</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">{error || 'The selected content is not available right now.'}</p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
              >
                <RefreshCw size={16} />
                Retry
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-violet-400/30 hover:bg-violet-500/15"
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
    <div className="min-h-screen bg-[#040814] text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(120,80,255,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(68,56,255,0.12),_transparent_20%)]" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-[#09121f]/95 shadow-[0_30px_100px_-50px_rgba(80,61,255,0.35)] backdrop-blur">
          <div className="border-b border-white/5 px-6 py-5 sm:px-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-violet-400/30 hover:bg-violet-500/15"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          </div>

          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(350px,42%)_minmax(0,58%)]">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-[0_25px_80px_-40px_rgba(12,15,41,0.9)]">
              <img
                src={item?.imageUrl || item?.poster || item?.cover || item?.thumbnail || item?.background_image || FALLBACK_IMAGE}
                alt={item?.title || 'Content artwork'}
                className="h-full min-h-[520px] w-full object-cover"
              />
            </div>

            <div className="flex flex-col gap-6">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { label: item?.rating ? `★ ${item.rating}` : 'Rating N/A' },
                    { label: item?.year || item?.releaseDate || 'Year N/A' },
                    { label: item?.genre || 'Genre N/A' },
                    { label: typeInfo.label.slice(0, -1) || 'Content' },
                  ].map((badge) => (
                    <span
                      key={badge.label}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-200"
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>

                <div className="space-y-3">
                  <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">{item?.title || 'Untitled'}</h1>
                  <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                    {item?.subtitle || `${typeInfo.label.slice(0, -1)} recommendation with premium cinematic styling.`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {actionButtons.map((button, idx) => (
                    <button
                      key={`${button.label || 'action'}-${idx}`}
                      type="button"
                      onClick={() => {
                        if (button.action) return button.action();
                        if (button.url) window.open(button.url, '_blank', 'noopener,noreferrer');
                      }}
                      disabled={!button.url && !button.action}
                      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${button.variant === 'primary' ? 'bg-violet-500 text-white shadow-[0_18px_50px_-30px_rgba(168,85,247,0.9)] hover:bg-violet-400' : 'border border-white/10 bg-white/5 text-slate-100 hover:border-violet-400/30 hover:bg-violet-500/15'} disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {button.label || 'More'}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleToggleSaved}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:border-violet-400/30 hover:bg-violet-500/15"
                    aria-label={saved ? 'Remove from saved items' : 'Save to watchlist'}
                  >
                    {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:border-violet-400/30 hover:bg-violet-500/15"
                    aria-label="Share content"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/80">Overview</p>
                    <h2 className="mt-3 text-xl font-semibold text-slate-50">What to expect</h2>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base">
                  {item?.description || 'No overview available. Check similar mood suggestions below for more great recommendations.'}
                </p>
              </section>

              <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/80">Details</p>
                    <h2 className="mt-3 text-xl font-semibold text-slate-50">Key details</h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Type', value: typeInfo.label.slice(0, -1) || 'Content' },
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
                    <div key={detail.label} className="rounded-3xl border border-white/10 bg-[#08111f]/90 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">{detail.label}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-100">{detail.value || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/10 bg-[#08101f]/95 p-6 shadow-[0_30px_100px_-60px_rgba(96,69,190,0.75)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/80">Similar Mood</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-50 sm:text-2xl">More titles with the same energy</h2>
            </div>
            <button
              type="button"
              onClick={handleViewAll}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-100 transition hover:border-violet-400/30 hover:bg-violet-500/15"
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
              const imageUrl = card.imageUrl || card.poster || FALLBACK_IMAGE;
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
                  className="group min-w-[280px] shrink-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#091024] text-left transition hover:-translate-y-1 hover:border-violet-400/30 focus:outline-none focus:ring-2 focus:ring-violet-400/20 disabled:cursor-wait disabled:opacity-60 xl:min-w-0"
                >
                  <div className="relative overflow-hidden bg-slate-900">
                    <img src={imageUrl} alt={label} className="h-56 w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="space-y-3 p-4">
                    <h3 className="text-sm font-semibold text-slate-100">{label}</h3>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">{metadata}</p>
                    {!card._placeholder && (
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-violet-300">
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

      {toast.visible && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast((current) => ({ ...current, visible: false }))} />
      )}
    </div>
  );
}

export default DetailsPage;
