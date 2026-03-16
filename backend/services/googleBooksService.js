const axios = require('axios');
const Book = require('../models/Book');

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
const GOOGLE_BOOKS_BASE_URL =
  process.env.GOOGLE_BOOKS_BASE_URL || 'https://www.googleapis.com/books/v1';

function extractIsbn(identifiers) {
  if (!identifiers || identifiers.length === 0) return null;
  const isbn13 = identifiers.find((i) => i.type === 'ISBN_13');
  const isbn10 = identifiers.find((i) => i.type === 'ISBN_10');
  return isbn13 ? isbn13.identifier : isbn10 ? isbn10.identifier : null;
}

function mapVolumeToBook(item) {
  const v = item.volumeInfo || {};
  const isbn = extractIsbn(v.industryIdentifiers);
  if (!isbn) return null;
  return {
    isbn,
    title: v.title || null,
    author: v.authors ? v.authors.join(', ') : null,
    year: v.publishedDate ? parseInt(v.publishedDate.slice(0, 4), 10) : null,
    publisher: v.publisher || null,
    cover: v.imageLinks
      ? v.imageLinks.thumbnail || v.imageLinks.smallThumbnail || null
      : null,
    avgRating: v.averageRating || null,
    ratingCount: v.ratingsCount || null,
    description: v.description || null,
    pageCount: v.pageCount || null,
    lang: v.language || null,
    enriched: true,
  };
}

async function searchBooks(query) {
  try {
    const response = await axios.get(`${GOOGLE_BOOKS_BASE_URL}/volumes`, {
      params: {
        q: query,
        key: GOOGLE_BOOKS_API_KEY,
        maxResults: 20,
      },
    });

    if (!response.data.items || response.data.items.length === 0) {
      console.warn('[GoogleBooks] No results for query:', query);
      return [];
    }
    const items = response.data.items;
    const mapped = items.map(mapVolumeToBook).filter(Boolean);

    await Promise.all(
      mapped.map((book) =>
        Book.findOneAndUpdate(
          { isbn: book.isbn },
          { $set: book },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        )
      )
    );

    return mapped;
  } catch (err) {
    console.error('googleBooksService.searchBooks error:', err.message);
    throw err;
  }
}

async function getBookDetails(isbn) {
  try {
    const response = await axios.get(`${GOOGLE_BOOKS_BASE_URL}/volumes`, {
      params: {
        q: `isbn:${isbn}`,
        key: GOOGLE_BOOKS_API_KEY,
      },
    });

    const items = response.data.items || [];
    if (items.length === 0) throw new Error(`No book found for ISBN: ${isbn}`);

    const mapped = mapVolumeToBook(items[0]);
    if (!mapped) throw new Error('Could not extract ISBN from book result');

    const book = await Book.findOneAndUpdate(
      { isbn: mapped.isbn },
      { $set: mapped },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    return book;
  } catch (err) {
    console.error('googleBooksService.getBookDetails error:', err.message);
    throw err;
  }
}

async function searchBooksWithFallback(query) {
  try {
    const results = await searchBooks(query);
    if (results && results.length > 0) return results;
    throw new Error('Empty results from Google Books');
  } catch (err) {
    console.error('Google Books searchBooks failed, falling back to MongoDB:', err.message);
    const fallback = await Book.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
    return fallback;
  }
}

module.exports = { searchBooks, getBookDetails, searchBooksWithFallback };
