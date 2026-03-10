// ============================================
// Admin Routes
// Handles admin-specific operations
// ============================================

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(verifyToken, isAdmin);

// ============================================
// GET /api/admin/dashboard
// Get admin dashboard analytics
// ============================================
router.get('/dashboard', async (req, res) => {
    try {
        // Total users count
        const [userCount] = await pool.query(
            "SELECT COUNT(*) as total FROM users WHERE role = 'user'"
        );

        // Active users count
        const [activeUsers] = await pool.query(
            "SELECT COUNT(*) as total FROM users WHERE role = 'user' AND is_blocked = 0"
        );

        // Blocked users count
        const [blockedUsers] = await pool.query(
            "SELECT COUNT(*) as total FROM users WHERE role = 'user' AND is_blocked = 1"
        );

        // Total balance across all users
        const [totalBalance] = await pool.query(
            "SELECT COALESCE(SUM(balance), 0) as total FROM users WHERE role = 'user'"
        );

        // Total transactions count
        const [transactionCount] = await pool.query(
            'SELECT COUNT(*) as total FROM transactions'
        );

        // Today's transactions
        const [todayTransactions] = await pool.query(
            `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount 
             FROM transactions 
             WHERE DATE(created_at) = CURDATE()`
        );

        // Transaction breakdown by type
        const [transactionBreakdown] = await pool.query(
            `SELECT type, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
             FROM transactions GROUP BY type`
        );

        // Recent transactions (last 10)
        const [recentTransactions] = await pool.query(
            `SELECT t.*, u.name as user_name, u.account_number 
             FROM transactions t 
             JOIN users u ON t.user_id = u.id 
             ORDER BY t.created_at DESC LIMIT 10`
        );

        // Recent users (last 5)
        const [recentUsers] = await pool.query(
            `SELECT id, name, email, phone, account_number, account_type, balance, is_blocked, created_at 
             FROM users WHERE role = 'user' 
             ORDER BY created_at DESC LIMIT 5`
        );

        res.json({
            success: true,
            analytics: {
                totalUsers: userCount[0].total,
                activeUsers: activeUsers[0].total,
                blockedUsers: blockedUsers[0].total,
                totalBalance: totalBalance[0].total,
                totalTransactions: transactionCount[0].total,
                todayTransactions: todayTransactions[0],
                transactionBreakdown
            },
            recentTransactions,
            recentUsers
        });

    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading admin dashboard.'
        });
    }
});

// ============================================
// GET /api/admin/users
// Get all users with pagination
// ============================================
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let query = `SELECT id, name, email, phone, address, account_number, account_type, balance, is_blocked, created_at 
                      FROM users WHERE role = 'user'`;
        let countQuery = "SELECT COUNT(*) as total FROM users WHERE role = 'user'";
        const params = [];
        const countParams = [];

        if (search) {
            const searchFilter = ' AND (name LIKE ? OR email LIKE ? OR account_number LIKE ?)';
            query += searchFilter;
            countQuery += searchFilter;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [users] = await pool.query(query, params);
        const [total] = await pool.query(countQuery, countParams);

        res.json({
            success: true,
            users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total[0].total / limit),
                totalUsers: total[0].total,
                perPage: limit
            }
        });

    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users.'
        });
    }
});

// ============================================
// GET /api/admin/transactions
// Get all transactions with pagination
// ============================================
router.get('/transactions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [transactions] = await pool.query(
            `SELECT t.*, u.name as user_name, u.account_number 
             FROM transactions t 
             JOIN users u ON t.user_id = u.id 
             ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [total] = await pool.query('SELECT COUNT(*) as total FROM transactions');

        res.json({
            success: true,
            transactions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total[0].total / limit),
                totalTransactions: total[0].total,
                perPage: limit
            }
        });

    } catch (error) {
        console.error('Admin transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching transactions.'
        });
    }
});


// ============================================
// PUT /api/admin/users/:id/block
// Block a user account
// ============================================
router.put('/users/:id/block', async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const [users] = await pool.query(
            "SELECT id, name, is_blocked FROM users WHERE id = ? AND role = 'user'",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        if (users[0].is_blocked) {
            return res.status(400).json({
                success: false,
                message: 'User is already blocked.'
            });
        }

        await pool.query(
            'UPDATE users SET is_blocked = 1 WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: `User "${users[0].name}" has been blocked.`
        });

    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error blocking user.'
        });
    }
});

// ============================================
// PUT /api/admin/users/:id/unblock
// Unblock a user account
// ============================================
router.put('/users/:id/unblock', async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const [users] = await pool.query(
            "SELECT id, name, is_blocked FROM users WHERE id = ? AND role = 'user'",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        if (!users[0].is_blocked) {
            return res.status(400).json({
                success: false,
                message: 'User is not blocked.'
            });
        }

        await pool.query(
            'UPDATE users SET is_blocked = 0 WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: `User "${users[0].name}" has been unblocked.`
        });

    } catch (error) {
        console.error('Unblock user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error unblocking user.'
        });
    }
});

// ============================================
// DELETE /api/admin/users/:id
// Delete a user account and all their data
// ============================================
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const [users] = await pool.query(
            "SELECT id, name, email FROM users WHERE id = ? AND role = 'user'",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Delete user (transactions will cascade delete due to FK constraint)
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);

        res.json({
            success: true,
            message: `User "${users[0].name}" (${users[0].email}) has been deleted.`
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user.'
        });
    }
});

module.exports = router;
