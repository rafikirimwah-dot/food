const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
    getDeliveryOrders,
    pickupOrder,
    startDelivery,
    completeDelivery,
    getAvailableDeliveryPersons
} = require('../controllers/deliveryController');

router.get('/my-orders', authenticate, authorize('delivery'), getDeliveryOrders);
router.put('/:id/pickup', authenticate, authorize('delivery'), pickupOrder);
router.put('/:id/start', authenticate, authorize('delivery'), startDelivery);
router.put('/:id/complete', authenticate, authorize('delivery'), completeDelivery);
router.get('/available', authenticate, authorize('admin'), getAvailableDeliveryPersons);

module.exports = router;