import { useEffect, useState } from 'react';
import {
  BookOpen,
  Check,
  Clapperboard,
  Film,
  Gamepad2,
  Music,
  Music2,
} from 'lucide-react';
import * as endpoints from '../api/endpoints';

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

const EMPTY_PREFERENCES = {
  movies: [],
  books: [],
  games: [],
  music: [],
};

const INTENSITY_STORAGE_KEY = 'vibeify_curation_intensity';

const DOMAIN_CARDS = [
  {
    key: 'movies',
    title: 'Movies',
    description: 'Discover cinematic masterpieces and hidden gems from across the globe.',
    icon: Film,
  },
  {
    key: 'books',
    title: 'Books',
    description: 'From literary classics to modern thought-leadership, find your next read.',
    icon: BookOpen,
  },
  {
    key: 'games',
    title: 'Games',
    description: 'Immersive worlds and competitive challenges curated for your style.',
    icon: Gamepad2,
  },
  {
    key: 'music',
    title: 'Music',
    description: 'Sonic landscapes and rhythmic journeys tailored to your mood.',
    icon: Music,
  },
];

const GENRE_SECTIONS = [
  { key: 'movies', title: 'Movies Genres', icon: Clapperboard, genres: MOVIE_GENRES },
  { key: 'books', title: 'Books Genres', icon: BookOpen, genres: BOOK_GENRES },
  { key: 'games', title: 'Games Genres', icon: Gamepad2, genres: GAME_GENRES },
  { key: 'music', title: 'Music Genres', icon: Music2, genres: MUSIC_GENRES },
];

function toPreferenceData(response) {
  if (!response) {
    return EMPTY_PREFERENCES;
  }

  const payload = response.data && typeof response.data === 'object' ? response.data : response;

  return {
    movies: Array.isArray(payload.movies) ? payload.movies : [],
    books: Array.isArray(payload.books) ? payload.books : [],
    games: Array.isArray(payload.games) ? payload.games : [],
    music: Array.isArray(payload.music) ? payload.music : [],
  };
}

function intensityLabel(value) {
  if (value <= 25) {
    return {
      title: 'Cautious',
      blurb: 'We will prioritize familiar, proven recommendations with minimal risk.',
    };
  }

  if (value <= 50) {
    return {
      title: 'Balanced',
      blurb: 'A healthy blend of trusted favorites and occasional fresh discoveries.',
    };
  }

  if (value <= 75) {
    return {
      title: 'Adventurous',
      blurb: 'We will surface niche, bold picks while still keeping relevance high.',
    };
  }

  return {
    title: 'Experimental',
    blurb: 'Expect avant-garde, edge-case, and deeply exploratory recommendations.',
  };
}

