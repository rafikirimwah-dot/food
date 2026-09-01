// ============================================
// Main application file - Sets up Express server and middleware
// ============================================
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./routes/authRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const orderRoutes = require('./routes/orderRoutes');
const foodRoutes = require('./routes/foodRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/foods', foodRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        features: ['Multi-hotel support', 'Commission system', 'Role-based access']
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Food Delivery API v2.0',
        endpoints: {
            auth: '/api/auth',
            hotels: '/api/hotels',
            orders: '/api/orders',
            health: '/api/health'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
    console.log('🏨 Hotels API: http://localhost:5000/api/hotels');
    console.log('📦 Orders API: http://localhost:5000/api/orders');
    console.log('Press Ctrl+C to stop');
});

module.exports = app;