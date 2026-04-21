const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI =
	process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/recommendation_platform';

const DB_NAME = 'recommendation_platform';
const COLLECTION = 'books';

const GOOGLE_BOOKS_API_BASE =
	process.env.GOOGLE_BOOKS_BASE_URL || 'https://www.googleapis.com/books/v1';
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

if (!GOOGLE_BOOKS_API_KEY) {
	console.error('Missing GOOGLE_BOOKS_API_KEY in backend/.env');
	process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function toTrimmedString(value) {
	if (value === null || value === undefined) return null;
	const str = String(value).trim();
	return str === '' ? null : str;
}

function toNumber(value) {
	if (value === null || value === undefined || value === '') return null;
	const num = Number(value);
	return Number.isNaN(num) ? null : num;
}

function normalizeCategories(value) {
	if (!value) return [];

	if (Array.isArray(value)) {
		return value
			.map((item) => String(item).trim())
			.filter(Boolean);
	}

	if (typeof value === 'string') {
		return value
			.split(/[|,;/]+/)
			.map((item) => item.trim())
			.filter(Boolean);
	}

	return [];
}

async function googleBooksFetchByIsbn(isbn) {
	const url = new URL(`${GOOGLE_BOOKS_API_BASE}/volumes`);
	url.searchParams.set('q', `isbn:${isbn}`);
	url.searchParams.set('maxResults', '1');
	url.searchParams.set('key', GOOGLE_BOOKS_API_KEY);

	const res = await fetch(url.toString(), {
		headers: {
			Accept: 'application/json',
		},
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Google Books ${res.status}: ${text}`);
	}

	const data = await res.json();
	if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
		return null;
	}

	return data.items[0];
}

function extractBookData(item) {
	if (!item || !item.volumeInfo) return null;

	const info = item.volumeInfo;

	const description = toTrimmedString(info.description);
	const categories = normalizeCategories(info.categories);
	const pageCount = toNumber(info.pageCount);
	const lang = toTrimmedString(info.language);

	let cover = null;
	if (info.imageLinks) {
		cover =
			toTrimmedString(info.imageLinks.thumbnail) ||
			toTrimmedString(info.imageLinks.smallThumbnail) ||
			null;
	}

	return {
		description,
		categories,
		pageCount,
		lang,
		cover,
	};
}

async function enrichBooks() {
	await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
	const db = mongoose.connection.db;
	const books = db.collection(COLLECTION);

	try {
		const filter = {
			isbn: { $ne: null },
			$or: [
				{ enriched: false },
				{ description: null },
				{ description: { $exists: false } },
				{ categories: { $exists: false } },
				{ categories: { $size: 0 } },
				{ pageCount: null },
				{ pageCount: { $exists: false } },
				{ lang: null },
				{ lang: { $exists: false } },
			],
		};

		const total = await books.countDocuments(filter);
		console.log(`Starting Google Books enrichment for ${total} books...\n`);

		const cursor = books
			.find(filter, {
				projection: {
					_id: 1,
					isbn: 1,
					title: 1,
					author: 1,
					enriched: 1,
				},
			})
			.limit(100);

		let processed = 0;
		let updated = 0;
		let skipped = 0;
		let failed = 0;

		while (await cursor.hasNext()) {
			const book = await cursor.next();
			processed += 1;

			const isbn = toTrimmedString(book.isbn);

			if (!isbn) {
				skipped += 1;
				console.log(`[${processed}] Skipped (no isbn): ${book.title}`);
				continue;
			}

			try {
				const item = await googleBooksFetchByIsbn(isbn);

				if (!item) {
					await books.updateOne(
						{ _id: book._id },
						{
							$set: {
								enriched: true,
							},
						}
					);

					skipped += 1;
					console.log(`[${processed}] No match: ${book.title}`);
					await sleep(120);
					continue;
				}

				const extracted = extractBookData(item);

				const update = {
					description: extracted.description ?? null,
					categories: extracted.categories ?? [],
					pageCount: extracted.pageCount ?? null,
					lang: extracted.lang ?? null,
					enriched: true,
				};

				if (extracted.cover) {
					update.cover = extracted.cover;
				}

				await books.updateOne({ _id: book._id }, { $set: update });
				updated += 1;
				console.log(`[${processed}] Updated: ${book.title}`);

				await sleep(120);
			} catch (err) {
				failed += 1;
				console.log(`[${processed}] Failed: ${book.title} -> ${err.message}`);
				await sleep(300);
			}
		}

		console.log('\nDone.');
		console.log(`Processed: ${processed}`);
		console.log(`Updated:   ${updated}`);
		console.log(`Skipped:   ${skipped}`);
		console.log(`Failed:    ${failed}`);
	} catch (error) {
		console.error('Book enrichment failed:', error);
	} finally {
		await mongoose.disconnect();
	}
}

enrichBooks();