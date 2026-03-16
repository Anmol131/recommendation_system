const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(` MongoDB Connected: ${conn.connection.host}`);

    // Drop the old non-sparse trackId_1 index so MongoDB rebuilds it as sparse
    try {
      await mongoose.connection.collection('musics').dropIndex('trackId_1');
      console.log('[DB] Dropped old trackId_1 index — will be recreated as sparse');
    } catch (e) {
      // Index already dropped or does not exist — safe to ignore
    }
  } catch (error) {
    console.error(` MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;