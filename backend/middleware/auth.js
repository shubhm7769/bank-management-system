// ============================================
// Authentication Middleware
// Verifies JWT tokens and checks user roles
// ============================================

const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
require('dotenv').config();

// ---- Verify JWT Token ----
// Checks if the request has a valid JWT token
const verifyToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists and is not blocked
        const [users] = await pool.query(
            'SELECT id, name, email, role, is_blocked, account_number, balance FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Token is invalid.'
            });
        }

        if (users[0].is_blocked) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been blocked. Contact admin.'
            });
        }

        // Attach user info to request object
        req.user = users[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please login again.'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

// ---- Check Admin Role ----
// Ensures the authenticated user is an admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// ---- Check User Role ----
// Ensures the authenticated user is a regular user
const isUser = (req, res, next) => {
    if (req.user.role !== 'user') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. User account required.'
        });
    }
    next();
};

module.exports = { verifyToken, isAdmin, isUser };
