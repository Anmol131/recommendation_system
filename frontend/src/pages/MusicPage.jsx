import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, Search, SlidersHorizontal, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as endpoints from '../api/endpoints';

const LIMIT = 12;

const CATEGORY_LINKS = [
  { label: 'All', path: '/explore', active: false },
  { label: 'Movies', path: '/explore?type=movies', active: false },
  { label: 'Books', path: '/explore?type=books', active: false },
  { label: 'Games', path: '/explore?type=games', active: false },
  { label: 'Music', path: '/explore?type=music', active: true },
];

const GENRES = [
  'All Genres',
  'Pop',
  'Electronic',
  'Jazz',
  'Rock',
  'Lo-Fi',
  'Classical',
  'Hip-Hop',
  'R&B',
  'Indie',
];

const MOODS = ['Chilled', 'Energetic', 'Focus', 'Melancholy', 'Happy', 'Sad'];
const YEARS = ['Any Year', '2024', '2023', '2022', '2021 & earlier'];

const unwrapItems = (payload) => {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const unwrapTotal = (payload, fallbackLength = 0) => {
  const total = payload?.data?.totalItems ?? payload?.totalItems;
  return typeof total === 'number' ? total : fallbackLength;
};

const toRating = (item) => {
  const value = Number(item?.popularity ?? 0);
  if (Number.isNaN(value)) return 0;
  return value;
};

const parseYear = (value) => {
  if (!value) return null;
  const text = String(value);
  const match = text.match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
};

const passesYearFilter = (itemYear, selectedYear) => {
  if (selectedYear === 'Any Year') return true;
  if (!itemYear) return false;
  if (selectedYear === '2021 & earlier') return itemYear <= 2021;
  return itemYear === Number(selectedYear);
};

function MusicSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <article
          key={index}
          className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_16px_40px_-20px_rgba(62,37,72,0.22)]"
        >
          <div className="aspect-square animate-pulse bg-surface-container-high" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-2/3 animate-pulse rounded bg-surface-container-high" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-surface-container-high" />
            <div className="h-3 w-2/5 animate-pulse rounded bg-surface-container-high" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-surface-container-high" />
          </div>
        </article>
      ))}
    </div>
  );
}

function MusicPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [artistQuery, setArtistQuery] = useState('');
  const [debouncedArtist, setDebouncedArtist] = useState('');
  const [activeMood, setActiveMood] = useState('');
  const [selectedYear, setSelectedYear] = useState('Any Year');

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedArtist(artistQuery.trim().toLowerCase());
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [artistQuery]);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, [selectedGenre]);

  useEffect(() => {
    let cancelled = false;

    const fetchMusic = async () => {
      const initialFetch = page === 1;
      if (initialFetch) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await endpoints.getMusic({
          limit: LIMIT,
          sort: 'popularity',
          genre: selectedGenre === 'All Genres' ? undefined : selectedGenre,
          page,
        });

        if (cancelled) return;

        const incoming = unwrapItems(response);
        const total = unwrapTotal(response, incoming.length);

        setTotalItems(total);
        setItems((current) => (initialFetch ? incoming : [...current, ...incoming]));
        setHasMore(page * LIMIT < total && incoming.length > 0);
      } catch {
        if (cancelled) return;

        if (page === 1) {
          setItems([]);
          setTotalItems(0);
        }

        setHasMore(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    fetchMusic();

    return () => {
      cancelled = true;
    };
  }, [page, selectedGenre]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const artist = String(item?.artist || '').toLowerCase();
      const artistOk = debouncedArtist.length === 0 || artist.includes(debouncedArtist);

      const year = parseYear(item?.year || item?.releaseYear || item?.releaseDate);
      const yearOk = passesYearFilter(year, selectedYear);

      return artistOk && yearOk;
    });
  }, [items, debouncedArtist, selectedYear]);

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
  };

  const clearFilters = () => {
    setSelectedGenre('All Genres');
    setArtistQuery('');
    setDebouncedArtist('');
    setActiveMood('');
    setSelectedYear('Any Year');
  };

  const handleShowMore = () => {
    if (!hasMore || loadingMore) return;
    setPage((value) => value + 1);
  };

  return (
    <div className="min-h-screen bg-background pb-20 text-on-background font-['Inter'] antialiased">
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 sm:px-8 lg:px-10">
        <div className="mb-12 flex justify-center">
          <nav className="flex items-center gap-1 p-1.5 rounded-2xl bg-surface-container-low shadow-[0_14px_35px_-24px_rgba(62,37,72,0.24)]">
            {CATEGORY_LINKS.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={[
                  'rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-300',
                  item.active
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/25'
                    : 'text-on-surface-variant hover:bg-surface-container-high',
                ].join(' ')}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <header className="mb-12 space-y-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="mb-2 text-5xl font-bold leading-tight tracking-tight text-on-background">Music Hub</h1>
              <p className="max-w-lg text-lg text-on-surface-variant">
                Sonic landscapes and rhythmic journeys tailored to your mood.
              </p>
            </div>

            <div className="group relative w-full md:w-96">
              <input
                type="text"
                value={artistQuery}
                onChange={(event) => setArtistQuery(event.target.value)}
                placeholder="Search albums, artists, moods..."
                className="w-full rounded-xl bg-surface-container-high px-6 py-4 pr-12 text-on-surface placeholder:text-on-surface-variant/60 transition-all duration-300 focus:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Search
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 transition-colors group-focus-within:text-primary"
              />
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full lg:w-72 lg:flex-shrink-0">
            <div className="space-y-6 rounded-2xl bg-surface-container-lowest p-6 shadow-[0_20px_45px_-28px_rgba(62,37,72,0.24)] lg:sticky lg:top-24">
              <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-primary">
                <SlidersHorizontal size={16} />
                Filters
              </h2>

              <section>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">Genre</h3>
                <div className="space-y-2.5">
                  {GENRES.map((genre) => (
                    <label key={genre} className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedGenre === genre}
                        onChange={() => handleGenreChange(genre)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm text-on-surface transition-colors hover:text-primary">{genre}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">Artist</h3>
                <input
                  type="text"
                  value={artistQuery}
                  onChange={(event) => setArtistQuery(event.target.value)}
                  placeholder="Search artist..."
                  className="w-full rounded-lg bg-surface-container-low px-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/65 focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </section>

              <section>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">Mood</h3>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((mood) => {
                    const active = activeMood === mood;
                    return (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => setActiveMood((prev) => (prev === mood ? '' : mood))}
                        className={[
                          'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-primary/10 hover:text-primary',
                        ].join(' ')}
                      >
                        {mood}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">Year</h3>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                    className="w-full appearance-none rounded-lg bg-surface-container-low px-3 py-2 pr-10 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/20"
                  >
                    {YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                </div>
              </section>

              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-xl bg-surface-container-highest py-3 text-xs font-bold uppercase tracking-[0.16em] text-primary transition-colors hover:bg-primary hover:text-on-primary"
              >
                Clear Filters
              </button>
            </div>
          </aside>

          <section className="min-w-0 flex-1">
            {loading ? (
              <MusicSkeletons />
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
                {visibleItems.map((item, index) => {
                  const id = item?.trackId || item?._id;
                  const image = item?.cover || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=900';
                  const year = parseYear(item?.year || item?.releaseYear || item?.releaseDate);

                  return (
                    <article
                      key={`${id || 'music'}-${index}`}
                      className="group flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_16px_40px_-22px_rgba(62,37,72,0.24)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_28px_60px_-24px_rgba(62,37,72,0.3)]"
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={image}
                          alt={item?.title || 'Music cover'}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute left-4 top-4">
                          <span className="rounded-full bg-white/25 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white shadow-[0_8px_22px_-14px_rgba(0,0,0,0.45)] backdrop-blur-md">
                            {item?.genre || 'Music'}
                          </span>
                        </div>
                      </div>

                      <div className="flex h-full flex-col p-5">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="line-clamp-1 text-xl font-bold text-on-surface transition-colors group-hover:text-primary">
                            {item?.title || 'Untitled Track'}
                          </h3>
                          <div className="inline-flex items-center gap-1 text-[#a03648]">
                            <Star size={14} fill="#a03648" color="#a03648" />
                            <span className="text-xs font-bold">{toRating(item).toFixed(1)}</span>
                          </div>
                        </div>

                        <p className="mb-6 text-sm text-on-surface-variant">{item?.artist || 'Unknown Artist'}</p>

                        <div className="mt-auto flex items-center justify-between gap-3 rounded-xl bg-surface-container-highest/55 px-3 py-2">
                          <span className="line-clamp-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/80">
                            {item?.album || 'Unknown Album'} • {year || 'N/A'}
                          </span>
                          <button
                            type="button"
                            onClick={() => navigate('/explore?type=music')}
                            className="group/btn inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary"
                          >
                            View Details
                            <ArrowRight size={14} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!loading && visibleItems.length === 0 ? (
              <div className="rounded-2xl bg-surface-container-lowest px-6 py-14 text-center shadow-[0_16px_40px_-24px_rgba(62,37,72,0.2)]">
                <p className="text-lg font-semibold text-on-surface">No tracks matched your filters.</p>
                <p className="mt-2 text-sm text-on-surface-variant">Try changing genre, artist search, or year.</p>
              </div>
            ) : null}

            {!loading && visibleItems.length > 0 ? (
              <div className="mt-16 flex flex-col items-center gap-4">
                {hasMore ? (
                  <button
                    type="button"
                    onClick={handleShowMore}
                    disabled={loadingMore}
                    className="group inline-flex items-center gap-3 rounded-full bg-surface-container-highest px-10 py-4 font-bold text-on-background shadow-[0_14px_35px_-20px_rgba(62,37,72,0.22)] transition-all duration-300 hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loadingMore ? 'Loading more vibes...' : 'Show more vibes'}
                    <ChevronDown size={18} className="transition-transform duration-300 group-hover:translate-y-1" />
                  </button>
                ) : null}

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant/70">
                  Viewing {visibleItems.length} of {totalItems || items.length} recommendations
                </p>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}

export default MusicPage;