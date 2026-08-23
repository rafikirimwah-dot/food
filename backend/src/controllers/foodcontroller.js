const Food = require('../models/Food');

const getFoods = async (req, res) => {
    try {
        const { category, search, is_available } = req.query;
        const filters = { category, search, is_available };
        
        const foods = await Food.findAll(filters);
        res.json(foods);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch foods' });
    }
};

const getFoodById = async (req, res) => {
    try {
        const { id } = req.params;
        const food = await Food.findById(id);
        
        if (!food) {
            return res.status(404).json({ error: 'Food not found' });
        }
        
        res.json(food);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch food' });
    }
};

const getPopularFoods = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const foods = await Food.getPopular(limit);
        res.json(foods);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch popular foods' });
    }
};

const getFoodsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const foods = await Food.getByCategory(category);
        res.json(foods);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch foods by category' });
    }
};

const createFood = async (req, res) => {
    try {
        const { name, description, price, category, image, emoji } = req.body;
        
        if (!name || !price) {
            return res.status(400).json({ error: 'Name and price are required' });
        }
        
        const foodId = await Food.create({
            name,
            description,
            price,
            category,
            image,
            emoji
        });
        
        const food = await Food.findById(foodId);
        res.status(201).json(food);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create food' });
    }
};

const updateFood = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, image, emoji, is_available } = req.body;
        
        const food = await Food.findById(id);
        if (!food) {
            return res.status(404).json({ error: 'Food not found' });
        }
        
        const success = await Food.update(id, {
            name,
            description,
            price,
            category,
            image,
            emoji,
            is_available
        });
        
        if (!success) {
            return res.status(404).json({ error: 'Failed to update food' });
        }
        
        const updatedFood = await Food.findById(id);
        res.json(updatedFood);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update food' });
    }
};

const deleteFood = async (req, res) => {
    try {
        const { id } = req.params;
        
        const food = await Food.findById(id);
        if (!food) {
            return res.status(404).json({ error: 'Food not found' });
        }
        
        const success = await Food.delete(id);
        if (!success) {
            return res.status(404).json({ error: 'Failed to delete food' });
        }
        
        res.json({ message: 'Food deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete food' });
    }
};

module.exports = {
    getFoods,
    getFoodById,
    getPopularFoods,
    getFoodsByCategory,
    createFood,
    updateFood,
    deleteFood
};