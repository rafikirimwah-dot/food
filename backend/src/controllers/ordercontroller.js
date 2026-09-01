// ============================================
// Order controller - Handles all order-related operations
// ============================================
const Order = require('../models/Order');
const Hotel = require('../models/Hotel');
const User = require('../models/User');

// ============================================
// USER CONTROLLERS
// ============================================

// Place a new order
const createOrder = async (req, res) => {
    try {
        const { 
            hotel_id, 
            items, 
            delivery_address,
            delivery_instructions,
            payment_method 
        } = req.body;
        
        const user_id = req.user.id;
        
        // Validation
        if (!hotel_id) {
            return res.status(400).json({ error: 'Hotel selection is required' });
        }
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items are required' });
        }
        
        if (!delivery_address) {
            return res.status(400).json({ error: 'Delivery address is required' });
        }
        
        // Get hotel details for commission rate
        const hotel = await Hotel.findById(hotel_id);
        if (!hotel) {
            return res.status(404).json({ error: 'Hotel not found' });
        }
        
        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const commissionRate = hotel.commission_rate || 10;
        const commission = (subtotal * commissionRate) / 100;
        const total_amount = subtotal;

        // Create order
        const orderId = await Order.create({
            user_id,
            hotel_id,
            items,
            subtotal,
            commission,
            total_amount,
            delivery_address,
            delivery_instructions,
            payment_method: payment_method || 'simulated'
        });
        
        // Create transaction record for user payment to admin
        await Order.createTransaction({
            order_id: orderId,
            amount: total_amount,
            commission: commission,
            manager_amount: total_amount - commission,
            payment_type: 'user_to_admin',
            transaction_ref: `TXN-${Date.now()}`
        });
        
        const order = await Order.findById(orderId);
        
        // In a real app, send notifications to admin and manager
        // console.log('📢 Admin notified: New order placed');
        // console.log('📢 Manager notified: New order received');
        
        res.status(201).json({
            message: 'Order placed successfully! Payment will be confirmed by admin.',
            order
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to place order' });
    }
};

// Get user's orders
const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.findByUser(req.user.id);
        res.json(orders);
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// Get order by ID
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Check authorization
        if (req.user.role === 'user' && order.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized - This is not your order' });
        }
        
        if (req.user.role === 'manager' && order.hotel_id !== req.user.hotel_id) {
            return res.status(403).json({ error: 'Unauthorized - This is not your hotel\'s order' });
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

// Confirm delivery (user)
const confirmDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order.user_id !== req.user.id) {
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
        
        // After user confirms delivery, create admin to manager transaction
        const confirmedOrder = await Order.findById(id);
        await Order.createTransaction({
            order_id: id,
            amount: confirmedOrder.total_amount - confirmedOrder.commission,
            commission: confirmedOrder.commission,
            manager_amount: confirmedOrder.total_amount - confirmedOrder.commission,
            payment_type: 'admin_to_manager',
            transaction_ref: `PAY-${Date.now()}`
        });
        
        res.json({ 
            message: 'Delivery confirmed! Payment will be processed to the hotel.',
            order: confirmedOrder 
        });
    } catch (error) {
        console.error('Confirm delivery error:', error);
        res.status(500).json({ error: 'Failed to confirm delivery' });
    }
};

// ============================================
// ADMIN CONTROLLERS
// ============================================

