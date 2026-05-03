const express = require('express');
const {
	adminLogin,
	getDashboardStats,
	getAllContent,
	getContentById,
	createContent,
	updateContent,
	deleteContent,
	getSearchLogs,
	logSearch,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/adminAuthMiddleware');

const router = express.Router();

// Admin auth routes (no protection for login)
router.post('/login', adminLogin);

// Protected admin routes (requires authentication + admin role)
router.get('/dashboard', protect, adminOnly, getDashboardStats);

// Content management routes
router.get('/content', protect, adminOnly, getAllContent);
router.post('/content', protect, adminOnly, createContent);
router.get('/content/:id', protect, adminOnly, getContentById);
router.put('/content/:type/:id', protect, adminOnly, updateContent);
router.delete('/content/:type/:id', protect, adminOnly, deleteContent);

// Search logs routes
router.get('/search-logs', protect, adminOnly, getSearchLogs);
router.post('/search-logs', logSearch); // Can be called from AI service without auth

module.exports = router;
