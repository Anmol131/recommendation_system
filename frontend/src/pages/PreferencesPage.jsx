import { useEffect, useState } from 'react';
import {
  Bell,
  BookOpen,
  Film,
  Gamepad2,
  Lock,
  Music,
  Settings,
  Shield,
  Sparkles,
  LoaderCircle,
} from 'lucide-react';
import * as endpoints from '../api/endpoints';
import Toast from '../components/Toast';

const MOVIE_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Western',
];

const BOOK_GENRES = [
  'Fantasy',
  'Science Fiction',
  'Mystery',
  'Thriller',
  'Romance',
  'Horror',
  'Biography',
  'History',
  'Self-Help',
  'Science',
  'Philosophy',
  'Poetry',
];

const GAME_GENRES = [
  'Action',
  'RPG',
  'Strategy',
  'Sports',
  'Puzzle',
  'Horror',
  'Adventure',
  'Simulation',
  'Fighting',
  'Racing',
];

const MUSIC_GENRES = [
  'Pop',
  'Rock',
  'Hip-Hop',
  'Jazz',
  'Classical',
  'Electronic',
  'R&B',
  'Country',
  'Metal',
  'Indie',
  'Lo-Fi',
  'Reggae',
];

const GENRE_SECTIONS = [
  { key: 'movies', title: 'Movies', genres: MOVIE_GENRES, icon: Film },
  { key: 'books', title: 'Books', genres: BOOK_GENRES, icon: BookOpen },
  { key: 'games', title: 'Games', genres: GAME_GENRES, icon: Gamepad2 },
  { key: 'music', title: 'Music', genres: MUSIC_GENRES, icon: Music },
];

const MEDIA_OPTIONS = [
  { key: 'movies', title: 'Movies', description: 'Film recommendations, critics picks, and cinema gems.', icon: Film },
  { key: 'games', title: 'Games', description: 'PC, console, and indie titles based on your play style.', icon: Gamepad2 },
  { key: 'music', title: 'Music', description: 'Artists, tracks, and playlists tuned to your vibe.', icon: Music },
  { key: 'books', title: 'Books', description: 'Novels and non-fiction to match your reading mood.', icon: BookOpen },
];

const NOTIFICATION_DEFAULTS = {
  matchingRecommendations: true,
  trendingGenres: true,
  weeklyDigest: false,
  emailNotifications: false,
};

const EMPTY_PREFERENCES = {
  movies: [],
  books: [],
  games: [],
  music: [],
};

function PreferencesSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6 px-6 py-8 sm:px-8 lg:px-10">
      <div className="h-24 rounded-3xl border border-white/10 bg-white/5" />
      <div className="h-72 rounded-3xl border border-white/10 bg-white/5" />
      <div className="h-64 rounded-3xl border border-white/10 bg-white/5" />
      <div className="h-48 rounded-3xl border border-white/10 bg-white/5" />
    </div>
  );
}

