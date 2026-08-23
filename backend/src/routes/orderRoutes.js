const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
    createOrder,
    getClientOrders,
    getOrderById,
    getPendingOrders,
    assignDelivery,
    updateOrderStatus,
    confirmDelivery,
    getOrderStats
} = require('../controllers/orderController');

// Client routes
router.post('/', authenticate, authorize('client'), createOrder);
router.get('/client', authenticate, authorize('client'), getClientOrders);
router.get('/:id', authenticate, getOrderById);
router.put('/:id/confirm', authenticate, authorize('client'), confirmDelivery);

// Admin routes
router.get('/pending', authenticate, authorize('admin'), getPendingOrders);
router.post('/assign', authenticate, authorize('admin'), assignDelivery);
router.put('/:id/status', authenticate, authorize('admin'), updateOrderStatus);
router.get('/stats/overview', authenticate, authorize('admin'), getOrderStats);

module.exports = router;