// Get all orders (admin)
const getAllOrders = async (req, res) => {
    try {
        const { status } = req.query;
        let orders;
        if (status) {
            orders = await Order.getOrdersByStatus(status);
        } else {
            orders = await Order.getPendingOrders();
        }
        res.json(orders);
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// Get order statistics (admin)
const getOrderStats = async (req, res) => {
    try {
        const stats = await Order.getOrderStats();
        res.json(stats);
    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
};

// Assign delivery person (admin)
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
        
        const deliveryPerson = await User.findById(deliveryPersonId);
        if (!deliveryPerson || deliveryPerson.role !== 'delivery') {
            return res.status(404).json({ error: 'Delivery person not found' });
        }
        
        const success = await Order.assignDelivery(orderId, deliveryPersonId);
        if (!success) {
            return res.status(404).json({ error: 'Failed to assign delivery' });
        }
        
        const updatedOrder = await Order.findById(orderId);
        res.json({ message: 'Delivery person assigned successfully', order: updatedOrder });
    } catch (error) {
        console.error('Assign delivery error:', error);
        res.status(500).json({ error: 'Failed to assign delivery' });
    }
};

// Update order status (admin)
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
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
        res.json({ message: 'Order status updated successfully', order: updatedOrder });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
};

// ============================================
// MANAGER CONTROLLERS
// ============================================

// Get manager's hotel orders
const getManagerOrders = async (req, res) => {
    try {
        const hotelId = req.user.hotel_id;
        if (!hotelId) {
            return res.status(400).json({ error: 'No hotel assigned to this manager' });
        }
        
        const orders = await Order.findByHotel(hotelId);
        res.json(orders);
    } catch (error) {
        console.error('Get manager orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// Update order status (manager)
const updateManagerOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        const validStatuses = ['confirmed', 'preparing', 'ready'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Allowed: confirmed, preparing, ready' });
        }
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Check if order belongs to manager's hotel
        if (order.hotel_id !== req.user.hotel_id) {
            return res.status(403).json({ error: 'Unauthorized - This is not your hotel\'s order' });
        }
        
        const success = await Order.updateStatus(id, status);
        if (!success) {
            return res.status(404).json({ error: 'Failed to update order status' });
        }
        
        const updatedOrder = await Order.findById(id);
        res.json({ message: 'Order status updated successfully', order: updatedOrder });
    } catch (error) {
        console.error('Update manager order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
};

// ============================================
// DELIVERY CONTROLLERS
// ============================================

// Get delivery person's assigned orders
const getDeliveryOrders = async (req, res) => {
    try {
        const orders = await Order.findByDeliveryPerson(req.user.id);
        res.json(orders);
    } catch (error) {
        console.error('Get delivery orders error:', error);
        res.status(500).json({ error: 'Failed to fetch delivery orders' });
    }
};

// Pick up order (delivery)
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
        
        if (order.status !== 'ready') {
            return res.status(400).json({ error: 'Order is not ready for pickup' });
        }
        
        const success = await Order.updateStatus(id, 'picked_up');
        if (!success) {
            return res.status(404).json({ error: 'Failed to pick up order' });
        }
        
        const updatedOrder = await Order.findById(id);
        res.json({ message: 'Order picked up successfully', order: updatedOrder });
    } catch (error) {
        console.error('Pickup order error:', error);
        res.status(500).json({ error: 'Failed to pick up order' });
    }
};

// Start delivery (delivery)
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
            return res.status(400).json({ error: 'Order must be picked up first' });
        }
        
        const success = await Order.updateStatus(id, 'in_transit');
        if (!success) {
            return res.status(404).json({ error: 'Failed to start delivery' });
        }
        
        const updatedOrder = await Order.findById(id);
        res.json({ message: 'Delivery started successfully', order: updatedOrder });
    } catch (error) {
        console.error('Start delivery error:', error);
        res.status(500).json({ error: 'Failed to start delivery' });
    }
};

// Complete delivery (delivery)
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
            return res.status(400).json({ error: 'Order must be in transit first' });
        }
        
        const success = await Order.updateStatus(id, 'delivered');
        if (!success) {
            return res.status(404).json({ error: 'Failed to complete delivery' });
        }
        
        const updatedOrder = await Order.findById(id);
        res.json({ message: 'Delivery completed successfully', order: updatedOrder });
    } catch (error) {
        console.error('Complete delivery error:', error);
        res.status(500).json({ error: 'Failed to complete delivery' });
    }
};

module.exports = {
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
};