const db = require('../config/database');

class Order {
    static generateOrderNumber() {
        const date = new Date();
        const timestamp = date.getFullYear() +
            String(date.getMonth() + 1).padStart(2, '0') +
            String(date.getDate()).padStart(2, '0') +
            String(date.getHours()).padStart(2, '0') +
            String(date.getMinutes()).padStart(2, '0') +
            String(date.getSeconds()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `ORD-${timestamp}-${random}`;
    }

    static async create(orderData) {
        const { client_id, items, total_amount, delivery_address, delivery_instructions, payment_method } = orderData;
        const orderNumber = this.generateOrderNumber();
        
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                `INSERT INTO orders 
                (order_number, client_id, items, total_amount, delivery_address, delivery_instructions, payment_method) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [orderNumber, client_id, JSON.stringify(items), total_amount, delivery_address, delivery_instructions, payment_method]
            );

            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async findById(id) {
        const [rows] = await db.query(`
            SELECT o.*, 
                   u.username as client_name, 
                   u.phone as client_phone,
                   d.username as delivery_name,
                   d.phone as delivery_phone
            FROM orders o
            LEFT JOIN users u ON o.client_id = u.id
            LEFT JOIN users d ON o.delivery_person_id = d.id
            WHERE o.id = ?
        `, [id]);
        
        if (rows.length && typeof rows[0].items === 'string') {
            rows[0].items = JSON.parse(rows[0].items);
        }
        
        return rows[0];
    }

    static async findByClientId(clientId, status = null) {
        let query = `
            SELECT o.*, d.username as delivery_name
            FROM orders o
            LEFT JOIN users d ON o.delivery_person_id = d.id
            WHERE o.client_id = ?
        `;
        const values = [clientId];
        
        if (status) {
            query += ' AND o.status = ?';
            values.push(status);
        }
        
        query += ' ORDER BY o.created_at DESC';
        
        const [rows] = await db.query(query, values);
        return rows.map(row => {
            if (typeof row.items === 'string') {
                row.items = JSON.parse(row.items);
            }
            return row;
        });
    }

    static async getPendingOrders() {
        const [rows] = await db.query(`
            SELECT o.*, u.username as client_name, u.phone as client_phone
            FROM orders o
            LEFT JOIN users u ON o.client_id = u.id
            WHERE o.status IN ('pending', 'confirmed', 'preparing')
            ORDER BY o.created_at ASC
        `);
        
        return rows.map(row => {
            if (typeof row.items === 'string') {
                row.items = JSON.parse(row.items);
            }
            return row;
        });
    }

    static async updateStatus(orderId, status) {
        const [result] = await db.query(
            'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, orderId]
        );
        return result.affectedRows > 0;
    }

    static async assignDelivery(orderId, deliveryPersonId) {
        const [result] = await db.query(
            'UPDATE orders SET delivery_person_id = ?, status = "confirmed", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [deliveryPersonId, orderId]
        );
        return result.affectedRows > 0;
    }

    static async confirmDelivery(orderId) {
        const [result] = await db.query(
            'UPDATE orders SET status = "delivered", delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [orderId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Order;