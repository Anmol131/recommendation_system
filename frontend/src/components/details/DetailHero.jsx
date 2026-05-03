import { Bookmark, BookmarkCheck, Heart, Share2, Sparkles, Star } from 'lucide-react';

const TYPE_LABELS = {
  movie: 'Movies',
  book: 'Books',
  music: 'Music',
  game: 'Games',
};

const TYPE_SINGLE_LABELS = {
  movie: 'Movie',
  book: 'Book',
  music: 'Music',
  game: 'Game',
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200';

const getStarCount = (rating) => {
  const numericRating = Number(rating);
  if (!Number.isFinite(numericRating) || numericRating <= 0) return 0;
  if (numericRating > 10) return Math.max(0, Math.min(5, Math.round(numericRating / 20)));
  if (numericRating > 5) return Math.max(0, Math.min(5, Math.round(numericRating / 2)));
  return Math.max(0, Math.min(5, Math.round(numericRating)));
};

const getSnippet = (item, type) => {
  if (type === 'movie') return item.director ? `Director: ${item.director}` : null;
  if (type === 'book') return item.author ? `Author: ${item.author}` : null;
  if (type === 'music') return item.artist ? `Artist: ${item.artist}` : null;
  if (type === 'game') return item.developer ? `Developer: ${item.developer}` : null;
  return null;
};

const getPrimaryImage = (item) =>
  item?.imageUrl || item?.poster || item?.cover || item?.image || item?.background_image || item?.thumbnail || FALLBACK_IMAGE;

export default function DetailHero({
  item,
  type,
  onBack,
  saved,
  onToggleSaved,
  onShare,
  onPrimaryAction,
  primaryActionLabel,
  primaryActionDisabled,
  onJumpSimilar,
}) {
  const imageUrl = getPrimaryImage(item);
  const relatedImages = (item?.relatedImages || item?.thumbnails || item?.gallery || item?.originalData?.images || [])
    .filter(Boolean)
    .slice(0, 3);
  const typeLabel = TYPE_LABELS[type] || 'Content';
  const rating = item?.rating;
  const year = item?.year || item?.releaseDate || '—';
  const genres = (item?.genres && item.genres.length > 0 ? item.genres : [item?.genre]).filter(Boolean);
  const language = item?.language || 'Language N/A';
  const snippet = getSnippet(item, type) || `${typeLabel.slice(0, -1)} details`;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1220]/95 shadow-[0_30px_90px_-40px_rgba(96,69,190,0.8)] backdrop-blur">
      <div className="flex flex-wrap items-center gap-2 px-5 pt-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400 sm:px-7">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:border-violet-400/40 hover:bg-violet-500/15 focus:outline-none focus:ring-2 focus:ring-violet-400/60 sm:h-10 sm:w-10"
          aria-label="Go back"
        >
          ←
        </button>
        <span>{typeLabel.toUpperCase()} / DETAILS</span>
      </div>

      <div className="grid gap-8 px-5 pb-6 pt-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-7 lg:pb-8">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-[0_36px_110px_-40px_rgba(15,23,42,0.75)]">
            <img
              src={imageUrl}
              alt={item?.title || 'Content image'}
              className="h-full w-full min-h-[520px] object-cover"
            />
          </div>

          {relatedImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {relatedImages.map((thumb, index) => (
                <div key={`${thumb}-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <img src={thumb} alt="Related preview" className="aspect-square w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between gap-6 lg:py-2">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-200">
                {TYPE_SINGLE_LABELS[type] || typeLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-200">
                {rating ? `Rating ${rating}` : 'Rating N/A'}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-200">
                {year}
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl lg:text-5xl">
                {item?.title || 'Untitled'}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                {(genres[0] || 'Genre N/A')}
                {' • '}
                {language}
                {' • '}
                {snippet}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    size={15}
                    className={index < getStarCount(rating) ? 'fill-violet-400 text-violet-400' : 'text-white/20'}
                  />
                ))}
                <span className="ml-1 font-semibold text-slate-100">{rating || 'N/A'}</span>
              </div>
              <span className="h-1 w-1 rounded-full bg-slate-500" />
              <span>{item?.genre || genres[0] || 'No genre listed'}</span>
              <span className="h-1 w-1 rounded-full bg-slate-500" />
              <span>{item?.language || 'Language N/A'}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onPrimaryAction}
              disabled={primaryActionDisabled}
              className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_-16px_rgba(168,85,247,0.9)] transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-3"
            >
              <Sparkles size={16} />
              {primaryActionLabel}
            </button>

            <button
              type="button"
              onClick={onToggleSaved}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:border-violet-400/30 hover:bg-violet-500/15"
              aria-label={saved ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>

            <button
              type="button"
              onClick={onShare}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:border-violet-400/30 hover:bg-violet-500/15"
              aria-label="Share details"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
