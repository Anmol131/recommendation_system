const express = require('express');
const {
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
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/adminAuthMiddleware');

const router = express.Router();

// Admin auth routes (no protection for login)
router.post('/login', adminLogin);

// Get current admin user (requires valid admin token)
router.get('/me', protect, adminOnly, getAdminMe);

// Protected admin routes (requires authentication + admin role)
router.get('/dashboard', protect, adminOnly, getDashboardStats);

// User management routes
router.get('/users', protect, adminOnly, getAllUsers);
router.get('/users/:id', protect, adminOnly, getUserById);
router.put('/users/:id', protect, adminOnly, updateUser);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.patch('/users/:id/role', protect, adminOnly, updateUserRole);

// Content management routes
router.get('/content', protect, adminOnly, getAllContent);
router.post('/content', protect, adminOnly, createContent);
router.get('/content/:id', protect, adminOnly, getContentById);
router.put('/content/:type/:id', protect, adminOnly, updateContent);
router.delete('/content/:type/:id', protect, adminOnly, deleteContent);

// Search logs routes
router.get('/search-logs', protect, adminOnly, getSearchLogs);
router.post('/search-logs', logSearch); // Can be called from AI service without auth
router.delete('/search-logs/:id', protect, adminOnly, deleteSearchLog);

module.exports = router;
