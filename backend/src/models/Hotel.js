// ============================================
// Hotel model - Handles all hotel-related database operations
// ============================================
const db = require('../config/database');

class Hotel {
    // Gets all hotels
    static async findAll() {
        try {
            const [rows] = await db.query(`
                SELECT h.*, u.username as manager_name 
                FROM hotels h 
                LEFT JOIN users u ON h.manager_id = u.id 
                WHERE h.is_active = 1 
                ORDER BY h.name ASC
            `);
            return rows;
        } catch (error) {
            console.error('FindAll hotels error:', error);
            return [];
        }
    }

    // Finds a hotel by ID
    static async findById(id) {
        try {
            const [rows] = await db.query(`
                SELECT h.*, u.username as manager_name 
                FROM hotels h 
                LEFT JOIN users u ON h.manager_id = u.id 
                WHERE h.id = ?
            `, [id]);
            return rows[0];
        } catch (error) {
            console.error('FindById hotel error:', error);
            return null;
        }
    }

    // Finds a hotel by name
    static async findByName(name) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM hotels WHERE name = ?',
                [name]
            );
            return rows[0];
        } catch (error) {
            console.error('FindByName hotel error:', error);
            return null;
        }
    }

    // Gets menu items for a specific hotel
    static async getMenu(hotelId) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM foods WHERE hotel_id = ? AND is_available = 1 ORDER BY category, name',
                [hotelId]
            );
            return rows;
        } catch (error) {
            console.error('Get menu error:', error);
            return [];
        }
    }

    // Creates a new hotel
    static async create(hotelData) {
        try {
            const { name, description, address, phone, email, image, cuisine_type, manager_id } = hotelData;
            const [result] = await db.query(
                'INSERT INTO hotels (name, description, address, phone, email, image, cuisine_type, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [name, description, address, phone, email, image, cuisine_type, manager_id]
            );
            return result.insertId;
        } catch (error) {
            console.error('Create hotel error:', error);
            throw error;
        }
    }

    // Updates a hotel
    static async update(id, hotelData) {
        try {
            const fields = [];
            const values = [];
            
            Object.entries(hotelData).forEach(([key, value]) => {
                if (value !== undefined) {
                    fields.push(`${key} = ?`);
                    values.push(value);
                }
            });
            
            values.push(id);
            
            const [result] = await db.query(
                `UPDATE hotels SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Update hotel error:', error);
            return false;
        }
    }
}

module.exports = Hotel;
