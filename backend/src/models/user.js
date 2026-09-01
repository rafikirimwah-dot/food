// ============================================
// User model - Handles all user-related database operations
// ============================================
const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // Finds a user by email
    static async findByEmail(email) {
        try {
            const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            return rows[0];
        } catch (error) {
            console.error('FindByEmail error:', error);
            return null;
        }
    }

    // Finds a user by ID
    static async findById(id) {
        try {
            const [rows] = await db.query(
                'SELECT id, username, email, role, phone, address, avatar, is_approved, hotel_id, created_at FROM users WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('FindById error:', error);
            return null;
        }
    }

    // Finds all pending managers awaiting approval
    static async getPendingManagers() {
        try {
            const [rows] = await db.query(
                'SELECT u.*, h.name as hotel_name FROM users u LEFT JOIN hotels h ON u.hotel_id = h.id WHERE u.role = "manager" AND u.is_approved = 0'
            );
            return rows;
        } catch (error) {
            console.error('Get pending managers error:', error);
            return [];
        }
    }

    // Finds all approved managers
    static async getApprovedManagers() {
        try {
            const [rows] = await db.query(
                'SELECT u.*, h.name as hotel_name FROM users u LEFT JOIN hotels h ON u.hotel_id = h.id WHERE u.role = "manager" AND u.is_approved = 1'
            );
            return rows;
        } catch (error) {
            console.error('Get approved managers error:', error);
            return [];
        }
    }

    // Creates a new user
    static async create(userData) {
        try {
            const { username, email, password, role = 'user', phone, address, hotel_id } = userData;
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const [result] = await db.query(
                'INSERT INTO users (username, email, password, role, phone, address, hotel_id, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [username, email, hashedPassword, role, phone, address, hotel_id, role === 'admin' ? 1 : 0]
            );
            
            return result.insertId;
        } catch (error) {
            console.error('Create user error:', error);
            throw error;
        }
    }

    // Updates a user
    static async update(id, userData) {
        try {
            const fields = [];
            const values = [];
            
            Object.entries(userData).forEach(([key, value]) => {
                if (value !== undefined && key !== 'password') {
                    fields.push(`${key} = ?`);
                    values.push(value);
                }
            });
            
            if (userData.password) {
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                fields.push('password = ?');
                values.push(hashedPassword);
            }
            
            values.push(id);
            
            const [result] = await db.query(
                `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Update user error:', error);
            return false;
        }
    }

    // Approves a manager
    static async approveManager(id) {
        try {
            const [result] = await db.query(
                'UPDATE users SET is_approved = 1 WHERE id = ? AND role = "manager"',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Approve manager error:', error);
            return false;
        }
    }

    // Gets all delivery persons
    static async getDeliveryPersons() {
        try {
            const [rows] = await db.query(
                'SELECT id, username, email, phone FROM users WHERE role = "delivery" AND is_approved = 1'
            );
            return rows;
        } catch (error) {
            console.error('Get delivery persons error:', error);
            return [];
        }
    }

    // Gets a user by username
    static async findByUsername(username) {
        try {
            const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
            return rows[0];
        } catch (error) {
            console.error('FindByUsername error:', error);
            return null;
        }
    }
}

module.exports = User;