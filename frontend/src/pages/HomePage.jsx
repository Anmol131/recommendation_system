import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as endpoints from '../api/endpoints';

const CATEGORY_CARDS = [
  {
    key: 'movies',
    title: 'Movies',
    subtitle: 'Cinephile Dream',
    description: '',
    href: '/explore?type=movies',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
    className: 'md:col-span-2',
    overlay: 'bg-gradient-to-t from-black/80 via-black/20 to-transparent',
  },
  {
    key: 'books',
    title: 'Books',
    subtitle: '',
    description: '',
    href: '/explore?type=books',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
    className: '',
    overlay: 'bg-gradient-to-t from-black/80 via-black/20 to-transparent',
  },
  {
    key: 'games',
    title: 'Games',
    subtitle: '',
    description: '',
    href: '/explore?type=games',
    image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800',
    className: '',
    overlay: 'bg-gradient-to-t from-black/80 via-black/20 to-transparent',
  },
  {
    key: 'music',
    title: 'Music',
    subtitle: '',
    description: 'Find the rhythm of your life through our curated sonic landscapes.',
    href: '/explore?type=music',
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
  if (type === 'movie') {
    return '/explore?type=movies';
  }
  if (type === 'book') {
    return '/explore?type=books';
  }
  if (type === 'game') {
    return '/explore?type=games';
  }
  if (type === 'music') {
    return '/explore?type=music';
  }
  return '/explore';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [trendingItems, setTrendingItems] = useState([]);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const trendingRef = useRef(null);

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

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }
    navigate(`/explore?q=${encodeURIComponent(trimmed)}`);
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

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text font-['Inter'] antialiased selection:bg-primary selection:text-white transition-colors duration-300">
      <main>
        <section className="relative flex h-screen max-h-[900px] flex-col items-center justify-center overflow-hidden px-8 text-center">
          {/* Gradient background - more refined */}
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-light-surface dark:from-dark-surface via-light-bg dark:via-dark-bg to-light-bg dark:to-dark-bg" />
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/5 dark:bg-primary/10 blur-[160px]" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/5 dark:bg-secondary/8 blur-[160px]" />
          <div className="absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-accent/3 dark:bg-accent/5 blur-[120px]" />

          <div className="relative z-10 mx-auto max-w-5xl space-y-8">
            <h1 className="text-6xl font-extrabold leading-tight tracking-tight text-light-text dark:text-dark-text md:text-7xl">
              Discover What<br /><span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">You&apos;ll Love</span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
              Dive into a curated universe of movies, books, games, and music tailored to your unique taste.
            </p>

            <form onSubmit={handleSearchSubmit} className="group relative mx-auto mt-12 w-full max-w-3xl">
              <div className="relative flex items-center rounded-2xl bg-light-surface dark:bg-dark-surface px-8 py-4 shadow-lg dark:shadow-lg border border-light-surface-alt dark:border-dark-surface-alt transition-all group-focus-within:shadow-xl group-focus-within:border-primary">
                <Search size={22} className="mr-4 text-light-text-secondary dark:text-dark-text-secondary flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search for your next discovery..."
                  className="w-full border-none bg-transparent text-light-text dark:text-dark-text placeholder:text-light-text-secondary dark:placeholder:text-dark-text-secondary focus:outline-none focus:ring-0 text-lg"
                />
                <button
                  type="submit"
                  className="ml-4 flex-shrink-0 rounded-lg bg-gradient-to-r from-primary to-secondary px-8 py-2 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  Find
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 py-24">
          <div className="grid h-auto grid-cols-1 gap-6 md:h-[600px] md:grid-cols-4">
            {CATEGORY_CARDS.map((card) => (
              <button
                key={card.key}
                type="button"
                onClick={() => navigate(card.href)}
                className={[
                  'group relative overflow-hidden rounded-2xl bg-light-surface-alt dark:bg-dark-surface text-left transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl',
                  card.className,
                ].join(' ')}
              >
                <img
                  src={card.image}
                  alt={`${card.title} category`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-125"
                />
                <div className={`absolute inset-0 ${card.overlay}`} />

                {card.key === 'music' ? (
                  <div className="absolute inset-y-0 left-0 flex flex-col justify-center p-12">
                    <h3 className="mb-2 text-5xl font-bold text-white group-hover:text-accent transition-colors">{card.title}</h3>
                    <p className="max-w-md text-white/80 group-hover:text-white transition-colors">{card.description}</p>
                  </div>
                ) : (
                  <div className="absolute bottom-0 left-0 p-8">
                    {card.subtitle ? (
                      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/80 group-hover:text-accent transition-colors">
                        {card.subtitle}
                      </span>
                    ) : null}
                    <h3 className="text-3xl font-bold text-white group-hover:text-accent transition-colors">{card.title}</h3>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="overflow-hidden bg-light-surface-alt dark:bg-dark-surface py-24">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-16 flex items-end justify-between">
              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-primary">Trending</span>
                <h2 className="text-4xl font-bold tracking-tight text-light-text dark:text-dark-text">Popular Right Now</h2>
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
                        <p className="text-sm text-light-text dark:text-dark-text/95">{tags.length ? tags.join(' • ') : 'Featured • Curated'}</p>
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
              <p className="mb-8 text-light-text dark:text-dark-text/95 leading-relaxed">
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
                        <p className="truncate-2 mb-4 text-sm text-light-text dark:text-dark-text/95">{getSummary(item, item.type)}</p>
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

      <footer className="w-full bg-[#f5f0f7] dark:bg-slate-800/50 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 md:flex-row">
          <div className="text-lg font-semibold text-on-surface dark:text-white">Vibeify</div>
          <div className="text-xs font-normal text-on-surface/60 dark:text-white/60">© 2024 Vibeify. The Digital Curator.</div>
          <div className="flex gap-8 text-xs font-semibold uppercase tracking-widest">
            <button
              type="button"
              onClick={() => navigate('/privacy')}
              className="text-on-surface/60 dark:text-white/60 transition-colors hover:text-primary dark:hover:text-purple-400"
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => navigate('/terms')}
              className="text-on-surface/60 dark:text-white/60 transition-colors hover:text-primary dark:hover:text-purple-400"
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => navigate('/contact')}
              className="text-on-surface/60 dark:text-white/60 transition-colors hover:text-primary dark:hover:text-purple-400"
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
