import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Sparkles, Star } from 'lucide-react';
import { resolveImageUrl } from '../utils/typeNormalizer';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800';

const TYPE_META = {
  movie: { label: 'Movie', accent: 'bg-blue-500/15 text-blue-700 dark:text-blue-200 border-blue-500/20' },
  book: { label: 'Book', accent: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-500/20' },
  music: { label: 'Music', accent: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-200 border-fuchsia-500/20' },
  game: { label: 'Game', accent: 'bg-orange-500/15 text-orange-700 dark:text-orange-200 border-orange-500/20' },
};

const normalizeType = (type) => {
  const raw = String(type || '').toLowerCase().trim();
  if (raw === 'movies') return 'movie';
  if (raw === 'books') return 'book';
  if (raw === 'games') return 'game';
  if (raw === 'songs' || raw === 'tracks') return 'music';
  if (raw === 'track' || raw === 'song') return 'music';
  if (TYPE_META[raw]) return raw;
  return 'movie';
};

const getItemId = (item, type) => {
  if (type === 'movie') return item.movieId || item.id || item._id;
  if (type === 'book') return item.isbn || item.id || item._id;
  if (type === 'music') return item.trackId || item.id || item._id;
  if (type === 'game') return item.gameId || item.id || item._id;
  return item.id || item._id;
};

const getCreatorInfo = (item, type) => {
  if (type === 'movie') return { label: 'Director', value: item.director };
  if (type === 'book') return { label: 'Author', value: item.author };
  if (type === 'music') return { label: 'Artist', value: item.artist };
  if (type === 'game') return { label: 'Developer', value: item.developer };
  return null;
};

const toTags = (item) => {
  if (Array.isArray(item.genres) && item.genres.length > 0) {
    return item.genres.map((genre) => String(genre)).filter(Boolean).slice(0, 3);
  }
  if (Array.isArray(item.categories) && item.categories.length > 0) {
    return item.categories.map((category) => String(category)).filter(Boolean).slice(0, 3);
  }
  if (typeof item.genres === 'string' && item.genres.trim()) {
    return item.genres.split(',').map((genre) => genre.trim()).filter(Boolean).slice(0, 3);
  }
  if (typeof item.categories === 'string' && item.categories.trim()) {
    return item.categories.split(',').map((category) => category.trim()).filter(Boolean).slice(0, 3);
  }
  return [];
};

const toRating = (item) => {
  const raw = item.rating ?? item.avgRating ?? item.averageRating ?? item.score ?? null;
  const numeric = Number(raw);
  if (Number.isNaN(numeric) || numeric <= 0) return null;
  return numeric > 10 ? Number((numeric / 10).toFixed(1)) : Number(numeric.toFixed(1));
};

export default function RecommendationCard({ item }) {
  const [imgFailed, setImgFailed] = useState(false);
  const navigate = useNavigate();

  const itemType = normalizeType(item.type);
  const itemId = getItemId(item, itemType);
  const typeMeta = TYPE_META[itemType] || TYPE_META.movie;
  const imageSrc = resolveImageUrl(item) || FALLBACK_IMAGE;
  const creatorInfo = getCreatorInfo(item, itemType);
  const genres = toTags(item);
  const rating = toRating(item);
  const reasons = Array.isArray(item.reasons)
    ? item.reasons.filter(Boolean).slice(0, 3)
    : [];

  const handleOpenDetails = () => {
    if (!itemId) {
      return;
    }
    navigate(`/details/${itemType}/${itemId}`);
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-light-surface-alt/90 bg-light-surface shadow-[0_16px_42px_-24px_rgba(45,22,120,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_52px_-24px_rgba(45,22,120,0.55)] dark:border-dark-surface-alt dark:bg-dark-surface">
      <div className="relative aspect-[16/10] overflow-hidden bg-light-surface-alt dark:bg-dark-surface-alt">
        <img
          src={imgFailed ? FALLBACK_IMAGE : imageSrc}
          alt={item.title}
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        <div className="absolute left-3 top-3">
          <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${typeMeta.accent}`}>
            {typeMeta.label}
          </span>
        </div>
      </div>

      <div className="flex h-full flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-lg font-bold text-on-surface dark:text-white">
            {item.title || 'Untitled'}
          </h3>
          {rating ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Star size={12} className="fill-primary text-primary" />
              {rating}
            </span>
          ) : null}
        </div>

        <div className="space-y-1.5 text-sm text-light-text-secondary dark:text-dark-text-secondary">
          {creatorInfo?.value ? (
            <p>
              <span className="font-semibold text-on-surface dark:text-white">{creatorInfo.label}:</span> {creatorInfo.value}
            </p>
          ) : null}
          {item.year || item.releaseDate ? (
            <p>
              <span className="font-semibold text-on-surface dark:text-white">Year:</span> {item.year || item.releaseDate}
            </p>
          ) : null}
        </div>

        {genres.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full border border-light-surface-alt bg-light-bg px-2.5 py-1 text-[11px] font-medium text-light-text-secondary dark:border-dark-surface-alt dark:bg-dark-bg dark:text-dark-text-secondary"
              >
                {genre}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-3.5 dark:border-primary/25 dark:bg-primary/10">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles size={13} />
            Why recommended
          </p>
          {reasons.length > 0 ? (
            <ul className="space-y-1.5 text-xs leading-5 text-light-text-secondary dark:text-dark-text-secondary">
              {reasons.map((reason, index) => (
                <li key={`${reason}-${index}`} className="line-clamp-2">• {reason}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              Good fit based on your query preferences.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleOpenDetails}
          disabled={!itemId}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-light-surface-alt px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-dark-surface-alt"
        >
          View Details
          <ArrowUpRight size={16} />
        </button>
      </div>
    </article>
  );
}