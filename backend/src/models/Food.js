// ============================================
// Food model - Handles all food-item related database operations
// ============================================
const db = require('../config/database');

class Food {
    // Gets foods by hotel ID
    static async findByHotel(hotelId) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM foods WHERE hotel_id = ? AND is_available = 1 ORDER BY category, name',
                [hotelId]
            );
            return rows;
        } catch (error) {
            console.error('FindByHotel error:', error);
            return [];
        }
    }

    // Finds a food by ID
    static async findById(id) {
        try {
            const [rows] = await db.query('SELECT * FROM foods WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            console.error('FindById food error:', error);
            return null;
        }
    }

    // Creates a new food item
    static async create(foodData) {
        try {
            const { hotel_id, name, description, price, category, image, emoji } = foodData;
            const [result] = await db.query(
                'INSERT INTO foods (hotel_id, name, description, price, category, image, emoji) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [hotel_id, name, description, price, category, image, emoji]
            );
            return result.insertId;
        } catch (error) {
            console.error('Create food error:', error);
            throw error;
        }
    }

    // Updates a food item
    static async update(id, foodData) {
        try {
            const fields = [];
            const values = [];
            
            Object.entries(foodData).forEach(([key, value]) => {
                if (value !== undefined) {
                    fields.push(`${key} = ?`);
                    values.push(value);
                }
            });
            
            values.push(id);
            
            const [result] = await db.query(
                `UPDATE foods SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Update food error:', error);
            return false;
        }
    }

    // Deletes a food item
    static async delete(id) {
        try {
            const [result] = await db.query('DELETE FROM foods WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Delete food error:', error);
            return false;
        }
    }

    // Gets all foods with optional filters
    static async findAll(filters = {}) {
        try {
            let query = 'SELECT * FROM foods WHERE 1=1';
            const values = [];

            if (filters.category) {
                query += ' AND category = ?';
                values.push(filters.category);
            }

            if (filters.search) {
                query += ' AND name LIKE ?';
                values.push(`%${filters.search}%`);
            }

            if (filters.is_available !== undefined) {
                query += ' AND is_available = ?';
                values.push(filters.is_available);
            }

            query += ' ORDER BY category, name';
            const [rows] = await db.query(query, values);
            return rows;
        } catch (error) {
            console.error('FindAll foods error:', error);
            return [];
        }
    }

    // Gets popular foods (most ordered)
    static async getPopular(limit = 6) {
        try {
            const [rows] = await db.query(
                `SELECT f.* FROM foods f 
                LEFT JOIN orders o ON f.id = o.food_id 
                WHERE f.is_available = 1 
                GROUP BY f.id 
                ORDER BY COUNT(o.id) DESC 
                LIMIT ?`,
                [limit]
            );
            return rows;
        } catch (error) {
            console.error('GetPopular foods error:', error);
            return [];
        }
    }

    // Gets foods by category
    static async getByCategory(category) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM foods WHERE category = ? AND is_available = 1 ORDER BY name',
                [category]
            );
            return rows;
        } catch (error) {
            console.error('GetByCategory error:', error);
            return [];
        }
    }
}

module.exports = Food;