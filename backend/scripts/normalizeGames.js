const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI =
	process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/recommendation_platform';

const DB_NAME = 'recommendation_platform';
const SOURCE_COLLECTION = 'games';
const BACKUP_COLLECTION = 'games_backup_before_normalize';

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

function normalizeGenres(value) {
	if (!value) return [];

	if (Array.isArray(value)) {
		return value
			.map((g) => String(g).trim())
			.filter(Boolean);
	}

	if (typeof value === 'string') {
		return value
			.split(/[|,;/]+/)
			.map((g) => g.trim())
			.filter(Boolean);
	}

	return [];
}

function normalizePlatform(value) {
	const platform = toTrimmedString(value)?.toLowerCase();

	if (platform === 'mobile') return 'mobile';
	if (platform === 'pc') return 'pc';

	return null;
}

function normalizeSource(value) {
	const source = toTrimmedString(value)?.toLowerCase();

	if (source === 'steam') return 'steam';
	if (source === 'googleplay') return 'googleplay';

	return null;
}

function normalizeInstalls(value) {
	const str = toTrimmedString(value);
	if (!str) return null;
	return str;
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

async function normalizeGames() {
	await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
	const db = mongoose.connection.db;
	const games = db.collection(SOURCE_COLLECTION);

	try {
		await backupCollection(db);

		const total = await games.countDocuments({});
		console.log(`Normalizing ${total} game documents...\n`);

		const cursor = games.find({});
		const bulkOps = [];
		let processed = 0;

		while (await cursor.hasNext()) {
			const doc = await cursor.next();

			const platform = normalizePlatform(doc.platform);
			const source = normalizeSource(doc.source);

			const normalized = {
				gameId: toTrimmedString(doc.gameId),
				title: toTrimmedString(doc.title),
				genres: normalizeGenres(doc.genres),
				platform,
				pcPlatform: platform === 'pc' ? toTrimmedString(doc.pcPlatform) : null,
				releaseYear: toNumber(doc.releaseYear),
				image: toTrimmedString(doc.image),
				developer: toTrimmedString(doc.developer),
				rating: toNumber(doc.rating),
				totalReviews: toNumber(doc.totalReviews),
				recommendations: toNumber(doc.recommendations),
				installs: normalizeInstalls(doc.installs),
				source,
				description: toTrimmedString(doc.description) ?? null,
				enriched: toBoolean(doc.enriched, false),
			};

			bulkOps.push({
				updateOne: {
					filter: { _id: doc._id },
					update: { $set: normalized },
				},
			});

			processed += 1;

			if (bulkOps.length === 500) {
				await games.bulkWrite(bulkOps);
				bulkOps.length = 0;
				console.log(`Processed ${processed}/${total}`);
			}
		}

		if (bulkOps.length) {
			await games.bulkWrite(bulkOps);
		}

		console.log(`\nDone. Normalized ${processed} game documents.`);
		console.log(`Backup collection kept as: ${BACKUP_COLLECTION}`);
	} catch (error) {
		console.error('Normalization failed:', error);
	} finally {
		await mongoose.disconnect();
	}
}

normalizeGames();