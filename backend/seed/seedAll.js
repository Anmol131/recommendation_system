const mongoose  = require('mongoose');
const fs        = require('fs');
const path      = require('path');
const csv       = require('csv-parser');
const dotenv    = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Movie = require('../models/Movie');
const Book  = require('../models/Book');
const Game  = require('../models/Game');
const Music = require('../models/Music');

// ─────────────────────────────────────────
// PATHS
// ─────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '../../data');

const FILES = {
  movies      : path.join(DATA_DIR, 'movies_final.csv'),
  books       : path.join(DATA_DIR, 'books_final.csv'),
  games_pc    : path.join(DATA_DIR, 'games_pc_final.csv'),
  games_mobile: path.join(DATA_DIR, 'games_mobile_final.csv'),
  music       : path.join(DATA_DIR, 'music_final.csv'),
};

// ─────────────────────────────────────────
// HELPER: Read CSV into array
// ─────────────────────────────────────────
const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end',  () => resolve(results))
      .on('error', reject);
  });
};

// ─────────────────────────────────────────
// HELPER: Split genres string to array
// ─────────────────────────────────────────
const splitGenres = (str, separator = ',') => {
  if (!str) return [];
  return str.split(separator).map(g => g.trim()).filter(Boolean);
};

// ─────────────────────────────────────────
// SEED MOVIES
// ─────────────────────────────────────────
const seedMovies = async () => {
  console.log('\n🎬 Seeding Movies...');
  const rows = await readCSV(FILES.movies);

  const docs = rows.map(r => ({
    movieId    : parseInt(r.movieId),
    title      : r.title?.trim(),
    year       : parseInt(r.year) || null,
    genres     : splitGenres(r.genres, '|'),
    avgRating  : parseFloat(r.avgRating) || null,
    ratingCount: parseInt(r.ratingCount) || 0,
    tmdbId     : parseInt(r.tmdbId) || null,
    imdbId     : parseInt(r.imdbId) || null,
  })).filter(d => d.movieId && d.title);

  const ops = docs.map(d => ({
    updateOne: {
      filter: { movieId: d.movieId },
      update: { $setOnInsert: d },
      upsert: true,
    }
  }));

  const result = await Movie.bulkWrite(ops);
  console.log(`  ✅ Movies: ${result.upsertedCount} inserted, ${result.matchedCount} already existed`);
};

// ─────────────────────────────────────────
// SEED BOOKS
// ─────────────────────────────────────────
const seedBooks = async () => {
  console.log('\n📚 Seeding Books...');
  const rows = await readCSV(FILES.books);

  const docs = rows.map(r => ({
    isbn       : r.isbn?.trim(),
    title      : r.title?.trim(),
    author     : r.author?.trim(),
    year       : parseInt(r.year) || null,
    publisher  : r.publisher?.trim(),
    cover      : r.coverMedium?.trim() || null,
    avgRating  : parseFloat(r.avgRating) || null,
    ratingCount: parseInt(r.ratingCount) || 0,
    lang    : null,
  })).filter(d => d.isbn && d.title);

  const ops = docs.map(d => ({
    updateOne: {
      filter: { isbn: d.isbn },
      update: { $setOnInsert: d },
      upsert: true,
    }
  }));

  const result = await Book.bulkWrite(ops);
  console.log(`  ✅ Books: ${result.upsertedCount} inserted, ${result.matchedCount} already existed`);
};

// ─────────────────────────────────────────
// SEED GAMES (PC + MOBILE)
// ─────────────────────────────────────────
const seedGames = async () => {
  console.log('\n🎮 Seeding Games...');

  // PC Games
  const pcRows  = await readCSV(FILES.games_pc);
  const pcDocs  = pcRows.map(r => ({
    gameId         : String(r.gameId),
    title          : r.title?.trim(),
    genres         : splitGenres(r.genres, ','),
    platform       : 'pc',
    pcPlatform     : r.pcPlatform?.trim() || null,
    releaseYear    : parseInt(r.releaseYear) || null,
    image          : r.image?.trim() || null,
    developer      : r.developer?.trim() || null,
    rating         : parseFloat(r.rating) || null,
    totalReviews   : parseInt(r.totalReviews) || 0,
    recommendations: parseInt(r.recommendations) || 0,
    source         : 'steam',
  })).filter(d => d.gameId && d.title);

  // Mobile Games
  const mobRows = await readCSV(FILES.games_mobile);
  const mobDocs = mobRows.map(r => ({
    gameId      : String(r.gameId),
    title       : r.title?.trim(),
    genres      : splitGenres(r.genres, ','),
    platform    : 'mobile',
    releaseYear : parseInt(r.releaseYear) || null,
    image       : r.image?.trim() || null,
    developer   : r.developer?.trim() || null,
    rating      : parseFloat(r.rating) || null,
    totalReviews: parseInt(r.totalReviews) || 0,
    installs    : r.installs?.trim() || null,
    source      : 'googleplay',
  })).filter(d => d.gameId && d.title);

  const allGames = [...pcDocs, ...mobDocs];

  const ops = allGames.map(d => ({
    updateOne: {
      filter: { gameId: d.gameId },
      update: { $setOnInsert: d },
      upsert: true,
    }
  }));

  const result = await Game.bulkWrite(ops);
  console.log(`  ✅ Games: ${result.upsertedCount} inserted, ${result.matchedCount} already existed`);
  console.log(`     PC: ${pcDocs.length} | Mobile: ${mobDocs.length}`);
};

// ─────────────────────────────────────────
// SEED MUSIC
// ─────────────────────────────────────────
const seedMusic = async () => {
  console.log('\n🎵 Seeding Music...');
  const rows = await readCSV(FILES.music);

  const docs = rows.map(r => ({
    trackId    : r.trackId?.trim(),
    title      : r.title?.trim(),
    artist     : r.artist?.trim(),
    album      : r.album?.trim(),
    genre      : r.genre?.trim(),
    popularity : parseInt(r.popularity) || 0,
    explicit   : r.explicit === 'True' || r.explicit === 'true',
    durationSec: parseInt(r.durationSec) || 0,
  })).filter(d => d.trackId && d.title);

  const ops = docs.map(d => ({
    updateOne: {
      filter: { trackId: d.trackId },
      update: { $setOnInsert: d },
      upsert: true,
    }
  }));

  const result = await Music.bulkWrite(ops);
  console.log(`  ✅ Music: ${result.upsertedCount} inserted, ${result.matchedCount} already existed`);
};

// ─────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────
const main = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    console.log('🌱 Starting seed...');

    await seedMovies();
    await seedBooks();
    await seedGames();
    await seedMusic();

    console.log('\n🎉 All data seeded successfully!');
    console.log('📊 Summary:');

    const [movies, books, games, music] = await Promise.all([
      Movie.countDocuments(),
      Book.countDocuments(),
      Game.countDocuments(),
      Music.countDocuments(),
    ]);

    console.log(`  🎬 Movies : ${movies}`);
    console.log(`  📚 Books  : ${books}`);
    console.log(`  🎮 Games  : ${games}`);
    console.log(`  🎵 Music  : ${music}`);
    console.log(`  📦 Total  : ${movies + books + games + music}`);

  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};


main();