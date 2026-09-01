// ============================================
// Hotel routes - Handles hotel and menu management endpoints
// ============================================
const express = require('express');
const router = express.Router();
const { authenticate, authorize, checkHotelOwnership } = require('../middleware/auth');
const {
    getHotels,
    getHotelById,
    createHotel,
    updateHotel,
    getHotelMenu,
    addFoodItem,
    updateFoodItem,
    deleteFoodItem
} = require('../controllers/hotelController');

// Public routes
router.get('/', getHotels);
router.get('/:id', getHotelById);
router.get('/:hotelId/menu', getHotelMenu);

// Admin only routes
router.post('/', authenticate, authorize('admin'), createHotel);
router.put('/:id', authenticate, authorize('admin'), updateHotel);

// Admin and manager routes
router.post('/menu', authenticate, authorize('admin', 'manager'), checkHotelOwnership, addFoodItem);
router.put('/menu/:id', authenticate, authorize('admin', 'manager'), checkHotelOwnership, updateFoodItem);
router.delete('/menu/:id', authenticate, authorize('admin', 'manager'), checkHotelOwnership, deleteFoodItem);

module.exports = router;