const Order = require('../models/Order');

const createOrder = async (req, res) => {
    try {
        const { items, total_amount, delivery_address, delivery_instructions, payment_method } = req.body;
        const client_id = req.user.id;
        
        if (!items || !total_amount || !delivery_address) {
            return res.status(400).json({ error: 'Items, total amount and delivery address are required' });
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

const getClientOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const orders = await Order.findByClientId(req.user.id, status);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (req.user.role === 'client' && order.client_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};

const getPendingOrders = async (req, res) => {
    try {
        const orders = await Order.getPendingOrders();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pending orders' });
    }
};

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
        
        const success = await Order.assignDelivery(orderId, deliveryPersonId);
        if (!success) {
            return res.status(404).json({ error: 'Failed to assign delivery' });
        }
        
        const updatedOrder = await Order.findById(orderId);
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: 'Failed to assign delivery' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        const validStatuses = ['pending', 'confirmed', 'preparing', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
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
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
};

const confirmDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order.client_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const success = await Order.confirmDelivery(id);
        if (!success) {
            return res.status(404).json({ error: 'Failed to confirm delivery' });
        }
        
        const updatedOrder = await Order.findById(id);
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: 'Failed to confirm delivery' });
    }
};

const getOrderStats = async (req, res) => {
    try {
        const stats = await Order.getOrderStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get order statistics' });
    }
};

module.exports = {
    createOrder,
    getClientOrders,
    getOrderById,
    getPendingOrders,
    assignDelivery,
    updateOrderStatus,
    confirmDelivery,
    getOrderStats
};