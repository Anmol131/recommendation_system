import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronRight,
  Clapperboard,
  Gamepad2,
  Music,
  Pencil,
  Settings,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import * as endpoints from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { AVATARS, AvatarDisplay } from '../constants/avatars';

const fallbackGenres = {
  movie: 'Cinema',
  book: 'Literature',
  game: 'Action RPG',
  music: 'Alt Mix',
};

const fallbackDescriptions = {
  movie: 'A cinematic pick aligned with your current taste profile.',
  book: 'A thoughtful read chosen for your literary mood.',
  game: 'An engaging game recommendation built from your activity.',
  music: 'A track selection tuned to your listening behavior.',
};

function toProfileData(response) {
  if (!response) {
    return null;
  }
  if (response.data && typeof response.data === 'object') {
    return response.data;
  }
  return response;
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.filter(Boolean).sort((a, b) => {
    const aTime = new Date(a?.date || 0).getTime();
    const bTime = new Date(b?.date || 0).getTime();
    return bTime - aTime;
  });
}

function formatAddedLabel(value) {
  if (!value) {
    return 'Added recently';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Added recently';
  }

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays <= 0) {
    return 'Added today';
  }

  if (diffDays === 1) {
    return 'Added 1 day ago';
  }

  if (diffDays < 7) {
    return `Added ${diffDays} days ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) {
    return 'Added 1 week ago';
  }

  return `Added ${diffWeeks} weeks ago`;
}

function readItemTitle(item) {
  return item?.title || item?.name || item?.itemId || 'Untitled Pick';
}

function readItemImage(item) {
  return item?.image || item?.poster || item?.cover || item?.thumbnail || null;
}

function readItemGenre(item) {
  return item?.genre || fallbackGenres[item?.type] || 'Featured';
}

function readItemDescription(item) {
  return item?.description || fallbackDescriptions[item?.type] || 'Curated for your profile.';
}

function readItemAuthor(item) {
  return item?.author || item?.creator || item?.artist || 'Unknown Creator';
}

function isAvatarUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function isAvatarPreset(value) {
  return typeof value === 'string' && AVATARS.some((avatar) => avatar.id === value);
}

function insightFromHistoryCount(count) {
  if (count < 10) {
    return 'You are early in your curation journey. Keep liking content to unlock deeper personalization.';
  }

  if (count < 50) {
    return 'Your taste profile is taking shape with strong signals around story-driven picks and stylized worlds.';
  }

  if (count < 120) {
    return 'Your behavior points to high affinity for atmospheric worlds, rich narratives, and bold visual tone.';
  }

  return 'Based on your extensive saves, your profile strongly favors immersive aesthetics and slow-burn storytelling.';
}

function EmptyImage({ label = 'No cover' }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-container-high to-surface-container text-xs font-semibold uppercase tracking-widest text-on-surface-variant/70">
      {label}
    </div>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUserAvatar } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarUpdating, setAvatarUpdating] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await endpoints.getProfile();
      const data = toProfileData(response);
      setProfile(data || {});
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load profile. Please try again.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const safeProfile = profile || {};
  const history = useMemo(() => normalizeHistory(safeProfile.history), [safeProfile.history]);
  const likedHistory = useMemo(() => history.filter((item) => item?.action === 'liked'), [history]);
  const bookWishlist = useMemo(() => history.filter((item) => item?.type === 'book'), [history]);
  const recentGames = useMemo(() => history.filter((item) => item?.type === 'game').slice(0, 3), [history]);

  const [showAllLiked, setShowAllLiked] = useState(false);

  const displayedLiked = showAllLiked ? likedHistory : likedHistory.slice(0, 4);

  const displayName = safeProfile?.name || user?.name || 'Curator';
  const displayEmail = safeProfile?.email || user?.email || 'No email available';
  const avatarValue = safeProfile?.avatar || user?.avatar || '';
  const savedItemsCount = history.length;
  const curatedListsCount = likedHistory.length;
  const insightText = insightFromHistoryCount(savedItemsCount);

  const handleAvatarPick = async (avatarId) => {
    setAvatarUpdating(true);

    try {
      const response = await endpoints.updateAvatar(avatarId);
      const data = toProfileData(response);
      const nextAvatar = data?.avatar || avatarId;

      setProfile((current) => ({
        ...(current || {}),
        avatar: nextAvatar,
      }));
      setUserAvatar(nextAvatar);
      setShowAvatarPicker(false);
    } finally {
      setAvatarUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-12">
        <div className="h-64 animate-pulse rounded-3xl bg-surface-container-low" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 md:px-12">
        <div className="rounded-3xl bg-surface-container-low p-8 shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)]">
          <p className="text-lg font-semibold text-on-surface">Unable to load profile</p>
          <p className="mt-2 text-sm text-on-surface-variant">{error}</p>
          <button
            type="button"
            onClick={loadProfile}
            className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-dim"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface">
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-12 md:px-12">
        <section className="mb-16 flex flex-col items-center gap-10 md:flex-row md:items-end">
          <div className="group relative">
            <div className="h-52 w-52 overflow-hidden rounded-2xl ring-4 ring-white shadow-[0_20px_40px_-10px_rgba(62,37,72,0.14)]">
              {isAvatarUrl(avatarValue) ? (
                <img
                  src={avatarValue}
                  alt={`${displayName} avatar`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : isAvatarPreset(avatarValue) ? (
                <AvatarDisplay avatarId={avatarValue} size={208} className="h-full w-full rounded-none" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-container text-7xl font-black text-on-primary">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowAvatarPicker(true)}
              className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-110 active:scale-95"
              aria-label="Edit avatar"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="mb-2 text-5xl font-extrabold tracking-tight text-on-surface">{displayName}</h1>
            <p className="mb-6 text-lg font-medium text-on-surface-variant opacity-80">{displayEmail}</p>
            <div className="flex flex-wrap justify-center gap-3 md:justify-start">
              <button
                type="button"
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold tracking-tight text-on-primary shadow-lg shadow-primary/20 transition-all hover:bg-primary-dim active:scale-95"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => navigate('/preferences')}
                className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-6 py-2.5 text-sm font-semibold tracking-tight text-primary transition-all hover:bg-surface-container-low"
              >
                <Settings className="h-4 w-4" />
                Preferences Shortcut
              </button>
            </div>
          </div>

          <div className="hidden self-start rounded-2xl border border-white/50 bg-white/40 p-6 shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)] backdrop-blur-sm lg:flex lg:gap-10">
            <div className="text-center">
              <span className="block text-3xl font-black text-primary">{savedItemsCount}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Saved Items</span>
            </div>
            <div className="h-10 w-px self-center bg-outline-variant/20" />
            <div className="text-center">
              <span className="block text-3xl font-black text-primary">{curatedListsCount}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Curated Lists</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="space-y-16 lg:col-span-8">
            <section>
              <header className="mb-8 flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-on-surface">Saved Recommendations</h2>
                <button
                  type="button"
                  onClick={() => setShowAllLiked((current) => !current)}
                  className="flex items-center gap-1 text-sm font-bold uppercase tracking-widest text-primary hover:underline"
                >
                  {showAllLiked ? 'Show Less' : 'View All'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </header>

              {displayedLiked.length === 0 ? (
                <div className="rounded-3xl bg-surface-container-low p-8 text-sm text-on-surface-variant shadow-[0_20px_40px_-10px_rgba(62,37,72,0.06)]">
                  No liked items yet. Start exploring and like content to build your recommendation board.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {displayedLiked.map((item, index) => {
                    const image = readItemImage(item);
                    return (
                      <article
                        key={`${item?.itemId || 'liked'}-${item?.date || index}-${index}`}
                        className="group overflow-hidden rounded-3xl bg-white shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)] transition-all duration-300 hover:shadow-[0_20px_40px_-10px_rgba(62,37,72,0.14)]"
                      >
                        <div className="relative aspect-[16/9] w-full overflow-hidden">
                          {image ? (
                            <img
                              src={image}
                              alt={readItemTitle(item)}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <EmptyImage label={readItemGenre(item)} />
                          )}
                          <span className="absolute right-4 top-4 rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface backdrop-blur-md">
                            {readItemGenre(item)}
                          </span>
                        </div>
                        <div className="p-6">
                          <h3 className="mb-2 text-xl font-bold text-on-surface">{readItemTitle(item)}</h3>
                          <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-on-surface-variant">{readItemDescription(item)}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-primary">
                              <Star className="h-4 w-4 fill-current" />
                              Recommended
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant/50">
                              {formatAddedLabel(item?.date)}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <header className="mb-8 flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-on-surface">Book Wishlist</h2>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
                  {bookWishlist.length} ITEMS
                </span>
              </header>

              {bookWishlist.length === 0 ? (
                <div className="rounded-3xl bg-surface-container-low p-8 text-sm text-on-surface-variant shadow-[0_20px_40px_-10px_rgba(62,37,72,0.06)]">
                  No books in your wishlist yet.
                </div>
              ) : (
                <div className="flex flex-nowrap gap-6 overflow-x-auto pb-8">
                  {bookWishlist.map((item, index) => {
                    const image = readItemImage(item);
                    return (
                      <article
                        key={`${item?.itemId || 'book'}-${item?.date || index}-${index}`}
                        className="group w-64 flex-none rounded-3xl bg-white p-6 text-center shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)] transition-shadow hover:shadow-[0_20px_40px_-10px_rgba(62,37,72,0.14)]"
                      >
                        <div className="mx-auto mb-6 h-52 w-36 overflow-hidden rounded-lg shadow-xl transition-transform group-hover:-translate-y-2">
                          {image ? (
                            <img src={image} alt={readItemTitle(item)} className="h-full w-full object-cover" />
                          ) : (
                            <EmptyImage label="Book" />
                          )}
                        </div>
                        <h4 className="mb-1 text-lg font-bold text-on-surface">{readItemTitle(item)}</h4>
                        <p className="text-xs font-medium text-on-surface-variant">{readItemAuthor(item)}</p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-12 lg:col-span-4">
            <section>
              <h2 className="mb-8 text-2xl font-bold tracking-tight text-on-surface">Recently Played</h2>
              <div className="space-y-4">
                {recentGames.length === 0 ? (
                  <div className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant shadow-[0_20px_40px_-10px_rgba(62,37,72,0.06)]">
                    No recent game activity found.
                  </div>
                ) : (
                  recentGames.map((item, index) => {
                    const image = readItemImage(item);
                    return (
                      <article
                        key={`${item?.itemId || 'game'}-${item?.date || index}-${index}`}
                        className="group flex cursor-pointer items-center gap-4 rounded-2xl bg-surface-container/50 p-4 transition-all hover:bg-surface-container"
                      >
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl shadow-sm">
                          {image ? (
                            <img src={image} alt={readItemTitle(item)} className="h-full w-full object-cover" />
                          ) : (
                            <EmptyImage label="Game" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="truncate text-sm font-bold text-on-surface">{readItemTitle(item)}</h5>
                          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">{readItemGenre(item)}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-3xl bg-inverse-surface p-8 text-on-primary shadow-xl shadow-purple-900/10">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
                <Sparkles className="h-6 w-6 text-primary-container" />
              </div>
              <h3 className="mb-3 text-xl font-bold tracking-tight">Curator Insights</h3>
              <p className="mb-8 text-sm font-medium leading-relaxed text-on-primary/70">"{insightText}"</p>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-on-primary/60">
                  <span>Taste Alignment</span>
                  <span className="text-primary-container">98% Match</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[98%] bg-primary-container shadow-[0_0_10px_rgba(194,133,255,0.5)]" />
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-surface-container-lowest p-6 shadow-[0_20px_40px_-10px_rgba(62,37,72,0.18)]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-on-surface">Choose your avatar</h3>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                className="rounded-full bg-surface-container p-1.5 text-on-surface-variant transition hover:text-on-surface"
                aria-label="Close avatar picker"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {AVATARS.map((avatar) => {
                const selected = avatarValue === avatar.id;

                return (
                  <button
                    key={avatar.id}
                    type="button"
                    disabled={avatarUpdating}
                    onClick={() => handleAvatarPick(avatar.id)}
                    className={`rounded-2xl ring-2 ring-transparent transition hover:ring-primary/40 ${selected ? 'ring-primary' : ''}`}
                    aria-label={`Select ${avatar.id}`}
                  >
                    <AvatarDisplay avatarId={avatar.id} size={64} className="cursor-pointer" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
