const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SearchLog = require('../models/SearchLog');
const Movie = require('../models/Movie');
const Book = require('../models/Book');
const Game = require('../models/Game');
const Music = require('../models/Music');
const bcrypt = require('bcryptjs');
const { escapeRegex, validateSearch, validatePagination, validateType } = require('../utils/inputSanitizer');

const generateToken = (id, role = 'user') => {
	return jwt.sign({ id, role }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRE,
	});
};

const sanitizeUser = (userDoc) => {
	const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
	delete user.password;
	return user;
};

const isValidObjectId = (id) => require('mongoose').Types.ObjectId.isValid(id);

const serializeUserSummary = (userDoc) => {
	const user = sanitizeUser(userDoc);
	const favorites = Array.isArray(user.favorites) ? user.favorites : [];

	return {
		_id: user._id,
		name: user.name,
		email: user.email,
		role: user.role,
		favoritesCount: favorites.length,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	};
};

const serializeUserDetail = (userDoc) => {
	const user = sanitizeUser(userDoc);
	const favorites = Array.isArray(user.favorites) ? user.favorites : [];
	const recentFavorites = [...favorites]
		.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0))
		.slice(0, 5);

	return {
		_id: user._id,
		name: user.name,
		email: user.email,
		role: user.role,
		bio: user.bio || '',
		favoritesCount: favorites.length,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
		recentFavorites,
	};
};

const buildUserQuery = ({ search = '', role = '', status = '' } = {}) => {
	const query = {};

	const searchValidation = validateSearch(search, 100);
	if (!searchValidation.valid) {
		return { error: searchValidation.error };
	}

	const searchValue = searchValidation.value;
	if (searchValue) {
		const safeSearch = escapeRegex(searchValue);
		query.$or = [
			{ name: { $regex: safeSearch, $options: 'i' } },
			{ email: { $regex: safeSearch, $options: 'i' } },
		];
	}

	if (role) {
		if (!['user', 'admin'].includes(role)) {
			return { error: 'Invalid role filter' };
		}
		query.role = role;
	}

	return { query };
};

// Admin Login
const adminLogin = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ success: false, message: 'Email and password are required' });
		}

		const user = await User.findOne({ email: email.toLowerCase() });

		if (!user || user.role !== 'admin') {
			return res.status(403).json({ success: false, message: 'Admin access required' });
		}

		if (!user.isVerified) {
			return res.status(401).json({ success: false, message: 'Admin account not verified' });
		}

		const isMatch = await user.matchPassword(password);
		if (!isMatch) {
			return res.status(401).json({ success: false, message: 'Invalid credentials' });
		}

		// Generate token with admin role
		const token = generateToken(user._id, 'admin');

		return res.status(200).json({
			success: true,
			data: {
				token,
				user: sanitizeUser(user),
			},
		});
	} catch (error) {
		console.error('Admin login error:', error);
		return res.status(500).json({ success: false, message: 'Failed to login' });
	}
};

// Get Current Admin User
const getAdminMe = async (req, res) => {
	try {
		// req.user is set by the protect middleware
		const user = await User.findById(req.user._id).select('-password');

		if (!user) {
			return res.status(401).json({ success: false, message: 'User not found' });
		}

		if (user.role !== 'admin') {
			return res.status(403).json({ success: false, message: 'Admin access required' });
		}

		return res.status(200).json({
			success: true,
			data: sanitizeUser(user),
		});
	} catch (error) {
		console.error('Get admin me error:', error);
		return res.status(500).json({ success: false, message: 'Failed to fetch admin user' });
	}
};

// Get Admin Dashboard Stats
const getDashboardStats = async (req, res) => {
	try {
		const [
			totalMovies,
			totalBooks,
			totalMusic,
			totalGames,
			totalUsers,
			activeUsers,
			blockedUsers,
			adminUsers,
			totalSearchLogs,
		] = await Promise.all([
			Movie.countDocuments(),
			Book.countDocuments(),
			Music.countDocuments(),
			Game.countDocuments(),
			User.countDocuments(),
			User.countDocuments({ isVerified: true }),
			User.countDocuments({ status: 'blocked' }),
			User.countDocuments({ role: 'admin' }),
			SearchLog.countDocuments(),
		]);

		const totalContent = totalMovies + totalBooks + totalMusic + totalGames;

		return res.status(200).json({
			success: true,
			data: {
				totalMovies,
				totalBooks,
				totalMusic,
				totalGames,
				totalContent,
				totalUsers,
				adminUsers,
				totalSearchLogs,
			},
		});
	} catch (error) {
		console.error('Dashboard stats error:', error);
		return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
	}
};

