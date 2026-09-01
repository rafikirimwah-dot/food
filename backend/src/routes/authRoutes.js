// ============================================
// Authentication routes - Handles user authentication endpoints
// ============================================
const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    getProfile, 
    updateProfile,
    getPendingManagers,
    approveManager
} = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

// Admin only routes
router.get('/pending-managers', authenticate, authorize('admin'), getPendingManagers);
router.put('/approve-manager/:id', authenticate, authorize('admin'), approveManager);

module.exports = router;