const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.query(
            'SELECT id, username, email, role, phone, address, avatar, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async findByUsername(username) {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    }

    static async create(userData) {
        const { username, email, password, role = 'client', phone, address } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.query(
            'INSERT INTO users (username, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, role, phone, address]
        );
        
        return result.insertId;
    }

    static async update(id, userData) {
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
    }

    static async getDeliveryPersons() {
        const [rows] = await db.query(
            'SELECT id, username, email, phone FROM users WHERE role = "delivery"'
        );
        return rows;
    }
}

module.exports = User;