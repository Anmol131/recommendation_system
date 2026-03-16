import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as endpoints from '../api/endpoints';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [preferences, setPreferences] = useState({ movies: '', books: '', games: '', music: '' });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileResponse, historyResponse] = await Promise.all([
          endpoints.getProfile(),
          endpoints.getHistory(),
        ]);

        const nextProfile = profileResponse.data;
        setProfile(nextProfile);
        setHistory(historyResponse.data || []);
        setPreferences({
          movies: (nextProfile.preferences?.movies || []).join(', '),
          books: (nextProfile.preferences?.books || []).join(', '),
          games: (nextProfile.preferences?.games || []).join(', '),
          music: (nextProfile.preferences?.music || []).join(', '),
        });
      } catch (error) {
        setProfile(null);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const initials = useMemo(() => {
    const source = profile?.name || user?.name || 'User';
    return source
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [profile?.name, user?.name]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const savePreferences = async () => {
    const payload = {
      movies: preferences.movies.split(',').map((item) => item.trim()).filter(Boolean),
      books: preferences.books.split(',').map((item) => item.trim()).filter(Boolean),
      games: preferences.games.split(',').map((item) => item.trim()).filter(Boolean),
      music: preferences.music.split(',').map((item) => item.trim()).filter(Boolean),
    };

    const response = await endpoints.updatePreferences(payload);
    setProfile((current) => ({ ...current, preferences: response.data }));
    setEditing(false);
  };

  if (loading) {
    return <div className="px-6 py-24 text-center text-muted">Loading profile...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8 lg:px-10">
      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <section className="rounded-3xl border border-surface2 bg-surface p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-bg">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">{profile?.name || user?.name}</h1>
                <p className="text-muted">{profile?.email || user?.email}</p>
                <p className="mt-1 text-sm text-muted">
                  Member since {new Date(profile?.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-surface2 px-4 py-3 text-sm font-medium text-white transition hover:border-primary hover:text-primary"
            >
              Logout
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-surface2 bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">My Preferences</h2>
            <button
              onClick={() => (editing ? savePreferences() : setEditing(true))}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-bg transition hover:bg-primaryDark"
            >
              {editing ? 'Save' : 'Edit'}
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {['movies', 'books', 'games', 'music'].map((key) => (
              <div key={key}>
                <p className="mb-2 text-sm font-medium capitalize text-muted">{key}</p>
                {editing ? (
                  <input
                    type="text"
                    value={preferences[key]}
                    onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.value }))}
                    placeholder={`Add ${key} preferences separated by commas`}
                    className="w-full rounded-xl border border-surface2 bg-surface2 px-4 py-3 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <div className="rounded-xl bg-surface2 px-4 py-3 text-sm text-white">
                    {(profile?.preferences?.[key] || []).length > 0
                      ? profile.preferences[key].join(', ')
                      : 'No preferences set yet'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-surface2 bg-surface p-6">
        <h2 className="text-xl font-semibold text-white">Watch/Read/Play History</h2>

        {history.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-surface2 bg-surface2 px-6 py-12 text-center text-muted">
            No activity yet.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {history.map((item, index) => (
              <div
                key={`${item.itemId}-${index}`}
                className="flex flex-col gap-3 rounded-2xl bg-surface2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
                      {item.type}
                    </span>
                    <span className="text-sm text-white">{item.action}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">Item ID: {item.itemId}</p>
                </div>
                <div className="text-sm text-muted">
                  {new Date(item.date).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ProfilePage;