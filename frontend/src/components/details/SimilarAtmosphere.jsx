import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200';

const placeholderCards = Array.from({ length: 4 }).map((_, index) => ({
  _placeholder: true,
  _id: `placeholder-${index}`,
  title: 'Vibeify Pick',
  year: '—',
  genre: 'Atmospheric',
  type: 'content',
  imageUrl: FALLBACK_IMAGE,
}));

export default function SimilarAtmosphere({ items = [], loading = false, type, onViewAll }) {
  const navigate = useNavigate();
  const cards = items.length > 0 ? items : placeholderCards;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/80">Similar Mood</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-50 sm:text-2xl">Find more like this</h2>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-100 transition hover:border-violet-400/30 hover:bg-violet-500/15"
        >
          Explore All
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(loading ? Array.from({ length: 4 }) : cards).map((item, index) => {
          if (loading) {
            return (
              <div
                key={`similar-skeleton-${index}`}
                className="animate-pulse overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5"
              >
                <div className="aspect-[2/3] bg-slate-800/70" />
                <div className="space-y-3 p-4">
                  <div className="h-4 rounded-full bg-slate-800/70" />
                  <div className="h-3 w-3/4 rounded-full bg-slate-800/70" />
                </div>
              </div>
            );
          }

          const isPlaceholder = item._placeholder;
          const imageUrl = item.imageUrl || item.poster || FALLBACK_IMAGE;

          return (
            <button
              key={item._id || item.id || index}
              type="button"
              disabled={isPlaceholder}
              onClick={() => {
                if (!isPlaceholder) {
                  navigate(`/details/${item.type || type}/${item._id || item.id}`);
                }
              }}
              className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 text-left transition hover:-translate-y-1 hover:border-violet-400/30 disabled:cursor-default disabled:hover:translate-y-0"
            >
              <div className="relative aspect-[2/3] overflow-hidden">
                {isPlaceholder ? (
                  <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(145,97,255,0.25),_rgba(11,18,32,0.95))]">
                    <div className="flex flex-col items-center gap-2 text-slate-100">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-2xl font-bold">
                        V
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Vibeify</span>
                    </div>
                  </div>
                ) : (
                  <img src={imageUrl} alt={item.title || 'Similar content'} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                )}
              </div>

              <div className="space-y-2 p-4">
                <h3 className="line-clamp-1 text-sm font-semibold text-slate-50">{item.title || 'Untitled'}</h3>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  {[item.year, item.type, item.genre || item.genres?.[0]].filter(Boolean).join(' • ') || 'Recommended'}
                </p>
                {!isPlaceholder && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-300">
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
  );
}
