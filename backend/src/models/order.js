// ============================================
// Order model - Handles all order-related database operations
// ============================================
const db = require('../config/database');

class Order {
    // Generates a unique order number
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

    // Creates a new order
    static async create(orderData) {
        try {
            const { 
                user_id, 
                hotel_id, 
                items, 
                subtotal, 
                commission, 
                total_amount, 
                delivery_address,
                delivery_instructions,
                payment_method 
            } = orderData;
            
            const orderNumber = this.generateOrderNumber();
            
            const [result] = await db.query(
                `INSERT INTO orders 
                (order_number, user_id, hotel_id, items, subtotal, commission, total_amount, 
                 delivery_address, delivery_instructions, payment_method) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [orderNumber, user_id, hotel_id, JSON.stringify(items), subtotal, commission, 
                 total_amount, delivery_address, delivery_instructions, payment_method || 'simulated']
            );
            
            return result.insertId;
        } catch (error) {
            console.error('Create order error:', error);
            throw error;
        }
    }

    // Finds an order by ID
    static async findById(id) {
        try {
            const [rows] = await db.query(`
                SELECT o.*, 
                       u.username as user_name, 
                       u.phone as user_phone,
                       h.name as hotel_name,
                       d.username as delivery_name,
                       d.phone as delivery_phone
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                LEFT JOIN hotels h ON o.hotel_id = h.id
                LEFT JOIN users d ON o.delivery_person_id = d.id
                WHERE o.id = ?
            `, [id]);
            
            if (rows.length && typeof rows[0].items === 'string') {
                rows[0].items = JSON.parse(rows[0].items);
            }
            
            return rows[0];
        } catch (error) {
            console.error('FindById order error:', error);
            return null;
        }
    }

    // Finds orders by user ID
    static async findByUser(userId) {
        try {
            const [rows] = await db.query(`
                SELECT o.*, h.name as hotel_name 
                FROM orders o
                LEFT JOIN hotels h ON o.hotel_id = h.id
                WHERE o.user_id = ?
                ORDER BY o.created_at DESC
            `, [userId]);
            
            return rows.map(row => {
                if (typeof row.items === 'string') {
                    row.items = JSON.parse(row.items);
                }
                return row;
            });
        } catch (error) {
            console.error('FindByUser error:', error);
            return [];
        }
    }

    // Finds orders by hotel ID (for managers)
    static async findByHotel(hotelId) {
        try {
            const [rows] = await db.query(`
                SELECT o.*, u.username as user_name, u.phone as user_phone
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.hotel_id = ?
                ORDER BY o.created_at DESC
            `, [hotelId]);
            
            return rows.map(row => {
                if (typeof row.items === 'string') {
                    row.items = JSON.parse(row.items);
                }
                return row;
            });
        } catch (error) {
            console.error('FindByHotel error:', error);
            return [];
        }
    }

    // Gets pending orders for admin
    static async getPendingOrders() {
        try {
            const [rows] = await db.query(`
                SELECT o.*, u.username as user_name, h.name as hotel_name
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                LEFT JOIN hotels h ON o.hotel_id = h.id
                WHERE o.status IN ('pending', 'confirmed', 'preparing', 'ready')
                ORDER BY o.created_at ASC
            `);
            
            return rows.map(row => {
                if (typeof row.items === 'string') {
                    row.items = JSON.parse(row.items);
                }
                return row;
            });
        } catch (error) {
            console.error('Get pending orders error:', error);
            return [];
        }
    }

    // Updates order status
    static async updateStatus(orderId, status) {
        try {
            const [result] = await db.query(
                'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, orderId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Update status error:', error);
            return false;
        }
    }

    // Assigns a delivery person to an order
    static async assignDelivery(orderId, deliveryPersonId) {
        try {
            const [result] = await db.query(
                'UPDATE orders SET delivery_person_id = ?, status = "confirmed", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [deliveryPersonId, orderId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Assign delivery error:', error);
            return false;
        }
    }

    // Confirms delivery by user
    static async confirmDelivery(orderId) {
        try {
            const [result] = await db.query(
                'UPDATE orders SET is_delivery_confirmed = 1, status = "delivered", delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [orderId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Confirm delivery error:', error);
            return false;
        }
    }

    // Creates a transaction record
    static async createTransaction(transactionData) {
        try {
            const { order_id, amount, commission, manager_amount, payment_type, transaction_ref } = transactionData;
            const [result] = await db.query(
                'INSERT INTO transactions (order_id, amount, commission, manager_amount, payment_type, transaction_ref) VALUES (?, ?, ?, ?, ?, ?)',
                [order_id, amount, commission, manager_amount, payment_type, transaction_ref]
            );
            return result.insertId;
        } catch (error) {
            console.error('Create transaction error:', error);
            throw error;
        }
    }

    // Gets order statistics
    static async getOrderStats() {
        try {
            const [rows] = await db.query(`
                SELECT 
                    COUNT(*) as total_orders,
                    SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_orders,
                    SUM(CASE WHEN status IN ('pending', 'confirmed', 'preparing') THEN 1 ELSE 0 END) as pending_orders,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
                    SUM(total_amount) as total_revenue,
                    SUM(commission) as total_commission,
                    AVG(CASE WHEN status = 'delivered' AND delivered_at IS NOT NULL 
                        THEN TIMESTAMPDIFF(MINUTE, created_at, delivered_at) ELSE NULL END) as avg_delivery_time
                FROM orders
            `);
            return rows[0];
        } catch (error) {
            console.error('Get order stats error:', error);
            return null;
        }
    }

    // Finds orders by delivery person
    static async findByDeliveryPerson(deliveryId) {
        try {
            const [rows] = await db.query(`
                SELECT o.*, h.name as hotel_name, u.username as user_name
                FROM orders o
                LEFT JOIN hotels h ON o.hotel_id = h.id
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.delivery_person_id = ?
                ORDER BY o.created_at DESC
            `, [deliveryId]);
            
            return rows.map(row => {
                if (typeof row.items === 'string') {
                    row.items = JSON.parse(row.items);
                }
                return row;
            });
        } catch (error) {
            console.error('FindByDeliveryPerson error:', error);
            return [];
        }
    }

    // Gets orders by status for admin
    static async getOrdersByStatus(status) {
        try {
            const [rows] = await db.query(`
                SELECT o.*, u.username as user_name, h.name as hotel_name
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                LEFT JOIN hotels h ON o.hotel_id = h.id
                WHERE o.status = ?
                ORDER BY o.created_at DESC
            `, [status]);
            
            return rows.map(row => {
                if (typeof row.items === 'string') {
                    row.items = JSON.parse(row.items);
                }
                return row;
            });
        } catch (error) {
            console.error('Get orders by status error:', error);
            return [];
        }
    }
}

module.exports = Order;