function PreferencesPage() {
  const [preferences, setPreferences] = useState(EMPTY_PREFERENCES);
  const [selectedDomains, setSelectedDomains] = useState(['movies', 'books', 'games', 'music']);
  const [curationIntensity, setCurationIntensity] = useState(65);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadPreferences = async () => {
    setLoading(true);
    setError('');

    try {
      const profileResponse = await endpoints.getProfile();
      const profilePayload = profileResponse?.data && typeof profileResponse.data === 'object'
        ? profileResponse.data
        : profileResponse;
      const normalized = toPreferenceData(profilePayload?.preferences || EMPTY_PREFERENCES);
      setPreferences(normalized);

      const domainDefaults = Object.entries(normalized)
        .filter(([, list]) => Array.isArray(list) && list.length > 0)
        .map(([key]) => key);

      setSelectedDomains(domainDefaults.length > 0 ? domainDefaults : ['movies', 'books', 'games', 'music']);

      const storedIntensity = Number(localStorage.getItem(INTENSITY_STORAGE_KEY));
      if (!Number.isNaN(storedIntensity)) {
        setCurationIntensity(Math.min(100, Math.max(0, storedIntensity)));
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const toggleDomain = (domain) => {
    setSelectedDomains((current) => {
      if (current.includes(domain)) {
        return current.filter((item) => item !== domain);
      }
      return [...current, domain];
    });
  };

  const toggleGenre = (domain, genre) => {
    setPreferences((current) => {
      const existing = current[domain] || [];
      const next = existing.includes(genre)
        ? existing.filter((item) => item !== genre)
        : [...existing, genre];
      return {
        ...current,
        [domain]: next,
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const payload = {
        movies: selectedDomains.includes('movies') ? preferences.movies : [],
        books: selectedDomains.includes('books') ? preferences.books : [],
        games: selectedDomains.includes('games') ? preferences.games : [],
        music: selectedDomains.includes('music') ? preferences.music : [],
      };

      const response = await endpoints.updatePreferences(payload);
      const normalized = toPreferenceData(response);
      setPreferences(normalized);
      localStorage.setItem(INTENSITY_STORAGE_KEY, String(curationIntensity));
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPreferences(EMPTY_PREFERENCES);
    setSelectedDomains(['movies', 'books', 'games', 'music']);
    setCurationIntensity(50);
    localStorage.setItem(INTENSITY_STORAGE_KEY, '50');
  };

  const intensityMeta = intensityLabel(curationIntensity);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 md:px-12">
        <div className="h-72 animate-pulse rounded-3xl bg-surface-container-low" />
      </div>
    );
  }

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300">
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:px-12">
        <section className="mb-20 text-left">
          <h1 className="mb-4 text-5xl font-bold tracking-tighter text-on-surface dark:text-white md:text-6xl">
            Curate Your Vibe
          </h1>
          <p className="max-w-2xl text-xl leading-relaxed text-light-text dark:text-dark-text/95 dark:text-white/60">
            Refine your digital ecosystem. Tell us what moves you, and we will architect recommendations that resonate with your frequency.
          </p>
          {error && (
            <p className="mt-4 rounded-xl bg-error/10 px-4 py-2 text-sm text-error">
              {error}
            </p>
          )}
        </section>

        <section className="mb-24">
          <div className="mb-10 flex items-center gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">Primary Domains</h2>
            <div className="h-px flex-grow bg-outline-variant/20" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DOMAIN_CARDS.map((domain) => {
              const selected = selectedDomains.includes(domain.key);
              const Icon = domain.icon;
              return (
                <button
                  key={domain.key}
                  type="button"
                  onClick={() => toggleDomain(domain.key)}
                  className={`group relative rounded-xl bg-surface-container-low p-8 text-left shadow-[0_20px_40px_-10px_rgba(62,37,72,0.05)] transition-all duration-300 ${
                    selected
                      ? 'ring-2 ring-primary'
                      : 'hover:scale-[1.02] hover:shadow-[0_20px_40px_-10px_rgba(62,37,72,0.12)]'
                  }`}
                >
                  <Icon className="mb-6 h-9 w-9 text-primary" />
                  <h3 className="mb-2 text-xl font-bold">{domain.title}</h3>
                  <p className="text-sm leading-relaxed text-light-text dark:text-dark-text/95">{domain.description}</p>
                  {selected && (
                    <span className="absolute right-5 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-24">
          <div className="mb-12 flex items-center gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">Favorite Genres</h2>
            <div className="h-px flex-grow bg-outline-variant/20" />
          </div>

          <div className="grid grid-cols-1 gap-x-16 gap-y-12 md:grid-cols-2">
            {GENRE_SECTIONS.map((section) => {
              const Icon = section.icon;
              const selectedGenres = preferences[section.key] || [];

              return (
                <div key={section.key} className="space-y-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <h4 className="text-lg font-semibold">{section.title}</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {section.genres.map((genre) => {
                      const selected = selectedGenres.includes(genre);
                      return (
                        <button
                          key={`${section.key}-${genre}`}
                          type="button"
                          onClick={() => toggleGenre(section.key, genre)}
                          className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                            selected
                              ? 'bg-primary text-on-primary'
                              : 'bg-secondary-container text-on-secondary-container hover:bg-primary-container'
                          }`}
                        >
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-24 max-w-2xl">
          <div className="mb-8 flex items-center gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">Curation Intensity</h2>
            <div className="h-px flex-grow bg-outline-variant/20" />
          </div>

          <div className="rounded-xl bg-surface-container-high p-8 shadow-[0_20px_40px_-10px_rgba(62,37,72,0.06)]">
            <div className="mb-4 flex justify-between text-sm font-bold uppercase tracking-widest text-light-text dark:text-dark-text/95">
              <span>Safe &amp; Proven</span>
              <span>Boldly Experimental</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={curationIntensity}
              onChange={(event) => setCurationIntensity(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-container-highest accent-primary"
              aria-label="Curation intensity"
            />

            <p className="mt-6 text-sm italic text-light-text dark:text-dark-text/95">
              Current setting: <span className="font-bold text-primary">{intensityMeta.title}</span>. {intensityMeta.blurb}
            </p>
          </div>
        </section>

        <section className="flex flex-col items-center gap-6 pt-12 sm:flex-row">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="w-full rounded-lg bg-gradient-to-br from-primary to-primary-container px-10 py-4 text-lg font-bold text-on-primary shadow-[0_20px_40px_-10px_rgba(131,25,218,0.3)] transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-lg border border-outline-variant/30 px-10 py-4 text-lg font-semibold text-primary transition-all hover:bg-primary/5 active:bg-primary/10 sm:w-auto"
          >
            Reset All
          </button>
        </section>
      </main>
    </div>
  );
}

export default PreferencesPage;