const getAllUsers = async (req, res) => {
	try {
		const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;
		const pagination = validatePagination(page, limit, 100);
		if (!pagination.valid) {
			return res.status(400).json({ success: false, message: pagination.error });
		}
		const pageNum = pagination.page;
		const limitNum = pagination.limit;
		const skip = (pageNum - 1) * limitNum;
		const searchValue = typeof search === 'string' ? search.trim() : '';
		const roleValue = typeof role === 'string' ? role.trim() : '';
		const statusValue = typeof status === 'string' ? status.trim() : '';
		const filters = buildUserQuery({ search: searchValue, role: roleValue, status: statusValue });

		if (filters.error) {
			return res.status(400).json({ success: false, message: filters.error });
		}

		const query = filters.query || {};
		const [total, users] = await Promise.all([
			User.countDocuments(query),
			User.find(query)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limitNum)
				.select('-password')
				.lean(),
		]);

		return res.status(200).json({
			success: true,
			data: {
				users: users.map((user) => ({
					_id: user._id,
					name: user.name,
					email: user.email,
					role: user.role,
					bio: user.bio || '',
					favoritesCount: Array.isArray(user.favorites) ? user.favorites.length : 0,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
				})),
				total,
				page: pageNum,
				totalPages: Math.ceil(total / limitNum) || 1,
			},
		});
	} catch (error) {
		console.error('Get all users error:', error);
		return res.status(500).json({ success: false, message: 'Failed to fetch users' });
	}
};

const getUserById = async (req, res) => {
	try {
		const { id } = req.params;
		if (!isValidObjectId(id)) {
			return res.status(400).json({ success: false, message: 'Invalid user ID' });
		}

		const user = await User.findById(id).select('-password');
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		return res.status(200).json({
			success: true,
			data: {
				user: serializeUserDetail(user),
			},
		});
	} catch (error) {
		console.error('Get user by id error:', error);
		return res.status(500).json({ success: false, message: 'Failed to fetch user' });
	}
};

const updateUser = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, email, role } = req.body || {};

		if (!isValidObjectId(id)) {
			return res.status(400).json({ success: false, message: 'Invalid user ID' });
		}

		const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		const updates = {};
		if (typeof name === 'string') {
			const trimmedName = name.trim();
			if (trimmedName.length < 2 || trimmedName.length > 50) {
				return res.status(400).json({ success: false, message: 'Name must be between 2 and 50 characters' });
			}
			updates.name = trimmedName;
		}

		if (typeof email === 'string') {
			const normalizedEmail = email.trim().toLowerCase();
			if (!normalizedEmail) {
				return res.status(400).json({ success: false, message: 'Email is required' });
			}
			const existingEmailUser = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
			if (existingEmailUser) {
				return res.status(400).json({ success: false, message: 'Email already in use' });
			}
			updates.email = normalizedEmail;
		}

		if (typeof role === 'string') {
			if (!['user', 'admin'].includes(role)) {
				return res.status(400).json({ success: false, message: 'Invalid role' });
			}

			if (String(req.user._id) === String(id) && role !== 'admin') {
				return res.status(403).json({ success: false, message: 'You cannot remove your own admin role' });
			}

			if (user.role === 'admin' && role === 'user') {
				const adminCount = await User.countDocuments({ role: 'admin' });
				if (adminCount <= 1) {
					return res.status(403).json({ success: false, message: 'Cannot remove last admin' });
				}
			}

			updates.role = role;
		}

		Object.assign(user, updates);
		await user.save();

		return res.status(200).json({
			success: true,
			message: 'User updated successfully',
			data: { user: serializeUserSummary(user) },
		});
	} catch (error) {
		console.error('Update user error:', error);
		return res.status(500).json({ success: false, message: 'Failed to update user' });
	}
};

