const Order = require('../models/Order');
const User = require('../models/User');

const getDeliveryOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const orders = await Order.findByDeliveryPersonId(req.user.id, status);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch delivery orders' });
    }
};

const pickupOrder = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order.delivery_person_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const success = await Order.updateStatus(id, 'picked_up');
        if (!success) {
            return res.status(404).json({ error: 'Failed to pickup order' });
        }
        
        const updatedOrder = await Order.findById(id);
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: 'Failed to pickup order' });
    }
};

const startDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order.delivery_person_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const success = await Order.updateStatus(id, 'in_transit');
        if (!success) {
            return res.status(404).json({ error: 'Failed to start delivery' });
        }
        
        const updatedOrder = await Order.findById(id);
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: 'Failed to start delivery' });
    }
};

const completeDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order.delivery_person_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const success = await Order.confirmDelivery(id);
        if (!success) {
            return res.status(404).json({ error: 'Failed to complete delivery' });
        }
        
        const updatedOrder = await Order.findById(id);
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: 'Failed to complete delivery' });
    }
};

const getAvailableDeliveryPersons = async (req, res) => {
    try {
        const persons = await User.getDeliveryPersons();
        res.json(persons);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch delivery persons' });
    }
};

module.exports = {
    getDeliveryOrders,
    pickupOrder,
    startDelivery,
    completeDelivery,
    getAvailableDeliveryPersons
};
