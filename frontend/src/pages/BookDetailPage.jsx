import { useEffect, useState } from 'react';
import { FaAmazon, FaBook, FaYoutube } from 'react-icons/fa';
import { FiExternalLink, FiStar } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import HorizontalScroll from '../components/HorizontalScroll';
import ShareButton from '../components/ShareButton';
import UserRating from '../components/UserRating';
import * as endpoints from '../api/endpoints';

function getInitials(value) {
  return (value || 'Book')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function StarRating({ ratingOutOf5 }) {
  const stars = Math.round(Number(ratingOutOf5 || 0));
  return (
    <div className="inline-flex items-center gap-1 text-gold">
      {Array.from({ length: 5 }).map((_, index) => (
        <FiStar key={index} fill={index < stars ? 'currentColor' : 'none'} />
      ))}
    </div>
  );
}

function BookDetailPage() {
  const { isbn } = useParams();
  const [book, setBook] = useState(null);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(true);

  useEffect(() => {
    const loadBook = async () => {
      setLoading(true);
      try {
        const response = await endpoints.getBookByIsbn(isbn);
        setBook(response.data || null);
      } catch {
        setBook(null);
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [isbn]);

  useEffect(() => {
    const loadSimilar = async () => {
      if (!book) {
        setSimilarBooks([]);
        setSimilarLoading(false);
        return;
      }

      setSimilarLoading(true);
      try {
        const query = book.author || book.title;
        const response = await endpoints.searchBooks(query);
        const filtered = (response.data || []).filter((item) => item.isbn !== book.isbn);
        setSimilarBooks(filtered.slice(0, 8));
      } catch {
        setSimilarBooks([]);
      } finally {
        setSimilarLoading(false);
      }
    };

    loadSimilar();
  }, [book]);

  if (loading) {
    return <div className="px-6 py-24 text-center text-muted">Loading book details...</div>;
  }

  if (!book) {
    return <div className="px-6 py-24 text-center text-muted">Book not found.</div>;
  }

  const goodreadsUrl = `https://www.goodreads.com/search?q=${encodeURIComponent(book.isbn || '').replace(/%20/g, '+')}`;
  const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(book.isbn || '').replace(/%20/g, '+')}`;
  const youtubeReviewUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${book.title || ''} ${book.author || ''} book review`.trim()).replace(/%20/g, '+')}`;
  const googleBooksUrl = `https://books.google.com/books?vid=ISBN${book.isbn}`;

  return (
    <div className="px-6 py-8 sm:px-8 lg:px-10">
      <section className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {book.cover ? (
            <img
              src={book.cover}
              alt={book.title}
              className="h-full w-full rounded-xl border border-surface2 object-cover"
            />
          ) : (
            <div className="flex min-h-[420px] w-full items-center justify-center rounded-xl bg-gradient-to-br from-primaryDark to-primary text-6xl font-bold text-bg">
              {getInitials(book.title)}
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <h1 className="text-4xl font-bold text-white">{book.title}</h1>
          <p className="mt-2 text-lg text-muted">by {book.author || 'Unknown author'}</p>

          {book.year && (
            <div className="mt-3 inline-flex rounded-xl bg-primary/20 px-4 py-2 text-lg font-semibold text-primary">
              Published {book.year}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {book.publisher && (
              <span className="rounded-full bg-surface2 px-3 py-1 text-muted">Publisher: {book.publisher}</span>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3 text-gold">
            <StarRating ratingOutOf5={book.avgRating} />
            <span className="font-semibold text-white">{Number(book.avgRating || 0).toFixed(1)}</span>
            <span className="text-muted">({book.ratingCount || 0} ratings)</span>
          </div>

          <p className="mt-6 text-base leading-relaxed text-muted">{book.description || 'No description available.'}</p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {book.pageCount && (
              <span className="rounded-full bg-surface2 px-3 py-1 text-sm text-muted">📄 {book.pageCount} pages</span>
            )}
            {book.lang && (
              <span className="rounded-full bg-primary/20 px-3 py-1 text-sm text-primary uppercase">{book.lang}</span>
            )}
          </div>

          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">Actions</h2>
            <div className="flex flex-wrap gap-2">
              <a
                href={googleBooksUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-bg transition hover:brightness-110"
              >
                Find on Google Books
                <FiExternalLink size={14} />
              </a>
              <a
                href={goodreadsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#b6906b] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
              >
                <FaBook />
                Goodreads
              </a>
              <a
                href={amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#FF9900] px-4 py-2 text-sm font-medium text-black transition hover:brightness-110"
              >
                <FaAmazon />
                Amazon
              </a>
              <a
                href={youtubeReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#FF0000] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
              >
                <FaYoutube />
                Book Review
              </a>
              <ShareButton />
              <UserRating itemType="book" itemId={book.isbn} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <HorizontalScroll
          title="Similar Books"
          items={similarBooks}
          type="book"
          loading={similarLoading}
        />
      </section>
    </div>
  );
}

export default BookDetailPage;