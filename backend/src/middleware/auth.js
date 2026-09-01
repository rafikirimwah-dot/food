// ============================================
// Authentication middleware - Verifies JWT tokens and user roles
// ============================================
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        
        const [users] = await db.query(
            'SELECT id, username, email, role, phone, address, is_approved, hotel_id FROM users WHERE id = ?',
            [decoded.id]
        );

        if (!users.length) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Check if manager is approved
        if (users[0].role === 'manager' && !users[0].is_approved) {
            return res.status(403).json({ error: 'Your account is pending approval by admin' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(500).json({ error: 'Authentication error' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

// Check if user owns the hotel (for managers)
const checkHotelOwnership = async (req, res, next) => {
    const hotelId = req.params.hotelId || req.body.hotel_id;
    if (req.user.role === 'admin') return next();
    
    if (req.user.role === 'manager' && req.user.hotel_id == hotelId) {
        return next();
    }
    
    return res.status(403).json({ error: 'You do not have permission for this hotel' });
};

module.exports = { authenticate, authorize, checkHotelOwnership };