import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import * as endpoints from '../api/endpoints';
import Toast from '../components/Toast';
import DetailsHeroLayout from '../components/details/DetailsHeroLayout';
import SimilarMoodSection from '../components/details/SimilarMoodSection';

const TYPE_COPY = {
  movie: { label: 'Movies', explore: '/explore?type=movies', action: 'Watch Trailer' },
  book: { label: 'Books', explore: '/explore?type=books', action: 'Read Preview' },
  music: { label: 'Music', explore: '/explore?type=music', action: 'Listen Preview' },
  game: { label: 'Games', explore: '/explore?type=games', action: 'View Game' },
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200';

const getPrimaryActionLink = (item) =>
  item.trailer || item.previewLink || item.originalData?.storeUrl || item.originalData?.website || item.originalData?.url || item.originalData?.link || null;

function DetailsPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();

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

  const primaryActionLink = useMemo(() => getPrimaryActionLink(item || {}), [item]);
  const primaryActionLabel = typeInfo.action;

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

  const handlePrimaryAction = () => {
    if (primaryActionLink) {
      window.open(primaryActionLink, '_blank', 'noopener,noreferrer');
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
        <DetailsHeroLayout
          item={{ ...item, originalData: item.originalData || {}, imageUrl: item.imageUrl || item.poster || FALLBACK_IMAGE }}
          type={type}
          onBack={() => navigate(-1)}
          saved={saved}
          onToggleSaved={handleToggleSaved}
          onShare={handleShare}
          onPrimaryAction={handlePrimaryAction}
          primaryActionLabel={primaryActionLabel}
          primaryActionDisabled={!primaryActionLink}
        />

        <SimilarMoodSection items={similar} loading={similarLoading} type={type} onViewAll={handleViewAll} />
      </div>

      {toast.visible && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast((current) => ({ ...current, visible: false }))} />
      )}
    </div>
  );
}

export default DetailsPage;
