const { pool } = require('./config/db');
require('dotenv').config();

async function migrate() {
    try {
        console.log('Running database migrations...\n');

        // Add phone column
        try {
            await pool.query('ALTER TABLE users ADD COLUMN phone VARCHAR(15) DEFAULT NULL AFTER password');
            console.log('✅ Added phone column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  phone column already exists');
            else throw e;
        }

        // Add address column
        try {
            await pool.query('ALTER TABLE users ADD COLUMN address VARCHAR(255) DEFAULT NULL AFTER phone');
            console.log('✅ Added address column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  address column already exists');
            else throw e;
        }

        // Add account_type column
        try {
            await pool.query("ALTER TABLE users ADD COLUMN account_type ENUM('savings', 'current') DEFAULT 'savings' AFTER account_number");
            console.log('✅ Added account_type column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  account_type column already exists');
            else throw e;
        }

        // Add date_of_birth column
        try {
            await pool.query('ALTER TABLE users ADD COLUMN date_of_birth DATE DEFAULT NULL AFTER address');
            console.log('✅ Added date_of_birth column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  date_of_birth column already exists');
            else throw e;
        }

        // Add gender column
        try {
            await pool.query("ALTER TABLE users ADD COLUMN gender ENUM('male', 'female', 'other') DEFAULT NULL AFTER date_of_birth");
            console.log('✅ Added gender column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  gender column already exists');
            else throw e;
        }

        // Add father_name column
        try {
            await pool.query('ALTER TABLE users ADD COLUMN father_name VARCHAR(100) DEFAULT NULL AFTER gender');
            console.log('✅ Added father_name column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  father_name column already exists');
            else throw e;
        }

        // Add aadhar_number column
        try {
            await pool.query('ALTER TABLE users ADD COLUMN aadhar_number VARCHAR(12) DEFAULT NULL AFTER father_name');
            console.log('✅ Added aadhar_number column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  aadhar_number column already exists');
            else throw e;
        }

        // Add pan_number column
        try {
            await pool.query('ALTER TABLE users ADD COLUMN pan_number VARCHAR(10) DEFAULT NULL AFTER aadhar_number');
            console.log('✅ Added pan_number column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  pan_number column already exists');
            else throw e;
        }

        // Add nationality column
        try {
            await pool.query("ALTER TABLE users ADD COLUMN nationality VARCHAR(50) DEFAULT 'Indian' AFTER pan_number");
            console.log('✅ Added nationality column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  nationality column already exists');
            else throw e;
        }

        // Add occupation column
        try {
            await pool.query('ALTER TABLE users ADD COLUMN occupation VARCHAR(100) DEFAULT NULL AFTER nationality');
            console.log('✅ Added occupation column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  occupation column already exists');
            else throw e;
        }


        console.log('\n🎉 All migrations completed successfully!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Migration error:', e.message);
        process.exit(1);
    }
}

migrate();
