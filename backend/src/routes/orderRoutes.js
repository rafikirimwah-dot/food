// ============================================
// Order routes - Handles all order-related endpoints
// ============================================
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
    // User controllers
    createOrder,
    getUserOrders,
    getOrderById,
    confirmDelivery,
    
    // Admin controllers
    getAllOrders,
    getOrderStats,
    assignDelivery,
    updateOrderStatus,
    
    // Manager controllers
    getManagerOrders,
    updateManagerOrderStatus,
    
    // Delivery controllers
    getDeliveryOrders,
    pickupOrder,
    startDelivery,
    completeDelivery
} = require('../controllers/orderController');

// ============================================
// USER ROUTES
// ============================================
router.post('/', authenticate, authorize('user'), createOrder);
router.get('/my-orders', authenticate, authorize('user'), getUserOrders);
router.get('/:id', authenticate, getOrderById);
router.put('/:id/confirm', authenticate, authorize('user'), confirmDelivery);

// ============================================
// ADMIN ROUTES
// ============================================
router.get('/admin/all', authenticate, authorize('admin'), getAllOrders);
router.get('/admin/stats', authenticate, authorize('admin'), getOrderStats);
router.post('/admin/assign-delivery', authenticate, authorize('admin'), assignDelivery);
router.put('/admin/:id/status', authenticate, authorize('admin'), updateOrderStatus);

// ============================================
// MANAGER ROUTES
// ============================================
router.get('/manager/orders', authenticate, authorize('manager'), getManagerOrders);
router.put('/manager/:id/status', authenticate, authorize('manager'), updateManagerOrderStatus);

// ============================================
// DELIVERY ROUTES
// ============================================
router.get('/delivery/my-orders', authenticate, authorize('delivery'), getDeliveryOrders);
router.put('/delivery/:id/pickup', authenticate, authorize('delivery'), pickupOrder);
router.put('/delivery/:id/start', authenticate, authorize('delivery'), startDelivery);
router.put('/delivery/:id/complete', authenticate, authorize('delivery'), completeDelivery);

module.exports = router;