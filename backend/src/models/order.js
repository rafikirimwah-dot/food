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

// Add admin/util methods inside the Order class
Order.getAllOrders = async function(status = null, startDate = null, endDate = null) {
    try {
        let query = `
            SELECT o.*, 
                   u.username as client_name, 
                   u.phone as client_phone,
                   d.username as delivery_name,
                   d.phone as delivery_phone
            FROM orders o
            LEFT JOIN users u ON o.client_id = u.id
            LEFT JOIN users d ON o.delivery_person_id = d.id
            WHERE 1=1
        `;
        const values = [];
        
        if (status) {
            query += ' AND o.status = ?';
            values.push(status);
        }
        
        if (startDate) {
            query += ' AND DATE(o.created_at) >= ?';
            values.push(startDate);
        }
        
        if (endDate) {
            query += ' AND DATE(o.created_at) <= ?';
            values.push(endDate);
        }
        
        query += ' ORDER BY o.created_at DESC';
        
        const [rows] = await db.query(query, values);
        return rows.map(row => {
            if (typeof row.items === 'string') {
                row.items = JSON.parse(row.items);
            }
            return row;
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        return [];
    }
};

Order.getRevenueStats = async function(period = 'monthly') {
    try {
        let groupBy;
        switch(period) {
            case 'daily':
                groupBy = 'DATE(created_at)';
                break;
            case 'weekly':
                groupBy = 'YEARWEEK(created_at)';
                break;
            case 'monthly':
            default:
                groupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
                break;
        }
        
        const [rows] = await db.query(`
            SELECT 
                ${groupBy} as period,
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as average_order_value,
                SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END) as delivered_revenue
            FROM orders
            WHERE status IN ('delivered', 'confirmed', 'preparing', 'picked_up', 'in_transit')
            GROUP BY ${groupBy}
            ORDER BY period DESC
            LIMIT 12
        `);
        
        return rows;
    } catch (error) {
        console.error('Get revenue stats error:', error);
        return [];
    }
};

Order.findByOrderNumber = async function(orderNumber) {
    try {
        const [rows] = await db.query(`
            SELECT o.*, 
                   u.username as client_name, 
                   u.phone as client_phone,
                   d.username as delivery_name,
                   d.phone as delivery_phone
            FROM orders o
            LEFT JOIN users u ON o.client_id = u.id
            LEFT JOIN users d ON o.delivery_person_id = d.id
            WHERE o.order_number = ?
        `, [orderNumber]);
        
        if (rows.length && typeof rows[0].items === 'string') {
            rows[0].items = JSON.parse(rows[0].items);
        }
        
        return rows[0];
    } catch (error) {
        console.error('FindByOrderNumber error:', error);
        return null;
    }
};

module.exports = Order;