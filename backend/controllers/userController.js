const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

const updatePreferences = async (req, res) => {
  try {
    const { movies, books, games, music } = req.body;

    const checks = [
      { key: 'movies', value: movies },
      { key: 'books', value: books },
      { key: 'games', value: games },
      { key: 'music', value: music },
    ];

    for (const check of checks) {
      if (check.value !== undefined && !Array.isArray(check.value)) {
        return res.status(400).json({
          success: false,
          message: `preferences.${check.key} must be an array`,
        });
      }
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.preferences = {
      movies: Array.isArray(movies) ? movies : user.preferences.movies,
      books: Array.isArray(books) ? books : user.preferences.books,
      games: Array.isArray(games) ? games : user.preferences.games,
      music: Array.isArray(music) ? music : user.preferences.music,
    };

    await user.save();

    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;

    return res.status(200).json({ success: true, data: sanitizedUser.preferences });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;

    if (typeof avatar !== 'string' || !avatar.trim()) {
      return res.status(400).json({ success: false, message: 'Avatar is required' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.avatar = avatar.trim();
    await user.save();

    return res.status(200).json({ success: true, data: { avatar: user.avatar } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update avatar' });
  }
};

const updateBio = async (req, res) => {
  try {
    if (typeof req.body?.bio !== 'string') {
      return res.status(400).json({ success: false, message: 'Bio must be a string' });
    }

    const bioInput = req.body.bio;
    const bio = bioInput.trim();

    if (bio.length > 150) {
      return res.status(400).json({ success: false, message: 'Bio must be 150 characters or fewer' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.bio = bio;
    await user.save();

    return res.status(200).json({ success: true, data: { bio: user.bio } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update bio' });
  }
};

const addHistory = async (req, res) => {
  try {
    const { type, itemId, action, rating } = req.body;

    if (!type || !itemId || !action) {
      return res.status(400).json({
        success: false,
        message: 'type, itemId and action are required',
      });
    }

    const allowedTypes = ['movie', 'book', 'game', 'music'];
    const allowedActions = ['liked', 'viewed', 'rated'];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid history type' });
    }

    if (!allowedActions.includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid history action' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.history.unshift({ type, itemId, action, rating: rating ?? null, date: new Date() });
    user.history = user.history.slice(0, 100);

    await user.save();

    return res.status(201).json({ success: true, data: user.history[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to add history item' });
  }
};

const getHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('history');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const sortedHistory = [...user.history].sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({ success: true, data: sortedHistory });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user history' });
  }
};

module.exports = {
  getProfile,
  updatePreferences,
  updateAvatar,
  updateBio,
  addHistory,
  getHistory,
};
