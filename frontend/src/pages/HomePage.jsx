import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  Search,
  User,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as endpoints from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

const CATEGORY_CARDS = [
  {
    key: 'movies',
    title: 'Movies',
    subtitle: 'Cinephile Dream',
    description: '',
    href: '/movies',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
    className: 'md:col-span-2',
    overlay: 'bg-gradient-to-t from-black/80 via-black/20 to-transparent',
  },
  {
    key: 'books',
    title: 'Books',
    subtitle: '',
    description: '',
    href: '/books',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
    className: '',
    overlay: 'bg-gradient-to-t from-black/80 via-black/20 to-transparent',
  },
  {
    key: 'games',
    title: 'Games',
    subtitle: '',
    description: '',
    href: '/games',
    image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800',
    className: '',
    overlay: 'bg-gradient-to-t from-black/80 via-black/20 to-transparent',
  },
  {
    key: 'music',
    title: 'Music',
    subtitle: '',
    description: 'Find the rhythm of your life through our curated sonic landscapes.',
    href: '/music',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    className: 'md:col-span-4 h-64',
    overlay: 'bg-gradient-to-r from-black/70 via-black/20 to-transparent',
  },
];

const unwrapItems = (payload) => {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload.items)) {
    return payload.items;
  }
  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  return [];
};

const toGenreTags = (item) => {
  if (Array.isArray(item?.genres)) {
    return item.genres.slice(0, 2).map((genre) => String(genre));
  }
  if (typeof item?.genres === 'string') {
    return item.genres.split(',').map((genre) => genre.trim()).filter(Boolean).slice(0, 2);
  }
  return [];
};

const getMediaImage = (item, type) => {
  if (type === 'movie') {
    return item?.poster || item?.posterPath || item?.backdropPath || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800';
  }
  if (type === 'book') {
    return item?.cover || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800';
  }
  if (type === 'game') {
    return item?.image || 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800';
  }
  return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800';
};

const getItemId = (item, type) => {
  if (type === 'movie') {
    return item?.movieId ?? item?.tmdbId ?? item?.id ?? item?._id;
  }
  if (type === 'book') {
    return item?.isbn ?? item?.id ?? item?._id;
  }
  if (type === 'game') {
    return item?.gameId ?? item?.id ?? item?._id;
  }
  if (type === 'music') {
    return item?.trackId ?? item?.id ?? item?._id;
  }
  return item?.id ?? item?._id;
};

const getDetailPath = (item, type) => {
  const id = getItemId(item, type);
  if (!id) {
    return '/browse';
  }

  if (type === 'movie') {
    return `/movies/${encodeURIComponent(id)}`;
  }
  if (type === 'book') {
    return `/books/${encodeURIComponent(id)}`;
  }
  if (type === 'game') {
    return `/games/${encodeURIComponent(id)}`;
  }
  return `/music/${encodeURIComponent(id)}`;
};

const getSummary = (item, type) => {
  if (type === 'book') {
    return item?.description || 'A curated read aligned with your taste profile.';
  }
  if (type === 'game') {
    return item?.description || 'A highly-rated interactive world worth your time.';
  }
  return 'A hand-selected recommendation crafted for your current vibe.';
};

function HomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [trendingItems, setTrendingItems] = useState([]);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const trendingRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const loadTrending = async () => {
      setLoadingTrending(true);
      try {
        const response = await endpoints.getMovies({ limit: 4, sort: 'rating' });
        const items = unwrapItems(response).map((item) => ({ ...item, type: 'movie' }));
        setTrendingItems(items.slice(0, 4));
      } catch (error) {
        console.error('Failed to load trending items:', error);
        setTrendingItems([]);
      } finally {
        setLoadingTrending(false);
      }
    };

    loadTrending();
  }, []);

  useEffect(() => {
    const loadRecommended = async () => {
      setLoadingRecommended(true);
      try {
        const [booksResponse, gamesResponse] = await Promise.all([
          endpoints.getBooks({ limit: 2, sort: 'rating' }),
          endpoints.getGames({ limit: 2, sort: 'rating' }),
        ]);

        const books = unwrapItems(booksResponse).map((item) => ({ ...item, type: 'book' }));
        const games = unwrapItems(gamesResponse).map((item) => ({ ...item, type: 'game' }));

        const mixed = [];
        const maxLength = Math.max(books.length, games.length);
        for (let i = 0; i < maxLength; i += 1) {
          if (books[i]) {
            mixed.push(books[i]);
          }
          if (games[i]) {
            mixed.push(games[i]);
          }
        }

        setRecommendedItems(mixed.slice(0, 4));
      } catch (error) {
        console.error('Failed to load recommended items:', error);
        setRecommendedItems([]);
      } finally {
        setLoadingRecommended(false);
      }
    };

    loadRecommended();
  }, []);

  const navItems = useMemo(
    () => [
      { label: 'Home', href: '/' },
      { label: 'Explore', href: '/browse' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
    []
  );

  const userInitial = (user?.name || 'U').charAt(0).toUpperCase();

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const scrollTrending = (direction) => {
    if (!trendingRef.current) {
      return;
    }

    trendingRef.current.scrollBy({
      left: direction === 'left' ? -360 : 360,
      behavior: 'smooth',
    });
  };

  const handleUserAction = (href) => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
    navigate(href);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-['Inter'] antialiased selection:bg-primary-container selection:text-on-primary">
      <nav className="sticky top-0 z-50 w-full bg-white/60 backdrop-blur-md shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-2xl font-bold tracking-tight text-on-surface"
          >
            Vibeify
          </button>

          <div className="hidden items-center gap-8 text-sm font-medium tracking-wide md:flex">
            {navItems.map((item) => {
              const isHome = item.href === '/';
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => navigate(item.href)}
                  className={[
                    'transition-colors',
                    isHome
                      ? 'border-b-2 border-primary pb-1 font-semibold text-primary'
                      : 'text-on-surface/70 hover:text-primary',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="rounded-lg p-2 transition-all duration-300 hover:bg-primary/10"
              aria-label="Search"
            >
              <Search size={20} className="text-primary" />
            </button>
            <button
              type="button"
              className="rounded-lg p-2 transition-all duration-300 hover:bg-primary/10"
              aria-label="Theme"
            >
              <Moon size={20} className="text-primary" />
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((previous) => !previous)}
                  className="flex items-center gap-2 rounded-lg p-2 transition-all duration-300 hover:bg-primary/10"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {userInitial}
                  </span>
                  <span className="hidden max-w-24 truncate text-sm text-on-surface md:block">{user?.name || 'User'}</span>
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl bg-surface-container-lowest p-2 shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)] outline outline-1 outline-outline-variant/15">
                    <button
                      type="button"
                      onClick={() => handleUserAction('/profile')}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-on-surface transition-colors hover:bg-surface-container-low"
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUserAction('/preferences')}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-on-surface transition-colors hover:bg-surface-container-low"
                    >
                      Preferences
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                        navigate('/');
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-on-surface transition-colors hover:bg-surface-container-low"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-lg p-2 transition-all duration-300 hover:bg-primary/10"
                aria-label="Login"
              >
                <User size={20} className="text-primary" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((previous) => !previous)}
              className="rounded-lg p-2 text-primary transition-all duration-300 hover:bg-primary/10 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="bg-surface-container-low px-5 pb-5 pt-2 md:hidden">
            <div className="space-y-1 rounded-xl bg-surface-container-lowest p-2 outline outline-1 outline-outline-variant/15">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(item.href);
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-on-surface hover:bg-surface-container-low"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      <main>
        <section className="relative flex h-[819px] flex-col items-center justify-center overflow-hidden px-8 text-center">
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-surface-container-low/50 to-surface" />
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-secondary-container/40 blur-[120px]" />

          <div className="relative z-10 mx-auto max-w-4xl space-y-8">
            <h1 className="text-5xl font-bold leading-tight tracking-tight text-on-surface md:text-[3.5rem]">
              Discover What <span className="italic text-primary">You&apos;ll Love</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-on-surface-variant">
              A curated universe of cinema, literature, and gaming tailored to your unique digital pulse. Explore
              recommendations hand-picked for your vibe.
            </p>

            <form onSubmit={handleSearchSubmit} className="group relative mx-auto mt-12 w-full max-w-2xl">
              <div className="absolute inset-0 blur-xl transition-all group-focus-within:bg-primary/10" />
              <div className="relative flex items-center rounded-full bg-surface-container-high px-6 py-4 shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)] outline outline-1 outline-outline-variant/15">
                <Search size={20} className="mr-3 text-on-surface-variant" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search for your next vibe..."
                  className="w-full border-none bg-transparent text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-0"
                />
                <button
                  type="submit"
                  className="ml-2 rounded-full bg-gradient-to-br from-[#8319da] to-[#c285ff] px-6 py-2 font-medium text-on-primary transition-transform hover:scale-105"
                >
                  Find
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-8 py-20">
          <div className="grid h-auto grid-cols-1 gap-6 md:h-[600px] md:grid-cols-4">
            {CATEGORY_CARDS.map((card) => (
              <button
                key={card.key}
                type="button"
                onClick={() => navigate(card.href)}
                className={[
                  'group relative overflow-hidden rounded-xl bg-surface-container-low text-left transition-all duration-300 hover:scale-[1.02]',
                  card.className,
                ].join(' ')}
              >
                <img
                  src={card.image}
                  alt={`${card.title} category`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className={`absolute inset-0 ${card.overlay}`} />

                {card.key === 'music' ? (
                  <div className="absolute inset-y-0 left-0 flex flex-col justify-center p-12">
                    <h3 className="mb-2 text-4xl font-bold text-on-primary">{card.title}</h3>
                    <p className="max-w-md text-on-primary/70">{card.description}</p>
                  </div>
                ) : (
                  <div className="absolute bottom-0 left-0 p-8">
                    {card.subtitle ? (
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-on-primary/80">
                        {card.subtitle}
                      </span>
                    ) : null}
                    <h3 className="text-2xl font-bold text-on-primary">{card.title}</h3>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="overflow-hidden bg-surface-container-low/30 py-20">
          <div className="mx-auto max-w-[1440px] px-8">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-primary">The Pulse</span>
                <h2 className="text-[1.75rem] font-bold tracking-tight text-on-surface">Trending Now</h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => scrollTrending('left')}
                  className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface outline outline-1 outline-outline-variant/15"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollTrending('right')}
                  className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface outline outline-1 outline-outline-variant/15"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div ref={trendingRef} className="hide-scrollbar flex gap-6 overflow-x-auto pb-8">
              {loadingTrending
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div key={`skeleton-${index}`} className="w-[320px] flex-none animate-pulse">
                      <div className="mb-4 h-[440px] rounded-xl bg-surface-container-high" />
                      <div className="mb-2 h-5 w-3/4 rounded bg-surface-container-high" />
                      <div className="h-4 w-1/2 rounded bg-surface-container-high" />
                    </div>
                  ))
                : trendingItems.map((item) => {
                    const detailPath = getDetailPath(item, item.type);
                    const tags = toGenreTags(item);
                    return (
                      <button
                        key={`${item.type}-${getItemId(item, item.type)}`}
                        type="button"
                        onClick={() => navigate(detailPath)}
                        className="group w-[320px] flex-none cursor-pointer text-left"
                      >
                        <div className="relative mb-4 h-[440px] overflow-hidden rounded-xl shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)] transition-all duration-300 group-hover:-translate-y-2">
                          <img src={getMediaImage(item, item.type)} alt={item.title || 'Trending media'} className="h-full w-full object-cover" />
                          <div className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-tighter text-white backdrop-blur-md">
                            Recommendation
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-colors group-hover:bg-black/40 group-hover:opacity-100">
                            <span className="rounded-full bg-white px-6 py-2 text-sm font-bold text-primary">View Details</span>
                          </div>
                        </div>
                        <h4 className="text-lg font-bold text-on-surface transition-colors group-hover:text-primary">{item.title || 'Untitled'}</h4>
                        <p className="text-sm text-on-surface-variant">{tags.length ? tags.join(' • ') : 'Featured • Curated'}</p>
                      </button>
                    );
                  })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-8 py-24">
          <div className="flex flex-col items-start gap-16 md:flex-row">
            <div className="md:sticky md:top-32 md:w-1/3">
              <h2 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-on-surface">
                Hand-Picked <br />
                <span className="text-primary">For Your Vibe.</span>
              </h2>
              <p className="mb-8 text-on-surface-variant">
                Our curators spent hours analyzing your taste. These aren&apos;t just algorithms; they&apos;re emotions
                captured in media. No filler, just pure resonance.
              </p>
              <button
                type="button"
                onClick={() => navigate('/about')}
                className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary"
              >
                Learn More About Our Process
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            <div className="grid w-full grid-cols-1 gap-10 sm:grid-cols-2 md:w-2/3">
              {loadingRecommended
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`recommended-skeleton-${index}`}
                      className={`rounded-xl bg-surface-container-lowest p-6 shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)] ${index % 2 === 1 ? 'sm:mt-12' : ''}`}
                    >
                      <div className="mb-6 h-64 animate-pulse rounded-lg bg-surface-container-high" />
                      <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-surface-container-high" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-surface-container-high" />
                    </div>
                  ))
                : recommendedItems.map((item, index) => {
                    const tags = toGenreTags(item);
                    const primaryTag = tags[0] || (item.type === 'book' ? 'Reading' : 'Gaming');
                    const secondaryTag = tags[1] || (item.type === 'book' ? 'Curated' : 'Top Pick');
                    const detailPath = getDetailPath(item, item.type);

                    return (
                      <article
                        key={`${item.type}-${getItemId(item, item.type)}`}
                        className={[
                          'group rounded-xl bg-surface-container-lowest p-6 shadow-[0_20px_40px_-10px_rgba(62,37,72,0.08)] transition-transform hover:scale-[1.03]',
                          index === 1 || index === 3 ? 'sm:mt-12' : '',
                        ].join(' ')}
                      >
                        <img
                          src={getMediaImage(item, item.type)}
                          alt={item.title || 'Recommendation item'}
                          className="mb-6 h-64 w-full rounded-lg object-cover"
                        />

                        <div className="mb-4 flex gap-2">
                          <span className="rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase text-on-secondary-container">
                            {primaryTag}
                          </span>
                          <span className="rounded-full bg-tertiary-container px-3 py-1 text-[10px] font-bold uppercase text-on-tertiary-container">
                            {secondaryTag}
                          </span>
                        </div>

                        <h4 className="mb-2 text-xl font-bold text-on-surface">{item.title || 'Untitled'}</h4>
                        <p className="truncate-2 mb-4 text-sm text-on-surface-variant">{getSummary(item, item.type)}</p>
                        <button
                          type="button"
                          onClick={() => navigate(detailPath)}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          {index < 2 ? 'Learn More' : 'View Details'}
                        </button>
                      </article>
                    );
                  })}
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full bg-[#f5f0f7] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 md:flex-row">
          <div className="text-lg font-semibold text-on-surface">Vibeify</div>
          <div className="text-xs font-normal text-on-surface/60">© 2024 Vibeify. The Digital Curator.</div>
          <div className="flex gap-8 text-xs font-semibold uppercase tracking-widest">
            <button
              type="button"
              onClick={() => navigate('/privacy')}
              className="text-on-surface/60 transition-colors hover:text-primary"
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => navigate('/terms')}
              className="text-on-surface/60 transition-colors hover:text-primary"
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => navigate('/contact')}
              className="text-on-surface/60 transition-colors hover:text-primary"
            >
              Feedback
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;