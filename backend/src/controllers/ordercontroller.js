const Order = require('../models/Order');

// ============================================
// CLIENT CONTROLLERS
// ============================================

/**
 * Create a new order
 * @route POST /api/orders
 * @access Client only
 */
const createOrder = async (req, res) => {
    try {
        const { 
            items, 
            total_amount, 
            delivery_address, 
            delivery_instructions, 
            payment_method 
        } = req.body;
        
        const client_id = req.user.id;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items are required and must be an array' });
        }
        
        if (!total_amount || total_amount <= 0) {
            return res.status(400).json({ error: 'Total amount must be greater than 0' });
        }
        
        if (!delivery_address) {
            return res.status(400).json({ error: 'Delivery address is required' });
        }

        const orderId = await Order.create({
            client_id,
            items,
            total_amount,
            delivery_address,
            delivery_instructions,
            payment_method: payment_method || 'cash'
        });
        
        const order = await Order.findById(orderId);
        res.status(201).json(order);
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
};

/**
 * Get all orders for the logged-in client
 * @route GET /api/orders/client
 * @access Client only
 */
const getClientOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const orders = await Order.findByClientId(req.user.id, status);
        res.json(orders);
    } catch (error) {
        console.error('Get client orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

/**
 * Get a specific order by ID
 * @route GET /api/orders/:id
 * @access Client, Admin, Delivery
 */
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (req.user.role === 'client' && order.client_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized - This is not your order' });
        }
        
        if (req.user.role === 'delivery' && order.delivery_person_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized - This order is not assigned to you' });
        }
        
        res.json(order);
    } catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};

/**
 * Get order by order number
 * @route GET /api/orders/number/:orderNumber
 * @access Client, Admin, Delivery
 */
const getOrderByNumber = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const order = await Order.findByOrderNumber(orderNumber);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (req.user.role === 'client' && order.client_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized - This is not your order' });
        }
        
        if (req.user.role === 'delivery' && order.delivery_person_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized - This order is not assigned to you' });
        }
        
        res.json(order);
    } catch (error) {
        console.error('Get order by number error:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};

/**
 * Confirm delivery by client
 * @route PUT /api/orders/:id/confirm
 * @access Client only
 */
const confirmDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order.client_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized - This is not your order' });
        }
        
        if (order.status !== 'in_transit' && order.status !== 'picked_up') {
            return res.status(400).json({ 
                error: 'Order cannot be confirmed. Current status: ' + order.status 
            });
        }
        
        const success = await Order.confirmDelivery(id);
        if (!success) {
            return res.status(404).json({ error: 'Failed to confirm delivery' });
        }
        
        const updatedOrder = await Order.findById(id);
        res.json({ 
            message: 'Delivery confirmed successfully!', 
            order: updatedOrder 
        });
    } catch (error) {
        console.error('Confirm delivery error:', error);
        res.status(500).json({ error: 'Failed to confirm delivery' });
    }
};

/**
 * Cancel order by client
 * @route PUT /api/orders/:id/cancel
 * @access Client only
 */
const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order.client_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized - This is not your order' });
        }
        
        if (order.status !== 'pending' && order.status !== 'confirmed') {
            return res.status(400).json({ 
                error: 'Order cannot be cancelled. Current status: ' + order.status 
            });
        }
        
        const success = await Order.updateStatus(id, 'cancelled');
        if (!success) {
            return res.status(404).json({ error: 'Failed to cancel order' });
        }
        
        const updatedOrder = await Order.findById(id);
        res.json({ 
            message: 'Order cancelled successfully', 
            order: updatedOrder 
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ error: 'Failed to cancel order' });
    }
};

// ============================================
// ADMIN CONTROLLERS
// ============================================

/**
 * Get all pending orders
 * @route GET /api/orders/pending
 * @access Admin only
 */
const getPendingOrders = async (req, res) => {
    try {
        const orders = await Order.getPendingOrders();
        res.json(orders);
    } catch (error) {
        console.error('Get pending orders error:', error);
        res.status(500).json({ error: 'Failed to fetch pending orders' });
    }
};

/**
 * Get all orders (admin view)
 * @route GET /api/orders/all
 * @access Admin only
 */
const getAllOrders = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        const orders = await Order.getAllOrders(status, startDate, endDate);
        res.json(orders);
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

/**
 * Assign delivery person to order
 * @route POST /api/orders/assign
 * @access Admin only
 */
const assignDelivery = async (req, res) => {
    try {
        const { orderId, deliveryPersonId } = req.body;
        
        if (!orderId || !deliveryPersonId) {
            return res.status(400).json({ error: 'Order ID and delivery person ID are required' });
        }
        
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order.delivery_person_id) {
            return res.status(400).json({ error: 'Order already has a delivery person assigned' });
        }
        
        const User = require('../models/User');
        const deliveryPerson = await User.findById(deliveryPersonId);
        if (!deliveryPerson || deliveryPerson.role !== 'delivery') {
            return res.status(404).json({ error: 'Delivery person not found' });
        }
        
        const success = await Order.assignDelivery(orderId, deliveryPersonId);
        if (!success) {
            return res.status(404).json({ error: 'Failed to assign delivery' });
        }
        
        const updatedOrder = await Order.findById(orderId);
        res.json({ 
            message: 'Delivery person assigned successfully', 
            order: updatedOrder 
        });
    } catch (error) {
        console.error('Assign delivery error:', error);
        res.status(500).json({ error: 'Failed to assign delivery' });
    }
};

