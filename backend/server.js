const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config({ path: __dirname + '/.env' });
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🚀 Recommendation Platform API is running!' });
});

// Routes
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/movies', require('./routes/movieRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/games', require('./routes/gameRoutes'));
app.use('/api/music', require('./routes/musicRoutes'));
app.use('/api/user', require('./routes/userRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});