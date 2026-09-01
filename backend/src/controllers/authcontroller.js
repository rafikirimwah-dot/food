// ============================================
// Authentication controller - Handles login, registration, and user management
// ============================================
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const bcrypt = require('bcryptjs');

// Register a new user
const register = async (req, res) => {
    try {
        const { username, email, password, role, phone, address, hotel_name } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email and password are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        const existingUsername = await User.findByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // If registering as manager, create hotel first
        let hotelId = null;
        if (role === 'manager' && hotel_name) {
            // Check if hotel exists
            const existingHotel = await Hotel.findByName(hotel_name);
            if (existingHotel) {
                return res.status(400).json({ error: 'Hotel name already exists' });
            }
        }

        // Create user
        const userId = await User.create({
            username,
            email,
            password,
            role: role || 'user',
            phone,
            address,
            hotel_id: hotelId
        });

        // If manager, create hotel and update user
        if (role === 'manager' && hotel_name) {
            hotelId = await Hotel.create({
                name: hotel_name,
                description: req.body.description || '',
                address: req.body.hotel_address || address || '',
                phone: req.body.hotel_phone || phone || '',
                email: email,
                cuisine_type: req.body.cuisine_type || 'Various',
                manager_id: userId
            });
            await User.update(userId, { hotel_id: hotelId });
        }

        const user = await User.findById(userId);
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: role === 'manager' ? 'Registration successful. Awaiting admin approval.' : 'Registration successful!',
            token,
            user
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if manager is approved
        if (user.role === 'manager' && !user.is_approved) {
            return res.status(403).json({ error: 'Your account is pending approval by admin' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' }
        );

        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address,
            is_approved: user.is_approved,
            hotel_id: user.hotel_id
        };

        res.json({
            message: 'Login successful',
            token,
            user: userData
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

// Get user profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // If manager, get hotel details
        let hotel = null;
        if (user.role === 'manager' && user.hotel_id) {
            hotel = await Hotel.findById(user.hotel_id);
        }
        
        res.json({ user, hotel });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { username, phone, address, password } = req.body;
        const userData = { username, phone, address };
        
        if (password) {
            userData.password = password;
        }
        
        const success = await User.update(req.user.id, userData);
        if (!success) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = await User.findById(req.user.id);
        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Get pending managers (admin only)
const getPendingManagers = async (req, res) => {
    try {
        const managers = await User.getPendingManagers();
        res.json(managers);
    } catch (error) {
        console.error('Get pending managers error:', error);
        res.status(500).json({ error: 'Failed to get pending managers' });
    }
};

// Approve manager (admin only)
const approveManager = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await User.approveManager(id);
        
        if (!success) {
            return res.status(404).json({ error: 'Manager not found or already approved' });
        }
        
        // Update hotel status
        const user = await User.findById(id);
        if (user && user.hotel_id) {
            await Hotel.update(user.hotel_id, { is_active: 1 });
        }
        
        res.json({ message: 'Manager approved successfully' });
    } catch (error) {
        console.error('Approve manager error:', error);
        res.status(500).json({ error: 'Failed to approve manager' });
    }
};

module.exports = { register, login, getProfile, updateProfile, getPendingManagers, approveManager };