const updateUserRole = async (req, res) => {
	try {
		const { id } = req.params;
		const { role } = req.body || {};

		if (!isValidObjectId(id)) {
			return res.status(400).json({ success: false, message: 'Invalid user ID' });
		}

		if (!['user', 'admin'].includes(role)) {
			return res.status(400).json({ success: false, message: 'Invalid role' });
		}

		const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		if (String(req.user._id) === String(id) && role !== 'admin') {
			return res.status(403).json({ success: false, message: 'You cannot remove your own admin role' });
		}

		if (user.role === 'admin' && role === 'user') {
			const adminCount = await User.countDocuments({ role: 'admin' });
			if (adminCount <= 1) {
				return res.status(403).json({ success: false, message: 'Cannot remove last admin' });
			}
		}

		user.role = role;
		await user.save();

		return res.status(200).json({
			success: true,
			message: 'User role updated successfully',
			data: { user: serializeUserSummary(user) },
		});
	} catch (error) {
		console.error('Update user role error:', error);
		return res.status(500).json({ success: false, message: 'Failed to update user role' });
	}
};

const deleteUser = async (req, res) => {
	try {
		const { id } = req.params;
		if (!isValidObjectId(id)) {
			return res.status(400).json({ success: false, message: 'Invalid user ID' });
		}

		if (String(req.user._id) === String(id)) {
			return res.status(403).json({ success: false, message: 'Cannot delete yourself' });
		}

		const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		if (user.role === 'admin') {
			const adminCount = await User.countDocuments({ role: 'admin' });
			if (adminCount <= 1) {
				return res.status(403).json({ success: false, message: 'Cannot remove last admin' });
			}
		}

		await User.findByIdAndDelete(id);

		return res.status(200).json({
			success: true,
			message: 'User deleted successfully',
		});
	} catch (error) {
		console.error('Delete user error:', error);
		return res.status(500).json({ success: false, message: 'Failed to delete user' });
	}
};

// Helper to normalize documents
const normalizeMovie = (doc) => ({
	_id: doc._id,
	title: doc.title,
	type: 'movie',
	genre: doc.genres || doc.genre || [],
	year: doc.year || doc.releaseYear || null,
	language: doc.language || null,
	rating: doc.avgRating || doc.rating || null,
	description: doc.description || null,
	imageUrl: doc.poster || doc.image || doc.poster || null,
	originalData: doc,
});

const normalizeBook = (doc) => ({
	_id: doc._id,
	title: doc.title,
	type: 'book',
	genre: doc.categories || doc.genre || [],
	year: doc.year || doc.publishedYear || null,
	language: doc.lang || doc.language || null,
	rating: doc.avgRating || doc.rating || null,
	description: doc.description || null,
	imageUrl: doc.cover || doc.thumbnail || null,
	originalData: doc,
});

const normalizeMusic = (doc) => ({
	_id: doc._id,
	title: doc.title || doc.trackName || doc.name,
	type: 'music',
	genre: doc.genres || doc.genre || null,
	year: doc.year || null,
	language: doc.language || null,
	rating: doc.rating || doc.popularity || null,
	description: doc.description || null,
	imageUrl: doc.cover || doc.albumArt || null,
	artist: doc.artist || null,
	originalData: doc,
});

const normalizeGame = (doc) => ({
	_id: doc._id,
	title: doc.title || doc.name,
	type: 'game',
	genre: doc.genres || doc.genre || [],
	year: doc.releaseYear || doc.releaseYear || null,
	language: doc.language || null,
	rating: doc.rating || null,
	description: doc.description || null,
	imageUrl: doc.image || doc.background_image || null,
	originalData: doc,
});

