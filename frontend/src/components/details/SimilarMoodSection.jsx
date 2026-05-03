import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200';

export default function SimilarMoodSection({ items = [], loading = false, type, onViewAll }) {
  const navigate = useNavigate();
  const cards = loading
    ? Array.from({ length: 4 }, (_, index) => ({
        _placeholder: true,
        id: `placeholder-${index}`,
        title: 'Loading...',
        metadata: 'Curated mood',
        imageUrl: FALLBACK_IMAGE,
      }))
    : items.slice(0, 4);

  return (
    <section className="mt-10 rounded-[2rem] border border-white/10 bg-[#08101f]/95 p-6 shadow-[0_30px_100px_-60px_rgba(96,69,190,0.75)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-300/80">Similar Mood</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-50 sm:text-2xl">More titles with the same energy</h2>
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

      <div className="mt-6 flex gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-4 xl:overflow-visible xl:pb-0">
        {cards.map((item) => {
          const imageUrl = item.imageUrl || item.poster || FALLBACK_IMAGE;
          const label = item._placeholder ? 'Loading...' : item.title || 'Untitled';
          const metadata = item._placeholder
            ? 'Finding matching mood'
            : [item.year, item.type?.toUpperCase(), item.genre].filter(Boolean).join(' • ');

          return (
            <button
              key={item._id || item.id || item.id || label}
              type="button"
              disabled={item._placeholder}
              onClick={() => !item._placeholder && navigate(`/details/${item.type || type}/${item._id || item.id}`)}
              className="group min-w-[280px] shrink-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#091024] text-left transition hover:-translate-y-1 hover:border-violet-400/30 focus:outline-none focus:ring-2 focus:ring-violet-400/20 disabled:cursor-wait disabled:opacity-60 xl:min-w-0"
            >
              <div className="relative overflow-hidden bg-slate-900">
                <img
                  src={imageUrl}
                  alt={label}
                  className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="space-y-3 p-4">
                <h3 className="text-sm font-semibold text-slate-100">{label}</h3>
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">{metadata}</p>
                {!item._placeholder && (
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
  );
}
