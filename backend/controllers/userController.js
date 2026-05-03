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

const updateUsername = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'Name is required and must be a string' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({ success: false, message: 'Name must be between 2 and 50 characters' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = trimmedName;
    await user.save();

    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;

    return res.status(200).json({ success: true, data: sanitizedUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update username' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword; // This will be hashed by the pre-save hook
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update password' });
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

const getFavorites = async (req, res) => {
  try {
    console.log('getFavorites called for user:', req.user._id);
    const user = await User.findById(req.user._id).select('favorites');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const sortedFavorites = [...user.favorites].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    return res.status(200).json({ success: true, data: sortedFavorites });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user favorites' });
  }
};

const addFavorite = async (req, res) => {
  try {
    console.log('addFavorite called for user:', req.user._id, 'body:', req.body);
    const { itemId, itemType, title, imageUrl, year, rating, genre } = req.body;

    if (!itemId || !itemType || !title) {
      return res.status(400).json({
        success: false,
        message: 'itemId, itemType, and title are required',
      });
    }

    const allowedTypes = ['movie', 'book', 'game', 'music'];

    if (!allowedTypes.includes(itemType)) {
      return res.status(400).json({ success: false, message: 'Invalid itemType' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already exists
    const existingIndex = user.favorites.findIndex(fav => fav.itemId === itemId && fav.itemType === itemType);

    if (existingIndex !== -1) {
      return res.status(200).json({
        success: true,
        message: 'Already in favorites',
        data: user.favorites[existingIndex]
      });
    }

    const newFavorite = {
      itemId,
      itemType,
      title,
      imageUrl: imageUrl || '',
      year: year || '',
      rating: rating || null,
      genre: genre || '',
      savedAt: new Date()
    };

    user.favorites.push(newFavorite);
    await user.save();

    return res.status(201).json({ success: true, data: newFavorite });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to add favorite' });
  }
};

const removeFavorite = async (req, res) => {
  try {
    console.log('removeFavorite called for user:', req.user._id, 'params:', req.params);
    const { itemType, itemId } = req.params;

    if (!itemType || !itemId) {
      return res.status(400).json({
        success: false,
        message: 'itemType and itemId are required',
      });
    }

    const allowedTypes = ['movie', 'book', 'game', 'music'];

    if (!allowedTypes.includes(itemType)) {
      return res.status(400).json({ success: false, message: 'Invalid itemType' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const initialLength = user.favorites.length;
    user.favorites = user.favorites.filter(fav => !(fav.itemId === itemId && fav.itemType === itemType));

    if (user.favorites.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }

    await user.save();

    return res.status(200).json({ success: true, message: 'Favorite removed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to remove favorite' });
  }
};

const checkFavorite = async (req, res) => {
  try {
    console.log('checkFavorite called for user:', req.user._id, 'params:', req.params);
    const { itemType, itemId } = req.params;

    if (!itemType || !itemId) {
      return res.status(400).json({
        success: false,
        message: 'itemType and itemId are required',
      });
    }

    const allowedTypes = ['movie', 'book', 'game', 'music'];

    if (!allowedTypes.includes(itemType)) {
      return res.status(400).json({ success: false, message: 'Invalid itemType' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isFavorite = user.favorites.some(fav => fav.itemId === itemId && fav.itemType === itemType);

    return res.status(200).json({ success: true, isFavorite });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to check favorite status' });
  }
};

module.exports = {
  getProfile,
  updatePreferences,
  updateAvatar,
  updateBio,
  updateUsername,
  updatePassword,
  addHistory,
  getHistory,
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
};