// Get all content (combined from movies, books, musics, games)
const getAllContent = async (req, res) => {
	try {
		const { type, page = 1, limit = 25, search = '' } = req.query;
		const pagination = validatePagination(page, limit, 100);
		if (!pagination.valid) {
			return res.status(400).json({ success: false, message: pagination.error });
		}
		const pageNum = pagination.page;
		const lim = pagination.limit;
		const skip = (pageNum - 1) * lim;

		const typeValidation = validateType(type);
		if (!typeValidation.valid) {
			return res.status(400).json({ success: false, message: typeValidation.error });
		}
		const typeValue = typeValidation.value === 'all' ? null : typeValidation.value;

		const searchValidation = validateSearch(search, 100);
		if (!searchValidation.valid) {
			return res.status(400).json({ success: false, message: searchValidation.error });
		}
		const searchValue = searchValidation.value;
		const searchRegex = searchValue ? new RegExp(escapeRegex(searchValue), 'i') : null;

		// If a specific non-all type is requested, query only that collection
		if (typeValue) {
			let Model;
			let normalize;
			if (typeValue === 'movie') {
				Model = Movie; normalize = normalizeMovie;
			} else if (typeValue === 'book') {
				Model = Book; normalize = normalizeBook;
			} else if (typeValue === 'music') {
				Model = Music; normalize = normalizeMusic;
			} else if (typeValue === 'game') {
				Model = Game; normalize = normalizeGame;
			} else {
				return res.status(400).json({ success: false, message: 'Invalid type' });
			}

			const query = {};
			if (searchRegex) {
				// match title/name or genre/categories/genres
				query.$or = [
					{ title: searchRegex },
					{ name: searchRegex },
					{ genres: searchRegex },
					{ categories: searchRegex },
					{ genre: searchRegex },
				];
			}

			const total = await Model.countDocuments(query);
			const docs = await Model.find(query).sort({ createdAt: -1 }).skip(skip).limit(lim).lean();
			const items = docs.map(normalize);

			return res.status(200).json({
				success: true,
				data: {
					items,
					total,
					page: pageNum,
					totalPages: Math.ceil(total / lim),
				},
			});
		}

		// No type: combine using aggregation (union)
		// We'll use aggregation with $unionWith starting from Movie
		const moviePipeline = [];
		if (searchRegex) {
			moviePipeline.push({ $match: { $or: [{ title: searchRegex }, { genres: searchRegex }] } });
		}
		moviePipeline.push({ $project: { doc: '$$ROOT' } });

		const bookPipeline = [];
		if (searchRegex) {
			bookPipeline.push({ $match: { $or: [{ title: searchRegex }, { categories: searchRegex }] } });
		}
		bookPipeline.push({ $project: { doc: '$$ROOT' } });

		const musicPipeline = [];
		if (searchRegex) {
			musicPipeline.push({ $match: { $or: [{ title: searchRegex }, { artist: searchRegex }, { genres: searchRegex }] } });
		}
		musicPipeline.push({ $project: { doc: '$$ROOT' } });

		const gamePipeline = [];
		if (searchRegex) {
			gamePipeline.push({ $match: { $or: [{ title: searchRegex }, { genres: searchRegex }] } });
		}
		gamePipeline.push({ $project: { doc: '$$ROOT' } });

		// total count aggregation
		const countAgg = [
			...moviePipeline,
			{ $unionWith: { coll: 'books', pipeline: bookPipeline } },
			{ $unionWith: { coll: 'musics', pipeline: musicPipeline } },
			{ $unionWith: { coll: 'games', pipeline: gamePipeline } },
			{ $count: 'total' },
		];

		const totalRes = await Movie.aggregate(countAgg);
		const total = (totalRes[0] && totalRes[0].total) || 0;

		// items aggregation with pagination
		const itemsAgg = [
			...moviePipeline,
			{ $unionWith: { coll: 'books', pipeline: bookPipeline } },
			{ $unionWith: { coll: 'musics', pipeline: musicPipeline } },
			{ $unionWith: { coll: 'games', pipeline: gamePipeline } },
			{ $sort: { 'doc.createdAt': -1 } },
			{ $skip: skip },
			{ $limit: lim },
			{ $replaceRoot: { newRoot: '$doc' } },
		];

		const rawDocs = await Movie.aggregate(itemsAgg);
		const items = rawDocs.map((d) => {
			// determine collection by presence of known fields
			if (d.tmdbId || d.poster || d.genres) return normalizeMovie(d);
			if (d.isbn || d.cover || d.categories) return normalizeBook(d);
			if (d.trackId || d.artist || d.albumArt || d.genres) return normalizeMusic(d);
			if (d.gameId || d.image || d.releaseYear || d.genres) return normalizeGame(d);
			return { _id: d._id, title: d.title || d.name || '', type: 'unknown', originalData: d };
		});

		return res.status(200).json({ success: true, data: { items, total, page: pageNum, totalPages: Math.ceil(total / lim) } });
	} catch (error) {
		console.error('Get content error:', error);
		return res.status(500).json({ success: false, message: 'Failed to fetch content' });
	}
};

