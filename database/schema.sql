-- ============================================
-- Bank Management System
-- MySQL Database Schema (Complete - v2.0)
-- Includes all columns from migrate.js
-- ============================================

-- Create and use database
CREATE DATABASE IF NOT EXISTS bank_management
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE bank_management;

-- ============================================
-- Users Table
-- Stores customer and admin accounts
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    email           VARCHAR(100)    UNIQUE NOT NULL,
    password        VARCHAR(255)    NOT NULL,
    phone           VARCHAR(15)     DEFAULT NULL,
    address         VARCHAR(255)    DEFAULT NULL,
    date_of_birth   DATE            DEFAULT NULL,
    gender          ENUM('male','female','other') DEFAULT NULL,
    father_name     VARCHAR(100)    DEFAULT NULL,
    aadhar_number   VARCHAR(12)     DEFAULT NULL,
    pan_number      VARCHAR(10)     DEFAULT NULL,
    nationality     VARCHAR(50)     DEFAULT 'Indian',
    occupation      VARCHAR(100)    DEFAULT NULL,
    balance         DECIMAL(15,2)   DEFAULT 0.00,
    account_number  VARCHAR(20)     UNIQUE NOT NULL,
    account_type    ENUM('savings','current') DEFAULT 'savings',
    role            ENUM('user','admin') DEFAULT 'user',
    is_blocked      TINYINT(1)      DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email          (email),
    INDEX idx_account_number (account_number),
    INDEX idx_role           (role),
    INDEX idx_is_blocked     (is_blocked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Transactions Table
-- Records all financial transactions
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT             NOT NULL,
    type            ENUM('deposit','withdrawal','transfer_in','transfer_out') NOT NULL,
    amount          DECIMAL(15,2)   NOT NULL,
    balance_after   DECIMAL(15,2)   NOT NULL,
    description     VARCHAR(255)    DEFAULT NULL,
    related_account VARCHAR(20)     DEFAULT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id    (user_id),
    INDEX idx_type       (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Confirm Setup
-- ============================================
SELECT '✅ Database setup complete! Tables: users, transactions' AS Status;
