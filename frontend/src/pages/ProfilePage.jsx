import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Camera,
  Clock3,
  Heart,
  Lock,
  Pencil,
  Sparkles,
  Star,
  Trophy,
  Tv,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as endpoints from '../api/endpoints';
import Toast from '../components/Toast';
import { AVATARS, AvatarDisplay } from '../constants/avatars';

const preferenceStyles = {
  movies: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
  games: 'bg-violet-500/20 text-violet-200 border-violet-400/30',
  music: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/30',
  books: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30',
};

function getTypeLabel(type = '') {
  const map = {
    movie: 'Movie',
    game: 'Game',
    book: 'Book',
    music: 'Music',
  };
  return map[type] || 'Media';
}

function formatDate(date) {
  if (!date) return 'Unknown date';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Unknown date';
  return parsed.toLocaleString();
}

function HistoryCard({ item }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="rounded-full border border-primary/40 bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          {getTypeLabel(item.type)}
        </span>
        <span className="text-xs text-muted">{formatDate(item.date)}</span>
      </div>
      <h3 className="text-base font-semibold text-white">{item.itemId}</h3>
      <p className="mt-1 text-sm capitalize text-muted">{item.action}</p>
      {typeof item.rating === 'number' && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-sm text-gold">
          <Star size={14} className="fill-current" />
          {item.rating.toFixed(1)}
        </div>
      )}
    </article>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6 px-6 py-8 sm:px-8 lg:px-10">
      <div className="h-44 rounded-3xl border border-white/10 bg-white/5" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-28 rounded-2xl border border-white/10 bg-white/5" />
        <div className="h-28 rounded-2xl border border-white/10 bg-white/5" />
      </div>
      <div className="h-80 rounded-3xl border border-white/10 bg-white/5" />
      <div className="h-80 rounded-3xl border border-white/10 bg-white/5" />
      <div className="h-56 rounded-3xl border border-white/10 bg-white/5" />
    </div>
  );
}

