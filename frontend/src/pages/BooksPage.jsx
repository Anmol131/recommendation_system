import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, Search, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as endpoints from '../api/endpoints';

const LIMIT = 12;

const GENRES = ['Fiction', 'Non-Fiction', 'Mystery', 'Sci-Fi', 'Fantasy', 'Romance', 'Biography', 'History'];

const YEAR_OPTIONS = [
  { label: 'All Years', value: 'all' },
  { label: '2024', value: '2024' },
  { label: '2023', value: '2023' },
  { label: '2022', value: '2022' },
  { label: 'Earlier', value: 'earlier' },
];

const CATEGORY_LINKS = [
  { label: 'All', path: '/explore', active: false },
  { label: 'Movies', path: '/movies', active: false },
  { label: 'Books', path: '/books', active: true },
  { label: 'Games', path: '/games', active: false },
  { label: 'Music', path: '/music', active: false },
];

const unwrapItems = (payload) => {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const unwrapTotal = (payload, fallbackLength = 0) => {
  const value = payload?.data?.totalItems ?? payload?.totalItems;
  return typeof value === 'number' ? value : fallbackLength;
};

const normalizeGenres = (book) => {
  if (Array.isArray(book?.genres)) {
    return book.genres
      .flatMap((genre) => String(genre).split(/[|,]/))
      .map((genre) => genre.trim())
      .filter(Boolean);
  }

  if (typeof book?.genres === 'string') {
    return book.genres
      .split(/[|,]/)
      .map((genre) => genre.trim())
      .filter(Boolean);
  }

  if (typeof book?.genre === 'string') {
    return [book.genre.trim()].filter(Boolean);
  }

  if (typeof book?.lang === 'string' && book.lang.trim().length > 0) {
    return [book.lang.trim()];
  }

  return [];
};

const getBookYear = (book) => {
  const value = book?.year || book?.publishedDate;
  if (!value) return '';
  const text = String(value);
  const match = text.match(/(19|20)\d{2}/);
  return match ? match[0] : text.slice(0, 4);
};

const getBookRating = (book) => {
  const candidate = book?.avgRating ?? book?.averageRating ?? book?.rating;
  const value = Number(candidate);
  return Number.isNaN(value) ? 0 : value;
};

const getBookId = (book) => book?.isbn || book?._id || book?.id;

const getBookCover = (book) => book?.cover || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=900';

function LoadingSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl bg-white/75 shadow-[0_14px_35px_-18px_rgba(62,37,72,0.2)] animate-pulse"
        >
          <div className="aspect-[2/3] bg-surface-container-high" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-2/3 rounded bg-surface-container-high" />
            <div className="h-3 w-1/2 rounded bg-surface-container-high" />
            <div className="h-3 w-1/4 rounded bg-surface-container-high" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BooksPage() {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [author, setAuthor] = useState('');
  const [debouncedAuthor, setDebouncedAuthor] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');

  const [page, setPage] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const authorDebounceRef = useRef(null);

  useEffect(() => {
    if (authorDebounceRef.current) {
      clearTimeout(authorDebounceRef.current);
    }

    authorDebounceRef.current = setTimeout(() => {
      setDebouncedAuthor(author.trim());
    }, 400);

    return () => {
      if (authorDebounceRef.current) {
        clearTimeout(authorDebounceRef.current);
      }
    };
  }, [author]);

  useEffect(() => {
    setPage(1);
    setBooks([]);
    setHasMore(true);
  }, [selectedGenres, debouncedAuthor, selectedYear]);

  useEffect(() => {
    let cancelled = false;

    const loadBooks = async () => {
      const isFirstPage = page === 1;
      if (isFirstPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = {
          limit: LIMIT,
          sort: 'rating',
          page,
          author: debouncedAuthor || undefined,
          year: selectedYear === 'all' || selectedYear === 'earlier' ? undefined : Number(selectedYear),
        };

        const response = await endpoints.getBooks(params);
        if (cancelled) return;

        const incoming = unwrapItems(response);
        const apiTotal = unwrapTotal(response, incoming.length);

        const filtered = incoming.filter((book) => {
          const genres = normalizeGenres(book);
          const yearText = getBookYear(book);

          const genreOk = selectedGenres.length === 0
            || selectedGenres.some((selectedGenre) => genres.includes(selectedGenre));

          const yearOk = selectedYear === 'all'
            || (selectedYear === 'earlier' ? Number(yearText || 0) < 2022 : yearText === selectedYear);

          return genreOk && yearOk;
        });

        setTotalBooks(apiTotal);
        setBooks((current) => (isFirstPage ? filtered : [...current, ...filtered]));
        setHasMore(page * LIMIT < apiTotal && incoming.length > 0);
      } catch {
        if (cancelled) return;
        if (page === 1) {
          setBooks([]);
          setTotalBooks(0);
        }
        setHasMore(false);
      } finally {
        if (cancelled) return;
        setLoading(false);
        setLoadingMore(false);
      }
    };

    loadBooks();

    return () => {
      cancelled = true;
    };
  }, [page, selectedGenres, debouncedAuthor, selectedYear]);

  const handleGenreToggle = (genre) => {
    setSelectedGenres((current) => {
      if (current.includes(genre)) {
        return current.filter((entry) => entry !== genre);
      }
      return [...current, genre];
    });
  };

  const handleResetFilters = () => {
    setSelectedGenres([]);
    setAuthor('');
    setDebouncedAuthor('');
    setSelectedYear('all');
  };

  const handleShowMore = () => {
    if (!hasMore || loadingMore) return;
    setPage((current) => current + 1);
  };

  const visibleCount = books.length;
  const totalLabel = useMemo(() => totalBooks || visibleCount, [totalBooks, visibleCount]);

  return (
    <div className="min-h-screen bg-[#fff3fd] pb-16 text-[#3e2548] font-['Inter'] antialiased">
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 sm:px-8 lg:px-10">
        <nav className="mb-12 flex items-center justify-center gap-6 sm:gap-8">
          {CATEGORY_LINKS.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={[
                'relative px-1 pb-4 text-sm font-bold uppercase tracking-[0.2em] transition-colors duration-300',
                item.active
                  ? "text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary after:content-['']"
                  : 'text-on-surface-variant/50 hover:text-primary',
              ].join(' ')}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <header className="mb-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="mb-2 text-5xl font-bold leading-tight tracking-tight text-on-background">Books</h1>
              <p className="max-w-xl text-lg text-on-surface-variant">
                From literary classics to modern thought-leadership, find your next great read.
              </p>
            </div>

            <div className="group relative w-full md:w-96">
              <input
                type="text"
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="Search by author name..."
                className="h-14 w-full rounded-xl bg-surface-container-high px-5 pr-12 text-on-surface placeholder:text-on-surface-variant/70 transition-all duration-300 focus:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Search size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 transition-colors group-focus-within:text-primary" />
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-10 lg:flex-row">
          <aside className="w-full lg:w-64 lg:flex-shrink-0">
            <div className="space-y-7 rounded-2xl bg-surface-container-lowest p-6 shadow-[0_18px_45px_-26px_rgba(62,37,72,0.22)] lg:sticky lg:top-24">
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant/70">Genre</h2>
                <div className="space-y-2.5">
                  {GENRES.map((genre) => (
                    <label key={genre} className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedGenres.includes(genre)}
                        onChange={() => handleGenreToggle(genre)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm text-on-surface-variant transition-colors hover:text-primary">{genre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant/70">Author</h2>
                <input
                  type="text"
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                  placeholder="Filter by author..."
                  className="w-full rounded-lg bg-surface-container px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant/70">Year</h2>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                    className="w-full appearance-none rounded-lg bg-surface-container px-3 py-2.5 pr-10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {YEAR_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70" />
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full rounded-xl bg-surface-container-highest py-3 text-xs font-bold uppercase tracking-widest text-primary shadow-[0_14px_35px_-24px_rgba(62,37,72,0.24)] transition-all duration-300 hover:bg-primary hover:text-on-primary"
              >
                Reset Filters
              </button>
            </div>
          </aside>

          <section className="min-w-0 flex-1">
            {loading ? (
              <LoadingSkeletons />
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                {books.map((book, index) => {
                  const id = getBookId(book);
                  const genres = normalizeGenres(book);
                  const topBadge = book?.lang || genres[0] || 'Book';
                  const bottomGenre = genres[0] || 'Curated';

                  return (
                    <article
                      key={`${id || 'book'}-${index}`}
                      className="group flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_14px_35px_-18px_rgba(62,37,72,0.2)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_28px_55px_-25px_rgba(62,37,72,0.26)]"
                    >
                      <div className="relative aspect-[2/3] overflow-hidden">
                        <img
                          src={getBookCover(book)}
                          alt={book?.title || 'Book cover'}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />

                        <div className="absolute left-4 top-4">
                          <span className="rounded-full bg-white/25 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_-16px_rgba(0,0,0,0.45)] backdrop-blur-md">
                            {topBadge}
                          </span>
                        </div>
                      </div>

                      <div className="flex h-full flex-col p-5">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="line-clamp-1 text-xl font-bold text-on-surface transition-colors group-hover:text-primary">
                            {book?.title || 'Untitled Book'}
                          </h3>
                          <div className="inline-flex items-center gap-1 text-[#a03648]">
                            <Star size={14} fill="#a03648" color="#a03648" />
                            <span className="text-xs font-bold">{getBookRating(book).toFixed(1)}</span>
                          </div>
                        </div>

                        <p className="mb-5 line-clamp-1 text-sm text-on-surface-variant/80">{book?.author || 'Unknown author'}</p>

                        <div className="mt-auto flex items-center justify-between rounded-xl bg-surface-container-highest/45 px-3 py-2">
                          <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/80">
                            {bottomGenre}
                          </span>
                          <button
                            type="button"
                            onClick={() => id && navigate(`/books/${encodeURIComponent(String(id))}`)}
                            className="group/btn inline-flex items-center gap-1 text-xs font-bold text-primary"
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

            {!loading && books.length === 0 ? (
              <div className="rounded-2xl bg-white/70 px-6 py-14 text-center shadow-[0_14px_40px_-24px_rgba(62,37,72,0.2)]">
                <p className="text-lg font-semibold text-on-surface">No books matched your filters.</p>
                <p className="mt-2 text-sm text-on-surface-variant">Try broadening genre, year, or author.</p>
              </div>
            ) : null}

            {!loading && books.length > 0 ? (
              <div className="mt-16 flex flex-col items-center gap-4">
                {hasMore ? (
                  <button
                    type="button"
                    onClick={handleShowMore}
                    disabled={loadingMore}
                    className="group inline-flex items-center gap-2 rounded-full bg-surface-container-highest px-9 py-3 font-bold text-on-surface shadow-[0_14px_35px_-20px_rgba(62,37,72,0.2)] transition-all duration-300 hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loadingMore ? 'Loading more titles...' : 'Show more titles'}
                    <ChevronDown size={18} className="transition-transform duration-300 group-hover:translate-y-1" />
                  </button>
                ) : null}

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant/70">
                  Viewing {visibleCount} of {totalLabel} curations
                </p>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}

export default BooksPage;