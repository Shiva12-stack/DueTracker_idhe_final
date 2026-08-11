-- MySQL Database Schema for DueTracker
-- Digital Credit Management System for Local Shops

CREATE DATABASE IF NOT EXISTS duetracker_db;
USE duetracker_db;

-- 1. Sellers Table
CREATE TABLE IF NOT EXISTS sellers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'PURCHASE' or 'PAYMENT'
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(500),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_id VARCHAR(255),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Sample Initial Data (Gupta General Store)
INSERT INTO sellers (name, email, phone, password, store_name) 
VALUES ('Ramesh Gupta', 'ramesh@guptastore.com', '9876543210', 'seller123', 'Gupta General Store')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO customers (seller_id, name, phone, email, address)
VALUES (1, 'Rahul Sharma', '9123456789', 'rahul@gmail.com', 'Flat 302, Green Avenue, Delhi')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO transactions (customer_id, type, amount, description)
VALUES (1, 'PURCHASE', 2500.00, 'Monthly grocery purchase')
ON DUPLICATE KEY UPDATE amount=amount;

INSERT INTO transactions (customer_id, type, amount, description)
VALUES (1, 'PAYMENT', 1000.00, 'UPI partial payment')
ON DUPLICATE KEY UPDATE amount=amount;