/**
 * Update order status (admin)
 * @route PUT /api/orders/:id/status
 * @access Admin only
 */
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        const validStatuses = ['pending', 'confirmed', 'preparing', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: 'Invalid status. Valid statuses: ' + validStatuses.join(', ') 
            });
        }
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const success = await Order.updateStatus(id, status);
        if (!success) {
            return res.status(404).json({ error: 'Failed to update order status' });
        }
        
        const updatedOrder = await Order.findById(id);
        res.json({ 
            message: 'Order status updated successfully', 
            order: updatedOrder 
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
};

/**
 * Get order statistics for admin dashboard
 * @route GET /api/orders/stats/overview
 * @access Admin only
 */
const getOrderStats = async (req, res) => {
    try {
        const stats = await Order.getOrderStats();
        res.json(stats);
    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({ error: 'Failed to get order statistics' });
    }
};

/**
 * Get revenue statistics
 * @route GET /api/orders/stats/revenue
 * @access Admin only
 */
const getRevenueStats = async (req, res) => {
    try {
        const { period } = req.query;
        const stats = await Order.getRevenueStats(period);
        res.json(stats);
    } catch (error) {
        console.error('Get revenue stats error:', error);
        res.status(500).json({ error: 'Failed to get revenue statistics' });
    }
};

// ============================================
// DELIVERY CONTROLLERS
// ============================================

/**
 * Get orders assigned to delivery person
 * @route GET /api/orders/delivery/my-orders
 * @access Delivery only
 */
const getDeliveryOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const orders = await Order.findByDeliveryPersonId(req.user.id, status);
        res.json(orders);
    } catch (error) {
        console.error('Get delivery orders error:', error);
        res.status(500).json({ error: 'Failed to fetch delivery orders' });
    }
};

/**
 * Pickup order by delivery person
 * @route PUT /api/orders/:id/pickup
 * @access Delivery only
 */
const pickupOrder = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order.delivery_person_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized - This order is not assigned to you' });
        }
        
        if (order.status !== 'confirmed' && order.status !== 'preparing') {
            return res.status(400).json({ 
                error: 'Order cannot be picked up. Current status: ' + order.status 
            });
        }
        
        const success = await Order.updateStatus(id, 'picked_up');
        if (!success) {
            return res.status(404).json({ error: 'Failed to pickup order' });
        }
        
        const updatedOrder = await Order.findById(id);
        res.json({ 
            message: 'Order picked up successfully', 
            order: updatedOrder 
        });
    } catch (error) {
        console.error('Pickup order error:', error);
        res.status(500).json({ error: 'Failed to pickup order' });
    }
};

/**
 * Start delivery by delivery person
 * @route PUT /api/orders/:id/start
 * @access Delivery only
 */
const startDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order.delivery_person_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized - This order is not assigned to you' });
        }
        
        if (order.status !== 'picked_up') {
            return res.status(400).json({ 
                error: 'Order cannot be started for delivery. Current status: ' + order.status 
            });
        }
        
        const success = await Order.updateStatus(id, 'in_transit');
        if (!success) {
            return res.status(404).json({ error: 'Failed to start delivery' });
        }
        
        const updatedOrder = await Order.findById(id);
        res.json({ 
            message: 'Delivery started successfully', 
            order: updatedOrder 
        });
    } catch (error) {
        console.error('Start delivery error:', error);
        res.status(500).json({ error: 'Failed to start delivery' });
    }
};

/**
 * Complete delivery by delivery person
 * @route PUT /api/orders/:id/complete
 * @access Delivery only
 */
const completeDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order.delivery_person_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized - This order is not assigned to you' });
        }
        
        if (order.status !== 'in_transit') {
            return res.status(400).json({ 
                error: 'Order cannot be completed. Current status: ' + order.status 
            });
        }
        
        const success = await Order.confirmDelivery(id);
        if (!success) {
            return res.status(404).json({ error: 'Failed to complete delivery' });
        }
        
        const updatedOrder = await Order.findById(id);
        res.json({ 
            message: 'Delivery completed successfully!', 
            order: updatedOrder 
        });
    } catch (error) {
        console.error('Complete delivery error:', error);
        res.status(500).json({ error: 'Failed to complete delivery' });
    }
};

/**
 * Track order status
 * @route GET /api/orders/:id/track
 * @access Client, Delivery, Admin
 */
const trackOrder = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (req.user.role === 'client' && order.client_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        if (req.user.role === 'delivery' && order.delivery_person_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const trackingInfo = {
            order_number: order.order_number,
            status: order.status,
            estimated_delivery: order.estimated_delivery_time,
            delivered_at: order.delivered_at,
            delivery_person: order.delivery_name || null,
            delivery_phone: order.delivery_phone || null
        };
        
        res.json(trackingInfo);
    } catch (error) {
        console.error('Track order error:', error);
        res.status(500).json({ error: 'Failed to track order' });
    }
};

// ============================================
// EXPORT ALL CONTROLLERS
// ============================================

module.exports = {
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
};