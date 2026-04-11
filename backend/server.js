const express = require('express');
const dotenv  = require('dotenv');
const cors    = require('cors');
const connectDB = require('./config/db');

dotenv.config({ path: __dirname + '/.env' });
connectDB();

const app = express();

app.use(cors());
app.use('/api/ai', require('./routes/aiRoutes'));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🚀 Recommendation Platform API is running!' });
});
// ADD THIS temporarily to server.js (after your middleware, before routes)
app.get('/debug/spotify', async (req, res) => {
  try {
    const axios = require('axios');
    const clientId     = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    // Step 1: get token
    const tokenRes = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    const token = tokenRes.data.access_token;

    // Step 2: test a real search call
    const searchRes = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: 'coldplay', type: 'track', limit: 1 },
    });

    res.json({
      tokenOk: true,
      searchOk: true,
      sample: searchRes.data.tracks.items[0]?.name,
    });
  } catch (err) {
    res.json({
      tokenOk: false,
      error: err.response?.data || err.message,
      status: err.response?.status,
    });
  }
});

// Routes for authentication, movies, books, games, music, and user profile
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/movies', require('./routes/movieRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/games', require('./routes/gameRoutes'));
app.use('/api/music', require('./routes/musicRoutes'));
app.use('/api/user', require('./routes/userRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});