function ProfilePage() {
  const { user, setUserAvatar, setUserBio } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [avatarUpdating, setAvatarUpdating] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await endpoints.getProfile();
      const nextProfile = response.data || null;
      setProfile(nextProfile);
      setBioInput(nextProfile?.bio || '');
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

  useEffect(() => {
    if (!toast.message) return undefined;
    const timeout = setTimeout(() => {
      setToast({ message: '', type: 'success' });
    }, 3000);
    return () => clearTimeout(timeout);
  }, [toast.message]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 sm:px-8 lg:px-10">
        <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-8 text-center backdrop-blur-md">
          <p className="text-lg font-semibold text-red-200">Unable to load your profile</p>
          <p className="mt-2 text-sm text-red-100/80">{error}</p>
          <button
            type="button"
            onClick={loadProfile}
            className="mt-6 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const safeProfile = profile || {};
  const history = Array.isArray(safeProfile.history) ? safeProfile.history : [];
  const favorites = history.filter((item) => item.action === 'liked');
  const recentHistory = [...history]
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, 10);

  const favoritesCount = favorites.length;
  const watchedCount = history.length;

  const displayName = safeProfile.name || user?.name || 'Lumina User';
  const displayEmail = safeProfile.email || user?.email || 'No email available';
  const createdYear = safeProfile.createdAt
    ? new Date(safeProfile.createdAt).getFullYear()
    : new Date().getFullYear();
  const currentAvatarId = safeProfile.avatar || user?.avatar || 'avatar-1';
  const currentBio = typeof safeProfile.bio === 'string' ? safeProfile.bio : '';

  const preferences = safeProfile.preferences || {
    movies: [],
    books: [],
    games: [],
    music: [],
  };

  const badgeDefinitions = [
    { id: 'movie-explorer', label: 'Movie Explorer', icon: Tv, earned: history.some((item) => item.type === 'movie') },
    { id: 'music-lover', label: 'Music Lover', icon: Sparkles, earned: history.some((item) => item.type === 'music') },
    { id: 'bookworm', label: 'Bookworm', icon: Bookmark, earned: history.some((item) => item.type === 'book') },
    { id: 'gamer', label: 'Gamer', icon: Star, earned: history.some((item) => item.type === 'game') },
    { id: 'critic', label: 'Critic', icon: Pencil, earned: history.filter((item) => item.action === 'rated').length >= 3 },
    { id: 'super-fan', label: 'Super Fan', icon: Heart, earned: history.filter((item) => item.action === 'liked').length >= 5 },
  ];

  const handleAvatarPick = async (avatarId) => {
    setAvatarUpdating(true);
    try {
      const response = await endpoints.updateAvatar(avatarId);
      const nextAvatar = response?.data?.avatar || avatarId;

      setProfile((current) => ({
        ...(current || {}),
        avatar: nextAvatar,
      }));

      setUserAvatar(nextAvatar);
      setToast({ message: 'Avatar updated!', type: 'success' });
      setShowAvatarPicker(false);
    } catch (err) {
      setToast({ message: err?.response?.data?.message || 'Failed to update avatar.', type: 'info' });
    } finally {
      setAvatarUpdating(false);
    }
  };

  const handleBioCancel = () => {
    setBioInput(currentBio);
    setEditingBio(false);
  };

  const handleBioSave = async () => {
    const trimmedBio = bioInput.trim();

    if (trimmedBio.length > 150) {
      setToast({ message: 'Bio must be 150 characters or fewer.', type: 'info' });
      return;
    }

    try {
      const response = await endpoints.updateBio(trimmedBio);
      const nextBio = response?.data?.bio ?? trimmedBio;

      setProfile((current) => ({
        ...(current || {}),
        bio: nextBio,
      }));
      setUserBio(nextBio);
      setBioInput(nextBio);
      setEditingBio(false);
      setToast({ message: 'Bio updated!', type: 'success' });
    } catch (err) {
      setToast({ message: err?.response?.data?.message || 'Failed to update bio.', type: 'info' });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8 sm:px-8 lg:px-10">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-gradient-to-br from-primary/30 to-blue-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-20 w-20">
            <AvatarDisplay avatarId={currentAvatarId} size={80} />
            <button
              type="button"
              onClick={() => setShowAvatarPicker(true)}
              className="absolute bottom-0 right-0 rounded-full border border-white/20 bg-white/10 p-1.5 text-primary transition hover:bg-white/20"
              aria-label="Edit avatar"
            >
              <Camera size={14} />
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{displayName}</h1>
            <p className="mt-1 text-sm text-muted">{displayEmail}</p>
            {!editingBio ? (
              currentBio ? (
                <button
                  type="button"
                  onClick={() => {
                    setBioInput(currentBio);
                    setEditingBio(true);
                  }}
                  className="mt-2 inline-flex items-center gap-2 text-left text-sm text-white/80 transition hover:text-white"
                >
                  <span>{currentBio}</span>
                  <Pencil size={13} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setBioInput('');
                    setEditingBio(true);
                  }}
                  className="mt-2 text-sm text-white/50 transition hover:text-white/80"
                >
                  + Add a bio
                </button>
              )
            ) : (
              <div className="mt-3 w-full max-w-md space-y-2">
                <textarea
                  value={bioInput}
                  onChange={(event) => setBioInput(event.target.value)}
                  maxLength={150}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-primary/60"
                  placeholder="Tell everyone what you are into"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-white/50">{bioInput.length} / 150</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBioCancel}
                      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBioSave}
                      className="rounded-lg border border-violet-400/40 bg-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-200 transition hover:bg-violet-500/30"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
            <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
              <Sparkles size={13} />
              Member since {createdYear}
            </span>
          </div>
        </div>
      </section>

      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-3xl border border-white/10 bg-[#13131f] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Choose your avatar</h3>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                className="rounded-full border border-white/15 bg-white/5 p-1.5 text-muted transition hover:text-white"
                aria-label="Close avatar picker"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {AVATARS.map((avatar) => {
                const selected = currentAvatarId === avatar.id;

                return (
                  <button
                    key={avatar.id}
                    type="button"
                    disabled={avatarUpdating}
                    onClick={() => handleAvatarPick(avatar.id)}
                    className={`rounded-2xl ring-2 ring-transparent transition hover:ring-white/30 ${selected ? 'ring-violet-500' : ''}`}
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

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="mb-3 inline-flex rounded-lg border border-primary/40 bg-primary/20 p-2 text-primary">
            <Heart size={18} />
          </div>
          <p className="text-sm text-muted">Favorites</p>
          <p className="mt-1 text-3xl font-bold text-white">{favoritesCount}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="mb-3 inline-flex rounded-lg border border-blue-400/40 bg-blue-500/20 p-2 text-blue-200">
            <Tv size={18} />
          </div>
          <p className="text-sm text-muted">Watched</p>
          <p className="mt-1 text-3xl font-bold text-white">{watchedCount}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-5 flex items-center gap-2 text-white">
          <Trophy size={18} className="text-violet-300" />
          <h2 className="text-xl font-semibold">Your Badges</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {badgeDefinitions.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
                  badge.earned
                    ? 'border-violet-400/40 bg-violet-500/20 text-violet-200'
                    : 'border-white/10 bg-white/5 text-white/30 opacity-40'
                }`}
              >
                <Icon size={14} />
                <span>{badge.label}</span>
                {!badge.earned && <Lock size={13} />}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-5 flex items-center gap-2 text-white">
          <Heart size={18} className="text-primary" />
          <h2 className="text-xl font-semibold">Your Favorites</h2>
        </div>
        {favorites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-5 py-10 text-center text-muted">
            You have not liked any items yet. Start exploring and tap like to build your favorites.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((item, index) => (
              <HistoryCard key={`${item.itemId}-${item.date}-${index}`} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-5 flex items-center gap-2 text-white">
          <Clock3 size={18} className="text-blue-300" />
          <h2 className="text-xl font-semibold">Recently Watched</h2>
        </div>
        {recentHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-5 py-10 text-center text-muted">
            No activity yet. Your recent views and ratings will appear here.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentHistory.map((item, index) => (
              <HistoryCard key={`${item.itemId}-${item.date}-${item.action}-${index}`} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white">
            <Bookmark size={18} className="text-violet-300" />
            <h2 className="text-xl font-semibold">Preferences Snapshot</h2>
          </div>
          <Link
            to="/preferences"
            className="text-sm font-semibold text-primary transition hover:text-blue-300"
          >
            Edit preferences
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {['movies', 'games', 'music', 'books'].map((group) => {
            const list = Array.isArray(preferences[group]) ? preferences[group] : [];
            return (
              <div key={group} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-3 text-sm font-semibold text-white">
                  {group.charAt(0).toUpperCase() + group.slice(1)}
                </p>
                {list.length === 0 ? (
                  <p className="text-sm text-muted">None set</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {list.map((item) => (
                      <span
                        key={`${group}-${item}`}
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${preferenceStyles[group]}`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default ProfilePage;