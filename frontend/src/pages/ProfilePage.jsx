import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Settings, X } from 'lucide-react';
import * as endpoints from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { handleApiError } from '../utils/handleApiError';
import { AVATARS, AvatarDisplay } from '../constants/avatars';

const fallbackGenres = {
  movie: 'Cinema',
  book: 'Literature',
  game: 'Action RPG',
  music: 'Alt Mix',
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

function EmptyImage({ label = 'No cover' }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-container-high to-surface-container text-xs font-semibold uppercase tracking-widest text-light-text/70 dark:text-dark-text/70">
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
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [bioSaving, setBioSaving] = useState(false);
  const [bioError, setBioError] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const toastApi = useToast();

  // New states for username and password
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await endpoints.getProfile();
      const data = toProfileData(response);
      setProfile(data || {});
    } catch (err) {
      const msg = handleApiError(err, 'Failed to load profile. Please try again.');
      setError(msg);
      toastApi.show({ message: msg, type: 'error' });
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    setFavoritesLoading(true);
    try {
      const response = await endpoints.getFavorites();
      const data = response?.data || [];
      setFavorites(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = handleApiError(err, 'Failed to load favorites');
      console.warn('Failed to load favorites:', err);
      toastApi.show({ message: msg, type: 'error' });
      setFavorites([]);
    } finally {
      setFavoritesLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadFavorites();
  }, []);

  useEffect(() => {
    setBioDraft(profile?.bio || '');
  }, [profile?.bio]);

  const safeProfile = profile || {};
  const displayName = safeProfile?.name || user?.name || 'Curator';
  const displayEmail = safeProfile?.email || user?.email || 'No email available';
  const displayBio = safeProfile?.bio || 'No bio yet. Add a short line about your vibe.';
  const avatarValue = safeProfile?.avatar || user?.avatar || '';

  const isAvatarUrl = (value) => {
    return typeof value === 'string' && /^https?:\/\//i.test(value);
  };

  const isAvatarPreset = (value) => {
    return typeof value === 'string' && AVATARS.some((avatar) => avatar.id === value);
  };

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
      toastApi.show({ message: 'Avatar updated successfully', type: 'success' });
    } catch (err) {
      const msg = handleApiError(err, 'Failed to update avatar. Please try again.');
      toastApi.show({ message: msg, type: 'error' });
    } finally {
      setAvatarUpdating(false);
    }
  };

  const handleBioSave = async () => {
    setBioSaving(true);
    setBioError('');

    try {
      const trimmedBio = bioDraft.trim();
      console.log('Updating bio:', trimmedBio);
      
      const response = await endpoints.updateBio(trimmedBio);
      const data = toProfileData(response);

      // Backend returns { success: true, user: sanitizedUser }
      const updatedUser = data?.user || {};
      const bioValue = updatedUser?.bio ?? trimmedBio;

      setProfile((current) => ({
        ...(current || {}),
        bio: bioValue,
      }));
      
      setIsEditingBio(false);
      toastApi.show({ message: 'Bio updated successfully', type: 'success' });
    } catch (err) {
      console.error('Bio update error:', err);
      const msg = handleApiError(err, 'Failed to update bio. Please try again.');
      setBioError(msg);
      toastApi.show({ message: msg, type: 'error' });
    } finally {
      setBioSaving(false);
    }
  };

  const handleRenameUsername = async () => {
    if (!newUsername.trim()) {
      setModalError('Username cannot be empty');
      return;
    }

    setRenameLoading(true);
    setModalError('');
    setModalSuccess('');

    try {
      const response = await endpoints.updateUsername(newUsername.trim());
      const data = toProfileData(response);

      setProfile((current) => ({
        ...(current || {}),
        name: data?.name || newUsername.trim(),
      }));

      setModalSuccess('Username updated successfully!');
      toastApi.show({ message: 'Username updated successfully', type: 'success' });
      setTimeout(() => {
        setShowRenameModal(false);
        setNewUsername('');
        setModalSuccess('');
      }, 1500);
    } catch (err) {
      const msg = handleApiError(err, 'Failed to update username. Please try again.');
      setModalError(msg);
      toastApi.show({ message: msg, type: 'error' });
    } finally {
      setRenameLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setModalError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalError('New password and confirmation do not match');
      return;
    }

    if (newPassword.length < 6) {
      setModalError('New password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);
    setModalError('');
    setModalSuccess('');

    try {
      await endpoints.updatePassword(currentPassword, newPassword);

      setModalSuccess('Password updated successfully!');
      toastApi.show({ message: 'Password updated successfully', type: 'success' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setModalSuccess('');
      }, 1500);
    } catch (err) {
      const msg = handleApiError(err, 'Failed to update password. Please try again.');
      setModalError(msg);
      toastApi.show({ message: msg, type: 'error' });
    } finally {
      setPasswordLoading(false);
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
          <p className="mt-2 text-sm text-light-text dark:text-dark-text/95">{error}</p>
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
    <div className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300">
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-12 md:px-12">
        {/* Profile Header */}
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
            <p className="mb-6 text-lg font-medium text-light-text dark:text-dark-text/95 opacity-80">{displayEmail}</p>
            {isEditingBio ? (
              <div className="mb-6 max-w-2xl">
                <textarea
                  value={bioDraft}
                  onChange={(event) => setBioDraft(event.target.value)}
                  rows={3}
                  placeholder="Tell others about your taste..."
                  className="w-full rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
                />
                {bioError ? <p className="mt-2 text-xs font-semibold text-error">{bioError}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleBioSave}
                    disabled={bioSaving}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary transition hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {bioSaving ? 'Saving...' : 'Save Bio'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingBio(false);
                      setBioDraft(safeProfile?.bio || '');
                      setBioError('');
                    }}
                    disabled={bioSaving}
                    className="rounded-lg border border-outline-variant/30 px-4 py-2 text-xs font-semibold text-on-surface transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6 max-w-2xl">
                <p className="text-sm leading-relaxed text-light-text dark:text-dark-text/95">{displayBio}</p>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3 md:justify-start">
              <button
                type="button"
                onClick={() => {
                  setIsEditingBio(true);
                  setBioError('');
                }}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold tracking-tight text-on-primary shadow-lg shadow-primary/20 transition-all hover:bg-primary-dim active:scale-95"
              >
                Edit Bio
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRenameModal(true);
                  setNewUsername(displayName);
                  setModalError('');
                  setModalSuccess('');
                }}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-6 py-2.5 text-sm font-semibold tracking-tight text-primary transition-all hover:bg-surface-container-low"
              >
                Rename Username
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(true);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setModalError('');
                  setModalSuccess('');
                }}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-6 py-2.5 text-sm font-semibold tracking-tight text-primary transition-all hover:bg-surface-container-low"
              >
                Change Password
              </button>
            </div>
          </div>
        </section>

        {/* My Favorites Section */}
        <section>
          <header className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">My Favorites</h2>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-light-text/40 dark:text-dark-text/40">
              {favorites.length} ITEMS
            </span>
          </header>

          {favoritesLoading ? (
            <div className="rounded-3xl bg-surface-container-low p-8 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
              <div className="h-64 animate-pulse rounded-3xl bg-surface-container-low" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="rounded-3xl bg-surface-container-low p-8 text-sm text-light-text dark:text-dark-text/95 shadow-[0_20px_40px_-10px_rgba(62,37,72,0.06)]">
              No favorites saved yet. Start exploring and save your favorite movies, books, music, and games!
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((item, index) => {
                const image = item.imageUrl || null;
                return (
                  <article
                    key={`${item?.itemId || 'favorite'}-${item?.savedAt || index}-${index}`}
                    onClick={() => navigate(`/details/${item.itemType}/${item.itemId}`)}
                    className="group cursor-pointer overflow-hidden rounded-3xl bg-white shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)] transition-all duration-300 hover:shadow-[0_20px_40px_-10px_rgba(62,37,72,0.14)]"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      {image ? (
                        <img
                          src={image}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <EmptyImage label={item.genre || 'Favorite'} />
                      )}
                      <span className="absolute right-4 top-4 rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface backdrop-blur-md">
                        {item.itemType}
                      </span>
                    </div>
                    <div className="p-6">
                      <h3 className="mb-2 text-xl font-bold text-on-surface">{item.title}</h3>
                      <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-light-text dark:text-dark-text/95">
                        {item.genre && item.year ? `${item.genre} • ${item.year}` : item.genre || item.year || 'No details available'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-primary">
                          ⭐ Favorite
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-light-text/50 dark:text-dark-text/50">
                          {formatAddedLabel(item?.savedAt)}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Avatar Picker Modal */}
        {showAvatarPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-surface-container-low p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-on-surface">Choose Avatar</h3>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(false)}
                  className="rounded-xl p-2 text-light-text dark:text-dark-text/95 hover:bg-surface-container"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4 sm:grid-cols-6">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => handleAvatarPick(avatar.id)}
                    disabled={avatarUpdating}
                    className="group relative overflow-hidden rounded-2xl ring-2 ring-transparent transition-all hover:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <AvatarDisplay avatarId={avatar.id} size={80} className="h-20 w-20 rounded-none" />
                    {avatarValue === avatar.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/80 text-on-primary">
                        <span className="text-xs font-bold">Selected</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rename Username Modal */}
        {showRenameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-3xl bg-surface-container-low p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-on-surface">Rename Username</h3>
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="rounded-xl p-2 text-light-text dark:text-dark-text/95 hover:bg-surface-container"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface">New Username</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
                    placeholder="Enter new username"
                  />
                </div>
                {modalError && <p className="text-sm font-semibold text-error">{modalError}</p>}
                {modalSuccess && <p className="text-sm font-semibold text-success">{modalSuccess}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleRenameUsername}
                    disabled={renameLoading}
                    className="flex-1 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {renameLoading ? 'Updating...' : 'Update Username'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRenameModal(false)}
                    disabled={renameLoading}
                    className="flex-1 rounded-xl border border-outline-variant/30 px-6 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-3xl bg-surface-container-low p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-on-surface">Change Password</h3>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded-xl p-2 text-light-text dark:text-dark-text/95 hover:bg-surface-container"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary/40 focus:outline-none"
                    placeholder="Confirm new password"
                  />
                </div>
                {modalError && <p className="text-sm font-semibold text-error">{modalError}</p>}
                {modalSuccess && <p className="text-sm font-semibold text-success">{modalSuccess}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={passwordLoading}
                    className="flex-1 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    disabled={passwordLoading}
                    className="flex-1 rounded-xl border border-outline-variant/30 px-6 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProfilePage;

