// ============================================
// Hotel controller - Handles hotel and menu management
// ============================================
const Hotel = require('../models/Hotel');
const Food = require('../models/Food');

// Get all hotels
const getHotels = async (req, res) => {
    try {
        const hotels = await Hotel.findAll();
        res.json(hotels);
    } catch (error) {
        console.error('Get hotels error:', error);
        res.status(500).json({ error: 'Failed to fetch hotels' });
    }
};

// Get hotel by ID with its menu
const getHotelById = async (req, res) => {
    try {
        const { id } = req.params;
        const hotel = await Hotel.findById(id);
        
        if (!hotel) {
            return res.status(404).json({ error: 'Hotel not found' });
        }
        
        const menu = await Hotel.getMenu(id);
        res.json({ hotel, menu });
    } catch (error) {
        console.error('Get hotel by ID error:', error);
        res.status(500).json({ error: 'Failed to fetch hotel' });
    }
};

// Create a new hotel (admin only)
const createHotel = async (req, res) => {
    try {
        const { name, description, address, phone, email, image, cuisine_type, manager_id } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Hotel name is required' });
        }
        
        const hotelId = await Hotel.create({
            name,
            description,
            address,
            phone,
            email,
            image,
            cuisine_type,
            manager_id
        });
        
        const hotel = await Hotel.findById(hotelId);
        res.status(201).json(hotel);
    } catch (error) {
        console.error('Create hotel error:', error);
        res.status(500).json({ error: 'Failed to create hotel' });
    }
};

// Update hotel (admin or manager)
const updateHotel = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, address, phone, email, image, cuisine_type, is_active } = req.body;
        
        const hotel = await Hotel.findById(id);
        if (!hotel) {
            return res.status(404).json({ error: 'Hotel not found' });
        }
        
        const success = await Hotel.update(id, {
            name,
            description,
            address,
            phone,
            email,
            image,
            cuisine_type,
            is_active
        });
        
        if (!success) {
            return res.status(404).json({ error: 'Failed to update hotel' });
        }
        
        const updatedHotel = await Hotel.findById(id);
        res.json(updatedHotel);
    } catch (error) {
        console.error('Update hotel error:', error);
        res.status(500).json({ error: 'Failed to update hotel' });
    }
};

// ============================================
// Food Management Controllers
// ============================================

// Get menu items for a hotel
const getHotelMenu = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const menu = await Food.findByHotel(hotelId);
        res.json(menu);
    } catch (error) {
        console.error('Get hotel menu error:', error);
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
};

// Add food item to hotel menu
const addFoodItem = async (req, res) => {
    try {
        const { hotel_id, name, description, price, category, image, emoji } = req.body;
        
        if (!hotel_id || !name || !price) {
            return res.status(400).json({ error: 'Hotel ID, name and price are required' });
        }
        
        const foodId = await Food.create({
            hotel_id,
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
        console.error('Add food item error:', error);
        res.status(500).json({ error: 'Failed to add food item' });
    }
};

// Update food item
const updateFoodItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, image, emoji, is_available } = req.body;
        
        const food = await Food.findById(id);
        if (!food) {
            return res.status(404).json({ error: 'Food item not found' });
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
            return res.status(404).json({ error: 'Failed to update food item' });
        }
        
        const updatedFood = await Food.findById(id);
        res.json(updatedFood);
    } catch (error) {
        console.error('Update food item error:', error);
        res.status(500).json({ error: 'Failed to update food item' });
    }
};

// Delete food item
const deleteFoodItem = async (req, res) => {
    try {
        const { id } = req.params;
        
        const food = await Food.findById(id);
        if (!food) {
            return res.status(404).json({ error: 'Food item not found' });
        }
        
        const success = await Food.delete(id);
        if (!success) {
            return res.status(404).json({ error: 'Failed to delete food item' });
        }
        
        res.json({ message: 'Food item deleted successfully' });
    } catch (error) {
        console.error('Delete food item error:', error);
        res.status(500).json({ error: 'Failed to delete food item' });
    }
};

module.exports = {
    getHotels,
    getHotelById,
    createHotel,
    updateHotel,
    getHotelMenu,
    addFoodItem,
    updateFoodItem,
    deleteFoodItem
};