// ============================================
// Database Seed Script
// Creates a default admin account
// Run: npm run seed
// ============================================

const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./config/db');
require('dotenv').config();

async function seedDatabase() {
    console.log('🌱 Seeding database...\n');

    const connected = await testConnection();
    if (!connected) {
        console.error('❌ Cannot seed: Database not connected.');
        process.exit(1);
    }

    try {
        // Check if admin already exists
        const [existingAdmin] = await pool.query(
            "SELECT id FROM users WHERE email = 'shubham@bank.com'"
        );

        if (existingAdmin.length > 0) {
            console.log('⚠️  Admin account already exists. Skipping seed.');
            process.exit(0);
        }

        // Hash admin password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash('Admin@123', salt);

        // Create admin account
        await pool.query(
            'INSERT INTO users (name, email, password, phone, address, account_number, account_type, role, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            ['Admin', 'shubham@bank.com', hashedPassword, null, null, '1000000001', 'savings', 'admin', 0.00]
        );

        console.log('✅ Admin account created successfully!');
        console.log('');
        console.log('   📧 Email:    shubham@bank.com');
        console.log('   🔑 Password: Admin@123');
        console.log('');
        console.log('⚠️  Please change the admin password after first login.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error.message);
        process.exit(1);
    }
}

seedDatabase();
