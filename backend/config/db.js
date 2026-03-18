const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(` MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(` MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('connected', async () => {
  // Drop the old non-sparse trackId_1 index so MongoDB rebuilds it as sparse
  try {
    await mongoose.connection.collection('musics').dropIndex('trackId_1');
    console.log('[DB] Dropped old trackId_1 index — will be recreated as sparse');
  } catch (e) {
    // Index already dropped or does not exist — safe to ignore
  }

  try {
    await mongoose.connection.collection('movies').dropIndex('movieId_1');
    console.log('[DB] Dropped old movieId_1 index — will be recreated as sparse');
  } catch (e) {
    // already dropped or doesn't exist — safe to ignore
  }
});

module.exports = connectDB;