function PreferencesPage() {
  const [preferences, setPreferences] = useState(EMPTY_PREFERENCES);
  const [initialPreferences, setInitialPreferences] = useState(EMPTY_PREFERENCES);
  const [activeTab, setActiveTab] = useState('movies');
  const [preferredMediaTypes, setPreferredMediaTypes] = useState(['movies', 'books', 'games', 'music']);
  const [notifications, setNotifications] = useState(NOTIFICATION_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast.message) return undefined;
    const timeout = setTimeout(() => {
      setToast({ message: '', type: 'success' });
    }, 3000);
    return () => clearTimeout(timeout);
  }, [toast.message]);

  const loadPreferences = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await endpoints.getProfile();
      const serverPreferences = response.data?.preferences || EMPTY_PREFERENCES;
      const normalized = {
        movies: Array.isArray(serverPreferences.movies) ? serverPreferences.movies : [],
        books: Array.isArray(serverPreferences.books) ? serverPreferences.books : [],
        games: Array.isArray(serverPreferences.games) ? serverPreferences.games : [],
        music: Array.isArray(serverPreferences.music) ? serverPreferences.music : [],
      };

      setPreferences(normalized);
      setInitialPreferences(normalized);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const toggleGenre = (type, genre) => {
    setPreferences((current) => {
      const selected = current[type] || [];
      const exists = selected.includes(genre);
      const next = exists ? selected.filter((item) => item !== genre) : [...selected, genre];
      return { ...current, [type]: next };
    });
  };

  const toggleMediaType = (type) => {
    setPreferredMediaTypes((current) => {
      if (current.includes(type)) {
        return current.filter((item) => item !== type);
      }
      return [...current, type];
    });
  };

  const toggleNotification = (key) => {
    setNotifications((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        movies: preferences.movies,
        books: preferences.books,
        games: preferences.games,
        music: preferences.music,
      };
      const response = await endpoints.updatePreferences(payload);
      const saved = response.data || payload;
      const normalized = {
        movies: Array.isArray(saved.movies) ? saved.movies : [],
        books: Array.isArray(saved.books) ? saved.books : [],
        games: Array.isArray(saved.games) ? saved.games : [],
        music: Array.isArray(saved.music) ? saved.music : [],
      };
      setPreferences(normalized);
      setInitialPreferences(normalized);
      showToast('Preferences saved successfully.', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not save preferences.', 'info');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPreferences(initialPreferences);
    showToast('Changes were discarded.', 'info');
  };

  const handleComingSoon = () => {
    showToast('Coming soon', 'info');
  };

  if (loading) {
    return <PreferencesSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 sm:px-8 lg:px-10">
        <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-8 text-center backdrop-blur-md">
          <p className="text-lg font-semibold text-red-200">Unable to load preferences</p>
          <p className="mt-2 text-sm text-red-100/80">{error}</p>
          <button
            type="button"
            onClick={loadPreferences}
            className="mt-6 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8 sm:px-8 lg:px-10">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-white">
          <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/20 to-blue-500/20 p-2.5 text-primary">
            <Settings size={18} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Preferences</h1>
            <p className="mt-1 text-sm text-muted">Customize your Lumina experience</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="text-xl font-semibold text-white">Favorite Genres</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {GENRE_SECTIONS.map((section) => {
            const selectedCount = (preferences[section.key] || []).length;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveTab(section.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  activeTab === section.key
                    ? 'border-primary/50 bg-gradient-to-r from-primary/30 to-blue-500/30 text-white'
                    : 'border-white/15 bg-white/5 text-muted hover:text-white'
                }`}
              >
                <section.icon size={16} />
                {section.title}
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                  {selectedCount}
                </span>
              </button>
            );
          })}
        </div>

        {GENRE_SECTIONS.filter((section) => section.key === activeTab).map((section) => (
          <div key={section.key} className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-4 text-sm font-medium text-muted">Select {section.title} genres</p>
            <div className="flex flex-wrap gap-2">
              {section.genres.map((genre) => {
                const selected = (preferences[section.key] || []).includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(section.key, genre)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      selected
                        ? 'border-primary/50 bg-gradient-to-r from-primary/30 to-blue-500/30 text-white shadow-lg shadow-primary/20'
                        : 'border-white/20 bg-white/5 text-muted hover:border-white/35 hover:text-white'
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="text-xl font-semibold text-white">Preferred Media Types</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {MEDIA_OPTIONS.map((option) => {
            const selected = preferredMediaTypes.includes(option.key);
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => toggleMediaType(option.key)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? 'border-primary/50 bg-gradient-to-br from-primary/20 to-blue-500/20 text-white shadow-lg shadow-primary/20'
                    : 'border-white/15 bg-white/5 text-muted hover:border-white/30 hover:text-white'
                }`}
              >
                <div className="mb-2 inline-flex rounded-lg border border-white/20 bg-white/10 p-2">
                  <option.icon size={16} />
                </div>
                <p className="text-base font-semibold">{option.title}</p>
                <p className="mt-1 text-sm">{option.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2 text-white">
          <Bell size={18} className="text-primary" />
          <h2 className="text-xl font-semibold">Notification Settings</h2>
        </div>
        <div className="space-y-3">
          {[
            { key: 'matchingRecommendations', label: 'New recommendations matching my interests' },
            { key: 'trendingGenres', label: 'Trending content in my favorite genres' },
            { key: 'weeklyDigest', label: 'Weekly digest of new releases' },
            { key: 'emailNotifications', label: 'Email notifications' },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            >
              <input
                type="checkbox"
                checked={notifications[item.key]}
                onChange={() => toggleNotification(item.key)}
                className="h-4 w-4 rounded border-white/30 bg-transparent text-primary focus:ring-primary"
              />
              {item.label}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2 text-white">
          <Shield size={18} className="text-blue-300" />
          <h2 className="text-xl font-semibold">Privacy & Security</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleComingSoon}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Lock size={16} />
            Change Password
          </button>
          <button
            type="button"
            onClick={handleComingSoon}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Sparkles size={16} />
            Data & Privacy
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-500 px-5 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving && <LoaderCircle size={16} className="animate-spin" />}
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </section>
    </div>
  );
}

export default PreferencesPage;
