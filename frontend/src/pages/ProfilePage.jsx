import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Camera,
  Clock3,
  Heart,
  Sparkles,
  Star,
  Tv,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as endpoints from '../api/endpoints';
import Toast from '../components/Toast';
import { AVATARS, getAvatarById } from '../constants/avatars';

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
  const { user, setUserAvatar } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarUpdating, setAvatarUpdating] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await endpoints.getProfile();
      setProfile(response.data || null);
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
  const avatarLetter = (displayName.charAt(0) || 'L').toUpperCase();
  const currentAvatarId = safeProfile.avatar || user?.avatar || 'avatar-1';
  const currentAvatar = getAvatarById(currentAvatarId);

  const preferences = safeProfile.preferences || {
    movies: [],
    books: [],
    games: [],
    music: [],
  };

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
      setShowAvatarModal(false);
    } catch (err) {
      setToast({ message: err?.response?.data?.message || 'Failed to update avatar.', type: 'info' });
    } finally {
      setAvatarUpdating(false);
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
            <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${currentAvatar.gradient} text-3xl font-bold text-white shadow-lg shadow-primary/30`}>
              {avatarLetter}
            </div>
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="absolute bottom-0 right-0 rounded-full border border-white/20 bg-bg/90 p-1.5 text-primary transition hover:bg-bg"
              aria-label="Edit avatar"
            >
              <Camera size={14} />
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{displayName}</h1>
            <p className="mt-1 text-sm text-muted">{displayEmail}</p>
            <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
              <Sparkles size={13} />
              Member since {createdYear}
            </span>
          </div>
        </div>
      </section>

      {showAvatarModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#1a1a2e]/95 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Choose your avatar</h3>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="rounded-full border border-white/15 bg-white/5 p-1.5 text-muted transition hover:text-white"
                aria-label="Close avatar picker"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {AVATARS.map((avatar) => {
                const selected = currentAvatarId === avatar.id;

                return (
                  <button
                    key={avatar.id}
                    type="button"
                    disabled={avatarUpdating}
                    onClick={() => handleAvatarPick(avatar.id)}
                    className={`rounded-2xl border p-2 transition ${
                      selected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/60'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                    aria-label={`Select ${avatar.id}`}
                  >
                    <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${avatar.gradient} text-2xl font-bold text-white`}>
                      {avatarLetter}
                    </div>
                    <p className="mt-2 text-xs font-medium text-muted">{avatar.id}</p>
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