// Get single content
const getContentById = async (req, res) => {
	try {
		const { id } = req.params;

		// Try find in each collection
		let doc = await Movie.findById(id).lean();
		if (doc) return res.status(200).json({ success: true, data: { content: normalizeMovie(doc) } });
		doc = await Book.findById(id).lean();
		if (doc) return res.status(200).json({ success: true, data: { content: normalizeBook(doc) } });
		doc = await Music.findById(id).lean();
		if (doc) return res.status(200).json({ success: true, data: { content: normalizeMusic(doc) } });
		doc = await Game.findById(id).lean();
		if (doc) return res.status(200).json({ success: true, data: { content: normalizeGame(doc) } });

		return res.status(404).json({ success: false, message: 'Content not found' });
	} catch (error) {
		console.error('Get content by id error:', error);
		return res.status(500).json({ success: false, message: 'Failed to fetch content' });
	}
};

// Create content
const createContent = async (req, res) => {
	try {
		const { title, type, genre, description, year, language, imageUrl, tags, rating, externalApiId } = req.body;

		if (!title || !type) {
			return res.status(400).json({ success: false, message: 'Title and type are required' });
		}

		let created;
		if (type === 'movie') {
			created = await Movie.create({ title, year, genres: Array.isArray(genre) ? genre : (genre ? [genre] : []), poster: imageUrl, description, avgRating: rating });
		} else if (type === 'book') {
			created = await Book.create({ title, year, categories: Array.isArray(genre) ? genre : (genre ? [genre] : []), cover: imageUrl, description, avgRating: rating });
		} else if (type === 'music') {
			created = await Music.create({ title, artist: req.body.artist || '', genres: Array.isArray(genre) ? genre : (genre ? [genre] : []), cover: imageUrl, description });
		} else if (type === 'game') {
			created = await Game.create({ title, releaseYear: year, genres: Array.isArray(genre) ? genre : (genre ? [genre] : []), image: imageUrl, description, rating });
		} else {
			return res.status(400).json({ success: false, message: 'Invalid content type' });
		}

		return res.status(201).json({ success: true, data: { content: created }, message: 'Content created successfully' });
	} catch (error) {
		console.error('Create content error:', error);
		return res.status(500).json({ success: false, message: 'Failed to create content' });
	}
};

// Update content
const updateContent = async (req, res) => {
	try {
		const { id, type } = req.params;
		const payload = req.body || {};

		let Model;
		if (type === 'movie') Model = Movie;
		else if (type === 'book') Model = Book;
		else if (type === 'music') Model = Music;
		else if (type === 'game') Model = Game;
		else return res.status(400).json({ success: false, message: 'Invalid type' });

		const doc = await Model.findById(id);
		if (!doc) return res.status(404).json({ success: false, message: 'Content not found' });

		// apply updates conservatively
		Object.keys(payload).forEach((k) => {
			doc[k] = payload[k];
		});

		await doc.save();
		return res.status(200).json({ success: true, data: { content: doc }, message: 'Content updated successfully' });
	} catch (error) {
		console.error('Update content error:', error);
		return res.status(500).json({ success: false, message: 'Failed to update content' });
	}
};

