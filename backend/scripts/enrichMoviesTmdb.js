const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI =
	process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/recommendation_platform';

const DB_NAME = 'recommendation_platform';
const COLLECTION = 'movies';
const TMDB_API_BASE = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;

if (!TMDB_TOKEN) {
	console.error('Missing TMDB_READ_ACCESS_TOKEN in backend/.env');
	process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function tmdbFetch(endpoint) {
	const res = await fetch(`${TMDB_API_BASE}${endpoint}`, {
		headers: {
			Authorization: `Bearer ${TMDB_TOKEN}`,
			Accept: 'application/json',
		},
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`TMDb ${res.status}: ${text}`);
	}

	return res.json();
}

async function getImageBaseUrl() {
	const config = await tmdbFetch('/configuration');
	const secureBase = config?.images?.secure_base_url || 'https://image.tmdb.org/t/p/';
	const posterSizes = config?.images?.poster_sizes || [];

	const chosenSize = posterSizes.includes('w500')
		? 'w500'
		: posterSizes[posterSizes.length - 1] || 'w500';

	return `${secureBase}${chosenSize}`;
}

function pickTrailer(videos) {
	if (!videos || !Array.isArray(videos.results)) return null;

	const trailer =
		videos.results.find(
			(v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official === true
		) ||
		videos.results.find(
			(v) => v.site === 'YouTube' && v.type === 'Trailer'
		) ||
		null;

	return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
}

function pickCast(credits, limit = 5) {
	if (!credits || !Array.isArray(credits.cast)) return null;

	const names = credits.cast
		.slice(0, limit)
		.map((person) => person?.name)
		.filter(Boolean);

	return names.length ? names : null;
}

function pickDirector(credits) {
	if (!credits || !Array.isArray(credits.crew)) return null;

	const director =
		credits.crew.find((person) => person?.job === 'Director') ||
		credits.crew.find((person) => person?.department === 'Directing');

	return director?.name || null;
}

function pickKeywords(keywordPayload) {
	if (!keywordPayload) return [];

	const source =
		keywordPayload.keywords ||
		keywordPayload.results ||
		[];

	if (!Array.isArray(source)) return [];

	return source
		.map((item) => item?.name)
		.filter(Boolean)
		.map((name) => String(name).trim())
		.filter(Boolean);
}

async function enrichMovies() {
	await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
	const db = mongoose.connection.db;
	const movies = db.collection(COLLECTION);

	try {
		const posterBase = await getImageBaseUrl();

		const filter = {
	title: /^John Wick$/i,
	tmdbId: { $ne: null },
	tmdbFailed: { $ne: true },
};

		const total = await movies.countDocuments(filter);
		console.log(`Starting TMDb enrichment for ${total} high-value unenriched movies...\n`);

		const cursor = movies.find(
			filter,
			{
				projection: {
					_id: 1,
					title: 1,
					tmdbId: 1,
					ratingCount: 1,
					enriched: 1,
				},
			}
		)
		.sort({ ratingCount: -1 })
		.limit(1);

		let processed = 0;
		let updated = 0;
		let skipped = 0;
		let failed = 0;

		while (await cursor.hasNext()) {
			const movie = await cursor.next();
			processed += 1;

			const tmdbId = movie.tmdbId;

			if (!tmdbId) {
				skipped += 1;
				console.log(`[${processed}] Skipped (no tmdbId): ${movie.title}`);
				continue;
			}

			try {
				const details = await tmdbFetch(
					`/movie/${tmdbId}?language=en-US&append_to_response=credits,videos,keywords`
				);

				const update = {
					description: details?.overview?.trim() || null,
					poster: details?.poster_path ? `${posterBase}${details.poster_path}` : null,
					cast: pickCast(details?.credits, 5),
					trailer: pickTrailer(details?.videos),
					director: pickDirector(details?.credits),
					keywords: pickKeywords(details?.keywords),
					enriched: true,
					tmdbFailed: false,
					tmdbError: null,
				};

				await movies.updateOne({ _id: movie._id }, { $set: update });
				updated += 1;
				console.log(`[${processed}] Updated: ${movie.title}`);

				await sleep(150);
			} catch (err) {
				failed += 1;

				await movies.updateOne(
					{ _id: movie._id },
					{
						$set: {
							tmdbFailed: true,
							tmdbError: err.message,
						},
					}
				);

				console.log(`[${processed}] Failed: ${movie.title} -> ${err.message}`);
				await sleep(400);
			}
		}

		console.log('\nDone.');
		console.log(`Processed: ${processed}`);
		console.log(`Updated:   ${updated}`);
		console.log(`Skipped:   ${skipped}`);
		console.log(`Failed:    ${failed}`);
	} catch (error) {
		console.error('Enrichment script failed:', error);
	} finally {
		await mongoose.disconnect();
	}
}

enrichMovies();