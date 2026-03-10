// ============================================
// createdb.js — Bank Management System
// Creates database, tables, and admin account
// Run: node createdb.js
// ============================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createDatabase() {
    console.log('\n============================================');
    console.log('  Bank Management System - DB Setup');
    console.log('============================================\n');

    // Step 1: Connect WITHOUT specifying a database
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
    });

    console.log('✅ MySQL connection successful!\n');

    // Step 2: Create database
    await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'bank_management'}\`
         CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE \`${process.env.DB_NAME || 'bank_management'}\``);
    console.log('✅ Database "bank_management" created/verified!');

    // Step 3: Create users table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id            INT AUTO_INCREMENT PRIMARY KEY,
            name          VARCHAR(100)    NOT NULL,
            email         VARCHAR(100)    UNIQUE NOT NULL,
            password      VARCHAR(255)    NOT NULL,
            phone         VARCHAR(15)     DEFAULT NULL,
            address       VARCHAR(255)    DEFAULT NULL,
            date_of_birth DATE            DEFAULT NULL,
            gender        ENUM('male','female','other') DEFAULT NULL,
            father_name   VARCHAR(100)    DEFAULT NULL,
            aadhar_number VARCHAR(12)     DEFAULT NULL,
            pan_number    VARCHAR(10)     DEFAULT NULL,
            nationality   VARCHAR(50)     DEFAULT 'Indian',
            occupation    VARCHAR(100)    DEFAULT NULL,
            balance       DECIMAL(15,2)   DEFAULT 0.00,
            account_number VARCHAR(20)   UNIQUE NOT NULL,
            account_type  ENUM('savings','current') DEFAULT 'savings',
            role          ENUM('user','admin') DEFAULT 'user',
            is_blocked    TINYINT(1)      DEFAULT 0,
            created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
            updated_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email          (email),
            INDEX idx_account_number (account_number),
            INDEX idx_role           (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table "users" created/verified!');

    // Step 4: Create transactions table
    await connection.query(`
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table "transactions" created/verified!\n');

    // Step 5: Seed admin account
    const [existing] = await connection.query(
        "SELECT id FROM users WHERE email = 'shubham@bank.com'"
    );

    if (existing.length > 0) {
        console.log('⚠️  Admin account already exists — skipping seed.');
    } else {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash('Admin@123', salt);

        await connection.query(
            `INSERT INTO users
                (name, email, password, account_number, account_type, role, balance)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Admin', 'shubham@bank.com', hashedPassword, '1000000001', 'savings', 'admin', 0.00]
        );
        console.log('✅ Admin account created!');
    }

    await connection.end();

    console.log('\n============================================');
    console.log('  SETUP COMPLETE!');
    console.log('============================================');
    console.log('  Admin Login Credentials:');
    console.log('    Email   : shubham@bank.com');
    console.log('    Password: Admin@123');
    console.log('============================================\n');
    console.log('  Now run: npm start\n');
}

createDatabase().catch(err => {
    console.error('\n❌ Setup failed:', err.message);
    console.error('\nCheck:');
    console.error('  1. MySQL service is running (XAMPP → Start MySQL)');
    console.error('  2. DB_PASSWORD in backend/.env is correct');
    process.exit(1);
});