// Delete content
const deleteContent = async (req, res) => {
	try {
		const { id, type } = req.params;
		let Model;
		if (type === 'movie') Model = Movie;
		else if (type === 'book') Model = Book;
		else if (type === 'music') Model = Music;
		else if (type === 'game') Model = Game;
		else return res.status(400).json({ success: false, message: 'Invalid type' });

		const content = await Model.findByIdAndDelete(id);
		if (!content) return res.status(404).json({ success: false, message: 'Content not found' });

		return res.status(200).json({ success: true, message: 'Content deleted successfully' });
	} catch (error) {
		console.error('Delete content error:', error);
		return res.status(500).json({ success: false, message: 'Failed to delete content' });
	}
};

// Get search logs
const getSearchLogs = async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			type = '',
			search = '',
			startDate,
			endDate,
		} = req.query;

		const pagination = validatePagination(page, limit, 100);
		if (!pagination.valid) {
			return res.status(400).json({ success: false, message: pagination.error });
		}
		const pageNum = pagination.page;
		const limitNum = pagination.limit;
		const skip = (pageNum - 1) * limitNum;

		const typeValidation = validateType(type);
		if (!typeValidation.valid) {
			return res.status(400).json({ success: false, message: typeValidation.error });
		}
		const typeValue = typeValidation.value === 'all' ? null : typeValidation.value;

		const searchValidation = validateSearch(search, 100);
		if (!searchValidation.valid) {
			return res.status(400).json({ success: false, message: searchValidation.error });
		}
		const searchValue = searchValidation.value;

		let query = {};

		console.log('[admin] fetching search logs:', {
			page: pageNum,
			limit: limitNum,
			type,
			search,
			startDate,
			endDate,
		});

		if (searchValue) {
			query.query = { $regex: escapeRegex(searchValue), $options: 'i' };
		}

		if (typeValue) {
			query.detectedType = typeValue;
		}

		if (startDate || endDate) {
			query.createdAt = {};
			if (startDate) {
				query.createdAt.$gte = new Date(startDate);
			}
			if (endDate) {
				const end = new Date(endDate);
				end.setHours(23, 59, 59, 999);
				query.createdAt.$lte = end;
			}
		}

		const total = await SearchLog.countDocuments(query);
		const logs = await SearchLog.find(query)
			.populate('userId', 'name email')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limitNum);

		const totalPages = Math.ceil(total / limitNum) || 1;

		return res.status(200).json({
			logs,
			total,
			page: pageNum,
			totalPages,
		});
	} catch (error) {
		console.error('Get search logs error:', error);
		return res.status(500).json({ success: false, message: 'Failed to fetch search logs' });
	}
};

// Log a search (helper for recommendation pipeline)
const logSearch = async (req, res) => {
	try {
		const { query, detectedType, detectedIntent, resultsCount, userId } = req.body;

		if (!query) {
			return res.status(400).json({ success: false, message: 'Query is required' });
		}

		const searchLog = new SearchLog({
			query,
			detectedType: detectedType || 'unknown',
			detectedIntent,
			resultsCount: resultsCount || 0,
			userId,
			userAgent: req.get('user-agent'),
		});

		await searchLog.save();

		return res.status(201).json({
			success: true,
			data: { searchLog },
			message: 'Search logged successfully',
		});
	} catch (error) {
		console.error('Log search error:', error);
		return res.status(500).json({ success: false, message: 'Failed to log search' });
	}
};

// Delete search log
const deleteSearchLog = async (req, res) => {
	try {
		const { id } = req.params;

		if (!id) {
			return res.status(400).json({ success: false, message: 'Search log ID is required' });
		}

		const searchLog = await SearchLog.findByIdAndDelete(id);

		if (!searchLog) {
			return res.status(404).json({ success: false, message: 'Search log not found' });
		}

		return res.status(200).json({
			success: true,
			message: 'Search log deleted successfully',
		});
	} catch (error) {
		console.error('Delete search log error:', error);
		return res.status(500).json({ success: false, message: 'Failed to delete search log' });
	}
};

module.exports = {
	adminLogin,
	getAdminMe,
	getDashboardStats,
	getAllUsers,
	getUserById,
	updateUser,
	deleteUser,
	updateUserRole,
	getAllContent,
	getContentById,
	createContent,
	updateContent,
	deleteContent,
	getSearchLogs,
	logSearch,
	deleteSearchLog,
};
