const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
    // Client controllers
    createOrder,
    getClientOrders,
    getOrderById,
    getOrderByNumber,
    confirmDelivery,
    cancelOrder,
    
    // Admin controllers
    getPendingOrders,
    getAllOrders,
    assignDelivery,
    updateOrderStatus,
    getOrderStats,
    getRevenueStats,
    
    // Delivery controllers
    getDeliveryOrders,
    pickupOrder,
    startDelivery,
    completeDelivery,
    trackOrder
} = require('../controllers/orderController');

// ============================================
// CLIENT ROUTES
// ============================================
router.post('/', authenticate, authorize('client'), createOrder);
router.get('/client', authenticate, authorize('client'), getClientOrders);
router.get('/number/:orderNumber', authenticate, getOrderByNumber);
router.get('/:id', authenticate, getOrderById);
router.put('/:id/confirm', authenticate, authorize('client'), confirmDelivery);
router.put('/:id/cancel', authenticate, authorize('client'), cancelOrder);
router.get('/:id/track', authenticate, trackOrder);

// ============================================
// ADMIN ROUTES
// ============================================
router.get('/pending', authenticate, authorize('admin'), getPendingOrders);
router.get('/all', authenticate, authorize('admin'), getAllOrders);
router.post('/assign', authenticate, authorize('admin'), assignDelivery);
router.put('/:id/status', authenticate, authorize('admin'), updateOrderStatus);
router.get('/stats/overview', authenticate, authorize('admin'), getOrderStats);
router.get('/stats/revenue', authenticate, authorize('admin'), getRevenueStats);

// ============================================
// DELIVERY ROUTES
// ============================================
router.get('/delivery/my-orders', authenticate, authorize('delivery'), getDeliveryOrders);
router.put('/:id/pickup', authenticate, authorize('delivery'), pickupOrder);
router.put('/:id/start', authenticate, authorize('delivery'), startDelivery);
router.put('/:id/complete', authenticate, authorize('delivery'), completeDelivery);

module.exports = router;