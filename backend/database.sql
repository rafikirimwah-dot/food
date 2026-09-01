-- ============================================
-- Creates the complete food delivery database
-- ============================================

CREATE DATABASE IF NOT EXISTS food_delivery;
USE food_delivery;

-- ============================================
-- Creates users table for all system users
-- ============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'user', 'delivery') DEFAULT 'user',
    phone VARCHAR(20),
    address TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    hotel_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- Creates hotels/restaurants table
-- ============================================
CREATE TABLE hotels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    image VARCHAR(255),
    cuisine_type VARCHAR(50),
    rating DECIMAL(3,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    manager_id INT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- ============================================
-- Creates foods table with hotel-specific pricing
-- ============================================
CREATE TABLE foods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hotel_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50),
    image VARCHAR(255),
    emoji VARCHAR(10),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id)
);

-- ============================================
-- Creates orders table with commission tracking
-- ============================================
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    hotel_id INT NOT NULL,
    delivery_person_id INT NULL,
    items JSON NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_instructions TEXT,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid_to_admin', 'paid_to_manager') DEFAULT 'pending',
    is_delivery_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (hotel_id) REFERENCES hotels(id),
    FOREIGN KEY (delivery_person_id) REFERENCES users(id)
);

-- ============================================
-- Creates transactions table for payment tracking
-- ============================================
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) NOT NULL,
    manager_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    payment_type ENUM('user_to_admin', 'admin_to_manager') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- ============================================
-- Creates reviews table
-- ============================================
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    hotel_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (hotel_id) REFERENCES hotels(id)
);

-- ============================================
-- Insert Hotels
-- ============================================
INSERT INTO hotels (name, description, address, cuisine_type, rating, commission_rate) VALUES
('TIME HOTEL', 'Luxury dining with international cuisine', '123 Time Square, City Center', 'International', 4.8, 10.00),
('MILELE HOTEL', 'Authentic local and continental dishes', '456 Milele Road, Westside', 'Continental', 4.5, 10.00),
('KFU', 'Famous for crispy fried chicken', '789 KFU Street, Eastside', 'Fast Food', 4.3, 10.00),
('CHICKEN OUT', 'Best grilled and roasted chicken', '321 Chicken Avenue, Southside', 'Grill', 4.6, 10.00),
('SANFORD', 'Exquisite seafood and steakhouse', '654 Sanford Lane, Northside', 'Seafood', 4.7, 10.00);

-- ============================================
-- Insert Foods for TIME HOTEL
-- ============================================
INSERT INTO foods (hotel_id, name, description, price, category, emoji) VALUES
(1, 'Margherita Pizza', 'Classic tomato sauce, mozzarella, fresh basil', 18.99, 'Pizza', '🍕'),
(1, 'Beef Burger', 'Juicy beef with cheddar, lettuce, tomato', 16.99, 'Burgers', '🍔'),
(1, 'Grilled Salmon', 'Fresh salmon with herb butter', 24.99, 'Seafood', '🐟'),
(1, 'Pasta Carbonara', 'Creamy pasta with bacon and parmesan', 19.99, 'Pasta', '🍝'),
(1, 'Caesar Salad', 'Fresh romaine with parmesan and croutons', 12.99, 'Salads', '🥗');

-- ============================================
-- Insert Foods for MILELE HOTEL
-- ============================================
INSERT INTO foods (hotel_id, name, description, price, category, emoji) VALUES
(2, 'Margherita Pizza', 'Classic with fresh mozzarella and basil', 16.99, 'Pizza', '🍕'),
(2, 'Chicken Burger', 'Grilled chicken with avocado and bacon', 14.99, 'Burgers', '🍔'),
(2, 'Beef Stew', 'Tender beef with vegetables in rich gravy', 18.99, 'Main Course', '🍲'),
(2, 'Spaghetti Bolognese', 'Classic Italian pasta with meat sauce', 15.99, 'Pasta', '🍝'),
(2, 'Greek Salad', 'Fresh vegetables with feta cheese', 10.99, 'Salads', '🥗');

-- ============================================
-- Insert Foods for KFU
-- ============================================
INSERT INTO foods (hotel_id, name, description, price, category, emoji) VALUES
(3, 'Original Fried Chicken', 'Crispy fried chicken with special herbs', 13.99, 'Chicken', '🍗'),
(3, 'Spicy Burger', 'Crispy chicken with spicy sauce', 11.99, 'Burgers', '🍔'),
(3, 'French Fries', 'Golden crispy fries with seasoning', 5.99, 'Sides', '🍟'),
(3, 'Chicken Wings', 'Spicy buffalo wings with dip', 12.99, 'Appetizers', '🌶️'),
(3, 'Coleslaw', 'Fresh cabbage and carrot salad', 4.99, 'Sides', '🥬');

-- ============================================
-- Insert Foods for CHICKEN OUT
-- ============================================
INSERT INTO foods (hotel_id, name, description, price, category, emoji) VALUES
(4, 'Grilled Chicken', 'Whole grilled chicken with herbs', 16.99, 'Chicken', '🍗'),
(4, 'Chicken Burger', 'Grilled chicken breast with cheese', 13.99, 'Burgers', '🍔'),
(4, 'Roasted Potatoes', 'Herb roasted potatoes', 6.99, 'Sides', '🥔'),
(4, 'Chicken Salad', 'Grilled chicken with mixed greens', 11.99, 'Salads', '🥗'),
(4, 'Chicken Tenders', 'Crispy chicken strips with sauce', 10.99, 'Appetizers', '🌯');

-- ============================================
-- Insert Foods for SANFORD
-- ============================================
INSERT INTO foods (hotel_id, name, description, price, category, emoji) VALUES
(5, 'Grilled Lobster', 'Fresh lobster with garlic butter', 34.99, 'Seafood', '🦞'),
(5, 'Beef Steak', 'Premium steak cooked to perfection', 29.99, 'Steak', '🥩'),
(5, 'Seafood Platter', 'Mixed seafood with dipping sauces', 32.99, 'Seafood', '🦐'),
(5, 'Caesar Salad', 'Classic Caesar with grilled chicken', 13.99, 'Salads', '🥗'),
(5, 'Garlic Bread', 'Toasted bread with garlic butter', 6.99, 'Appetizers', '🍞');

-- ============================================
-- Insert Default Admin User (password: admin123)
-- ============================================
INSERT INTO users (username, email, password, role, is_approved) VALUES
('admin', 'admin@food.com', '$2b$10$YourHashedPasswordHere', 'admin', TRUE);

-- ============================================
-- Insert Sample Users (password: user123)
-- ============================================
INSERT INTO users (username, email, password, role, is_approved) VALUES
('client1', 'user@food.com', '$2b$10$YourHashedPasswordHere', 'user', TRUE),
('manager1', 'manager@time.com', '$2b$10$YourHashedPasswordHere', 'manager', FALSE);

-- ============================================
-- Insert Sample Delivery Person
-- ============================================
INSERT INTO users (username, email, password, role, is_approved) VALUES
('delivery1', 'delivery@food.com', '$2b$10$YourHashedPasswordHere', 'delivery', TRUE);