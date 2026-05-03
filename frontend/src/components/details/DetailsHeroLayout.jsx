import { Bookmark, BookmarkCheck, ChevronLeft, Play, Share2 } from 'lucide-react';
import OverviewBlock from './OverviewBlock';
import DetailsInfoBlock from './DetailsInfoBlock';

const TYPE_LABELS = {
  movie: 'Movie',
  book: 'Book',
  music: 'Music',
  game: 'Game',
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200';

const resolveImage = (item) => {
  return item?.imageUrl || item?.poster || item?.cover || item?.thumbnail || item?.background_image || item?.poster_path || FALLBACK_IMAGE;
};

const compactList = (value) => {
  if (!value) return 'N/A';
  if (Array.isArray(value)) return value.filter(Boolean).slice(0, 3).join(', ') || 'N/A';
  return String(value);
};

const getDetails = (item, type) => {
  const common = [
    { label: 'Type', value: TYPE_LABELS[type] || 'Content' },
    { label: 'Genre', value: item.genre || (item.genres && item.genres[0]) || 'N/A' },
    { label: 'Language', value: item.language || 'N/A' },
    { label: 'Rating', value: item.rating || 'N/A' },
    { label: 'Year', value: item.year || item.releaseDate || 'N/A' },
  ];

  const extras = {
    movie: [
      { label: 'Director', value: item.director || 'N/A' },
      { label: 'Runtime', value: item.runtime || 'N/A' },
      { label: 'Cast', value: compactList(item.cast) },
    ],
    book: [
      { label: 'Author', value: item.author || 'N/A' },
      { label: 'Publisher', value: item.publisher || 'N/A' },
      { label: 'Pages', value: item.pages || 'N/A' },
    ],
    music: [
      { label: 'Artist', value: item.artist || 'N/A' },
      { label: 'Album', value: item.album || 'N/A' },
      { label: 'Duration', value: item.duration || 'N/A' },
    ],
    game: [
      { label: 'Developer', value: item.developer || 'N/A' },
      { label: 'Platform', value: item.platform || 'N/A' },
      { label: 'Release Date', value: item.releaseDate || 'N/A' },
    ],
  };

  return [...common, ...(extras[type] || [])];
};

const getBadges = (item, type) => {
  const badges = [
    { label: item.rating ? `★ ${item.rating}` : 'Rating N/A' },
    { label: item.year || item.releaseDate || 'Year N/A' },
    { label: item.genre || 'Genre N/A' },
  ];

  if (type) {
    badges.push({ label: TYPE_LABELS[type] });
  }

  return badges;
};

export default function DetailsHeroLayout({
  item,
  type,
  onBack,
  saved,
  onToggleSaved,
  onShare,
  onPrimaryAction,
  primaryActionLabel,
  primaryActionDisabled,
}) {
  const imageUrl = resolveImage(item);
  const typeLabel = TYPE_LABELS[type] || 'Content';
  const badges = getBadges(item, type);
  const details = getDetails(item, type);
  const overviewText = item?.description || 'No overview available. Explore similar mood picks below for more great recommendations.';

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#09121f]/95 shadow-[0_30px_100px_-50px_rgba(80,61,255,0.35)] backdrop-blur">
      <div className="border-b border-white/5 px-6 py-5 sm:px-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-violet-400/30 hover:bg-violet-500/15"
        >
          <ChevronLeft size={16} />
          Back
        </button>
      </div>

      <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(350px,42%)_minmax(0,58%)]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-[0_25px_80px_-40px_rgba(12,15,41,0.9)]">
          <img
            src={imageUrl}
            alt={item?.title || 'Content artwork'}
            className="h-full min-h-[520px] w-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-200"
                >
                  {badge.label}
                </span>
              ))}
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
                {item?.title || 'Untitled'}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                {item?.subtitle || `${typeLabel} recommendation with premium cinematic styling.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onPrimaryAction}
                disabled={primaryActionDisabled}
                className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_-30px_rgba(168,85,247,0.9)] transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Play size={16} />
                {primaryActionLabel}
              </button>

              <button
                type="button"
                onClick={onToggleSaved}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:border-violet-400/30 hover:bg-violet-500/15"
                aria-label={saved ? 'Remove from saved items' : 'Save to watchlist'}
              >
                {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>

              <button
                type="button"
                onClick={onShare}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:border-violet-400/30 hover:bg-violet-500/15"
                aria-label="Share content"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <OverviewBlock text={overviewText} />
            <DetailsInfoBlock details={details} />
          </div>
        </div>
      </div>
    </section>
  );
}
