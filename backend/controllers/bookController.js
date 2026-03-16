const Book = require('../models/Book');
const { searchBooksWithFallback, getBookDetails } = require('../services/googleBooksService');

const getBooks = async (req, res) => {
	try {
		const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
		const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);

		const query = {};

		if (req.query.author) {
			query.author = { $regex: req.query.author, $options: 'i' };
		}

		if (req.query.year) {
			query.year = Number(req.query.year);
		}

		const sortBy = req.query.sortBy === 'year' ? 'year' : 'avgRating';
		const sort = { [sortBy]: -1 };

		const totalItems = await Book.countDocuments(query);
		const totalPages = Math.ceil(totalItems / limit) || 1;

		const books = await Book.find(query)
			.sort(sort)
			.skip((page - 1) * limit)
			.limit(limit);

		return res.status(200).json({
			success: true,
			data: {
				items: books,
				totalPages,
				currentPage: page,
				totalItems,
			},
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to fetch books' });
	}
};

const searchBooks = async (req, res) => {
	try {
		const { q } = req.query;

		if (!q) {
			return res.status(400).json({ success: false, message: 'Search query q is required' });
		}

		const results = await searchBooksWithFallback(q);

		return res.status(200).json({ success: true, data: results });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to search books' });
	}
};

const getBookByIsbn = async (req, res) => {
	try {
		const { isbn } = req.params;
		let book = await Book.findOne({ isbn });

		if (book) {
			if (!book.enriched) {
				book = await getBookDetails(isbn);
			}
			return res.status(200).json({ success: true, data: book });
		}

		// Not in DB — fetch from Google Books
		book = await getBookDetails(isbn);
		if (!book) {
			return res.status(404).json({ success: false, message: 'Book not found' });
		}

		return res.status(200).json({ success: true, data: book });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Failed to fetch book' });
	}
};

module.exports = {
	getBooks,
	searchBooks,
	getBookByIsbn,
};
