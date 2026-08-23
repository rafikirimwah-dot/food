const db = require('../config/database');

class Food {
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM foods WHERE 1=1';
        const values = [];
        
        if (filters.category) {
            query += ' AND category = ?';
            values.push(filters.category);
        }
        
        if (filters.is_available !== undefined) {
            query += ' AND is_available = ?';
            values.push(filters.is_available);
        }
        
        if (filters.search) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            values.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        
        query += ' ORDER BY rating DESC, name ASC';
        
        const [rows] = await db.query(query, values);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM foods WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(foodData) {
        const { name, description, price, category, image, emoji } = foodData;
        const [result] = await db.query(
            'INSERT INTO foods (name, description, price, category, image, emoji) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, price, category, image, emoji]
        );
        return result.insertId;
    }

    static async update(id, foodData) {
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
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM foods WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getByCategory(category) {
        const [rows] = await db.query(
            'SELECT * FROM foods WHERE category = ? AND is_available = TRUE ORDER BY rating DESC',
            [category]
        );
        return rows;
    }

    static async getPopular(limit = 6) {
        const [rows] = await db.query(
            'SELECT * FROM foods WHERE is_available = TRUE ORDER BY rating DESC, id DESC LIMIT ?',
            [limit]
        );
        return rows;
    }
}

module.exports = Food;