const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI =
	process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/recommendation_platform';

const DB_NAME = 'recommendation_platform';
const SOURCE_COLLECTION = 'musics';
const BACKUP_COLLECTION = 'musics_backup_before_normalize';

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

function normalizeGenres(doc) {
	const collected = [];

	if (Array.isArray(doc.genres)) {
		for (const g of doc.genres) {
			const value = toTrimmedString(g);
			if (value) collected.push(value);
		}
	}

	if (doc.genre) {
		const rawGenre = toTrimmedString(doc.genre);
		if (rawGenre) {
			rawGenre
				.split(/[|,;/]+/)
				.map((g) => g.trim())
				.filter(Boolean)
				.forEach((g) => collected.push(g));
		}
	}

	return [...new Set(collected)];
}

async function backupCollection(db) {
	const existing = await db.listCollections({ name: BACKUP_COLLECTION }).toArray();

	if (existing.length > 0) {
		console.log(`Backup collection "${BACKUP_COLLECTION}" already exists. Skipping backup.`);
		return;
	}

	console.log(`Creating backup collection: ${BACKUP_COLLECTION}`);
	await db
		.collection(SOURCE_COLLECTION)
		.aggregate([{ $match: {} }, { $out: BACKUP_COLLECTION }])
		.toArray();
	console.log('Backup created successfully.\n');
}

async function normalizeMusic() {
	await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
	const db = mongoose.connection.db;
	const musics = db.collection(SOURCE_COLLECTION);

	try {
		await backupCollection(db);

		const total = await musics.countDocuments({});
		console.log(`Normalizing ${total} music documents...\n`);

		const cursor = musics.find({});
		const bulkOps = [];
		let processed = 0;

		while (await cursor.hasNext()) {
			const doc = await cursor.next();

			const normalized = {
				trackId: toTrimmedString(doc.trackId),
				title: toTrimmedString(doc.title),
				artist: toTrimmedString(doc.artist),
				album: toTrimmedString(doc.album),
				genre: toTrimmedString(doc.genre),
				popularity: toNumber(doc.popularity),
				explicit: toBoolean(doc.explicit, false),
				durationSec: toNumber(doc.durationSec),

				cover: toTrimmedString(doc.cover) ?? null,
				previewUrl: toTrimmedString(doc.previewUrl) ?? null,
				spotifyUrl: toTrimmedString(doc.spotifyUrl) ?? null,
				enriched: toBoolean(doc.enriched, false),

				lastfmId: toTrimmedString(doc.lastfmId) ?? null,
				lastfmUrl: toTrimmedString(doc.lastfmUrl) ?? null,
				albumArt: toTrimmedString(doc.albumArt) ?? null,

				genres: normalizeGenres(doc),
			};

			bulkOps.push({
				updateOne: {
					filter: { _id: doc._id },
					update: { $set: normalized },
				},
			});

			processed += 1;

			if (bulkOps.length === 500) {
				await musics.bulkWrite(bulkOps);
				bulkOps.length = 0;
				console.log(`Processed ${processed}/${total}`);
			}
		}

		if (bulkOps.length) {
			await musics.bulkWrite(bulkOps);
		}

		console.log(`\nDone. Normalized ${processed} music documents.`);
		console.log(`Backup collection kept as: ${BACKUP_COLLECTION}`);
	} catch (error) {
		console.error('Normalization failed:', error);
	} finally {
		await mongoose.disconnect();
	}
}

normalizeMusic();