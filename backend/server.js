// ============================================
// Bank Management System - Main Server
// Express.js application entry point
// ============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// Middleware Configuration
// ============================================

// Enable CORS for frontend communication
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ============================================
// API Routes
// ============================================

// Authentication routes (login, register)
app.use('/api/auth', authRoutes);

// User routes (dashboard, transactions, etc.)
app.use('/api/user', userRoutes);

// Admin routes (analytics, user management)
app.use('/api/admin', adminRoutes);

// ============================================
// Frontend Routes (Serve HTML pages)
// ============================================

// Serve login page as default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Catch all other routes and serve frontend
app.get('*', (req, res) => {
    // If it's an API route that wasn't found
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found.'
        });
    }
    // Otherwise serve the frontend
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ============================================
// Global Error Handler
// ============================================
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong on the server.'
    });
});

// ============================================
// Start Server
// ============================================
async function startServer() {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
        console.error('⚠️  Warning: Could not connect to the database.');
        console.error('   Make sure MySQL is running and database "bank_management" exists.');
        console.error('   Run the SQL file in database/schema.sql to set up the database.');
    }

    app.listen(PORT, () => {
        console.log('');
        console.log('============================================');
        console.log('  🏦 Bank Management System Server');
        console.log('============================================');
        console.log(`  ✅ Server running on: http://localhost:${PORT}`);
        console.log(`  📁 Frontend served from: ../frontend`);
        console.log(`  🔌 Database: ${dbConnected ? 'Connected' : 'Not Connected'}`);
        console.log('============================================');
        console.log('');
    });
}

startServer();
