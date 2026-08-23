const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
    getFoods,
    getFoodById,
    getPopularFoods,
    getFoodsByCategory,
    createFood,
    updateFood,
    deleteFood
} = require('../controllers/foodController');

// Public routes
router.get('/', getFoods);
router.get('/popular', getPopularFoods);
router.get('/category/:category', getFoodsByCategory);
router.get('/:id', getFoodById);

// Admin only routes
router.post('/', authenticate, authorize('admin'), createFood);
router.put('/:id', authenticate, authorize('admin'), updateFood);
router.delete('/:id', authenticate, authorize('admin'), deleteFood);

module.exports = router;