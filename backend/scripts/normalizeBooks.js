const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI =
	process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/recommendation_platform';

const DB_NAME = 'recommendation_platform';
const SOURCE_COLLECTION = 'books';
const BACKUP_COLLECTION = 'books_backup_before_normalize';

function toNumber(value) {
	if (value === null || value === undefined || value === '') return null;

	if (typeof value === 'string') {
		const cleaned = value.replace(/,/g, '').trim();
		if (cleaned === '') return null;
		const num = Number(cleaned);
		return Number.isNaN(num) ? null : num;
	}

	const num = Number(value);
	return Number.isNaN(num) ? null : num;
}

function toTrimmedString(value) {
	if (value === null || value === undefined) return null;
	const str = String(value).trim();
	return str === '' ? null : str;
}

function toBoolean(value, fallback = false) {
	if (typeof value === 'boolean') return value;

	if (typeof value === 'string') {
		const lower = value.trim().toLowerCase();
		if (lower === 'true') return true;
		if (lower === 'false') return false;
	}

	return fallback;
}

async function backupCollection(db) {
	const existing = await db.listCollections({ name: BACKUP_COLLECTION }).toArray();

	if (existing.length > 0) {
		console.log(`Backup collection "${BACKUP_COLLECTION}" already exists. Skipping backup.`);
		return;
	}

	console.log(`Creating backup collection: ${BACKUP_COLLECTION}`);
	await db.collection(SOURCE_COLLECTION).aggregate([{ $match: {} }, { $out: BACKUP_COLLECTION }]).toArray();
	console.log('Backup created successfully.\n');
}

async function normalizeBooks() {
	await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
	const db = mongoose.connection.db;
	const books = db.collection(SOURCE_COLLECTION);

	try {
		await backupCollection(db);

		const total = await books.countDocuments({});
		console.log(`Normalizing ${total} book documents...\n`);

		const cursor = books.find({});
		const bulkOps = [];
		let processed = 0;

		while (await cursor.hasNext()) {
			const doc = await cursor.next();

			const normalized = {
				isbn: toTrimmedString(doc.isbn),
				title: toTrimmedString(doc.title),
				author: toTrimmedString(doc.author),
				year: toNumber(doc.year),
				publisher: toTrimmedString(doc.publisher),

				cover:
					toTrimmedString(doc.cover) ||
					toTrimmedString(doc.coverMedium) ||
					toTrimmedString(doc.coverSmall) ||
					null,

				avgRating: toNumber(doc.avgRating),
				ratingCount: toNumber(doc.ratingCount),

				description: toTrimmedString(doc.description) ?? null,
				pageCount: toNumber(doc.pageCount),
				lang: toTrimmedString(doc.lang) ?? null,
				enriched: toBoolean(doc.enriched, false),
			};

			bulkOps.push({
				updateOne: {
					filter: { _id: doc._id },
					update: { $set: normalized },
					upsert: false,
				},
			});

			processed += 1;

			if (bulkOps.length === 500) {
				await books.bulkWrite(bulkOps);
				bulkOps.length = 0;
				console.log(`Processed ${processed}/${total}`);
			}
		}

		if (bulkOps.length) {
			await books.bulkWrite(bulkOps);
		}

		console.log(`\nDone. Normalized ${processed} book documents.`);
		console.log(`Backup collection kept as: ${BACKUP_COLLECTION}`);
	} catch (error) {
		console.error('Normalization failed:', error);
	} finally {
		await mongoose.disconnect();
	}
}

normalizeBooks();