// ============================================
// User Routes
// Handles user banking operations
// ============================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { verifyToken, isUser } = require('../middleware/auth');

// All routes here require authentication
router.use(verifyToken);

// ============================================
// GET /api/user/dashboard
// Get user dashboard data with recent transactions
// ============================================
router.get('/dashboard', async (req, res) => {
    try {
        // Get user's latest balance
        const [users] = await pool.query(
            'SELECT id, name, email, phone, address, balance, account_number, account_type, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        // Get recent transactions (last 5)
        const [recentTransactions] = await pool.query(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
            [req.user.id]
        );

        // Get transaction summary (total deposits, withdrawals, transfers)
        const [summary] = await pool.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) as total_deposits,
                COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0) as total_withdrawals,
                COALESCE(SUM(CASE WHEN type = 'transfer_out' THEN amount ELSE 0 END), 0) as total_transfers_out,
                COALESCE(SUM(CASE WHEN type = 'transfer_in' THEN amount ELSE 0 END), 0) as total_transfers_in,
                COUNT(*) as total_transactions
            FROM transactions WHERE user_id = ?`,
            [req.user.id]
        );

        res.json({
            success: true,
            user: users[0],
            recentTransactions,
            summary: summary[0]
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading dashboard data.'
        });
    }
});

// ============================================
// GET /api/user/balance
// Get current account balance
// ============================================
router.get('/balance', async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT balance, account_number FROM users WHERE id = ?',
            [req.user.id]
        );

        res.json({
            success: true,
            balance: parseFloat(users[0].balance),
            accountNumber: users[0].account_number
        });

    } catch (error) {
        console.error('Balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching balance.'
        });
    }
});

// ============================================
// POST /api/user/deposit
// Deposit money into user's account
// ============================================
router.post('/deposit', [
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 1, max: 1000000 }).withMessage('Amount must be between ₹1 and ₹10,00,000'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Description too long')
], async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { amount, description } = req.body;
        const depositAmount = parseFloat(amount);

        // Start transaction
        await connection.beginTransaction();

        // Update balance
        await connection.query(
            'UPDATE users SET balance = balance + ? WHERE id = ?',
            [depositAmount, req.user.id]
        );

        // Get new balance
        const [updatedUser] = await connection.query(
            'SELECT balance FROM users WHERE id = ?',
            [req.user.id]
        );
        const newBalance = parseFloat(updatedUser[0].balance);

        // Record transaction
        await connection.query(
            'INSERT INTO transactions (user_id, type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'deposit', depositAmount, newBalance, description || 'Cash Deposit']
        );

        // Commit transaction
        await connection.commit();

        res.json({
            success: true,
            message: `₹${depositAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} deposited successfully!`,
            newBalance
        });

    } catch (error) {
        await connection.rollback();
        console.error('Deposit error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing deposit.'
        });
    } finally {
        connection.release();
    }
});

// ============================================
// POST /api/user/withdraw
// Withdraw money from user's account
// ============================================
router.post('/withdraw', [
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 1, max: 1000000 }).withMessage('Amount must be between ₹1 and ₹10,00,000'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Description too long')
], async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { amount, description } = req.body;
        const withdrawAmount = parseFloat(amount);

        // Start transaction
        await connection.beginTransaction();

        // Check current balance
        const [user] = await connection.query(
            'SELECT balance FROM users WHERE id = ? FOR UPDATE',
            [req.user.id]
        );
        const currentBalance = parseFloat(user[0].balance);

        if (withdrawAmount > currentBalance) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Your current balance is ₹${currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            });
        }

        // Update balance
        await connection.query(
            'UPDATE users SET balance = balance - ? WHERE id = ?',
            [withdrawAmount, req.user.id]
        );

        // Get new balance
        const [updatedUser] = await connection.query(
            'SELECT balance FROM users WHERE id = ?',
            [req.user.id]
        );
        const newBalance = parseFloat(updatedUser[0].balance);

        // Record transaction
        await connection.query(
            'INSERT INTO transactions (user_id, type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'withdrawal', withdrawAmount, newBalance, description || 'Cash Withdrawal']
        );

        // Commit transaction
        await connection.commit();

        res.json({
            success: true,
            message: `₹${withdrawAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} withdrawn successfully!`,
            newBalance
        });

    } catch (error) {
        await connection.rollback();
        console.error('Withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing withdrawal.'
        });
    } finally {
        connection.release();
    }
});

// ============================================
// POST /api/user/transfer
// Transfer money to another account
// ============================================
router.post('/transfer', [
    body('accountNumber')
        .trim()
        .notEmpty().withMessage('Recipient account number is required')
        .isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits'),
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 1, max: 1000000 }).withMessage('Amount must be between ₹1 and ₹10,00,000'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Description too long')
], async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { accountNumber, amount, description } = req.body;
        const transferAmount = parseFloat(amount);

        // Cannot transfer to own account
        if (accountNumber === req.user.account_number) {
            return res.status(400).json({
                success: false,
                message: 'Cannot transfer to your own account.'
            });
        }

        // Start transaction
        await connection.beginTransaction();

        // Check sender's balance
        const [sender] = await connection.query(
            'SELECT balance FROM users WHERE id = ? FOR UPDATE',
            [req.user.id]
        );
        const senderBalance = parseFloat(sender[0].balance);

        if (transferAmount > senderBalance) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Your current balance is ₹${senderBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            });
        }

        // Check if recipient exists
        const [recipient] = await connection.query(
            'SELECT id, name, account_number, is_blocked FROM users WHERE account_number = ? FOR UPDATE',
            [accountNumber]
        );

        if (recipient.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Recipient account not found.'
            });
        }

        if (recipient[0].is_blocked) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Recipient account is blocked.'
            });
        }

        // Deduct from sender
        await connection.query(
            'UPDATE users SET balance = balance - ? WHERE id = ?',
            [transferAmount, req.user.id]
        );

        // Add to recipient
        await connection.query(
            'UPDATE users SET balance = balance + ? WHERE id = ?',
            [transferAmount, recipient[0].id]
        );

        // Get updated balances
        const [updatedSender] = await connection.query(
            'SELECT balance FROM users WHERE id = ?',
            [req.user.id]
        );
        const [updatedRecipient] = await connection.query(
            'SELECT balance FROM users WHERE id = ?',
            [recipient[0].id]
        );

        const senderNewBalance = parseFloat(updatedSender[0].balance);
        const recipientNewBalance = parseFloat(updatedRecipient[0].balance);

        // Record sender's transaction
        await connection.query(
            'INSERT INTO transactions (user_id, type, amount, balance_after, description, related_account) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, 'transfer_out', transferAmount, senderNewBalance,
            description || `Transfer to ${recipient[0].name}`, accountNumber]
        );

        // Record recipient's transaction
        await connection.query(
            'INSERT INTO transactions (user_id, type, amount, balance_after, description, related_account) VALUES (?, ?, ?, ?, ?, ?)',
            [recipient[0].id, 'transfer_in', transferAmount, recipientNewBalance,
            description || `Transfer from ${req.user.name}`, req.user.account_number]
        );

        // Commit transaction
        await connection.commit();

        res.json({
            success: true,
            message: `₹${transferAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} transferred successfully to ${recipient[0].name}!`,
            newBalance: senderNewBalance,
            recipientName: recipient[0].name
        });

    } catch (error) {
        await connection.rollback();
        console.error('Transfer error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing transfer.'
        });
    } finally {
        connection.release();
    }
});

// ============================================
// GET /api/user/transactions
// Get transaction history with pagination
// ============================================
router.get('/transactions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const type = req.query.type; // Optional filter: deposit, withdrawal, transfer_in, transfer_out

        let query = 'SELECT * FROM transactions WHERE user_id = ?';
        let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?';
        const params = [req.user.id];
        const countParams = [req.user.id];

        // Apply type filter if provided
        if (type === 'today') {
            query += ' AND DATE(created_at) = CURDATE()';
            countQuery += ' AND DATE(created_at) = CURDATE()';
        } else if (type && ['deposit', 'withdrawal', 'transfer_in', 'transfer_out'].includes(type)) {
            query += ' AND type = ?';
            countQuery += ' AND type = ?';
            params.push(type);
            countParams.push(type);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [transactions] = await pool.query(query, params);
        const [total] = await pool.query(countQuery, countParams);

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
        console.error('Transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching transactions.'
        });
    }
});

// ============================================
// PUT /api/user/change-password
// Change user's password
// ============================================
router.put('/change-password', [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 4 }).withMessage('New password must be at least 4 characters')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { currentPassword, newPassword } = req.body;

        // Get user's current password hash
        const [users] = await pool.query(
            'SELECT password FROM users WHERE id = ?',
            [req.user.id]
        );

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, users[0].password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect.'
            });
        }

        // Check if new password is same as current
        const isSame = await bcrypt.compare(newPassword, users[0].password);
        if (isSame) {
            return res.status(400).json({
                success: false,
                message: 'New password cannot be the same as current password.'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await pool.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, req.user.id]
        );

        res.json({
            success: true,
            message: 'Password changed successfully!'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password.'
        });
    }
});

// ============================================
// GET /api/user/profile
// Get user profile info
// ============================================
router.get('/profile', async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, name, email, phone, address, balance, account_number, account_type, is_blocked, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        res.json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile.'
        });
    }
});

// ============================================
// PUT /api/user/profile
// Update user profile (name, phone, address)
// ============================================
router.put('/profile', [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('phone')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 10, max: 15 }).withMessage('Phone must be 10-15 digits'),
    body('address')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 255 }).withMessage('Address too long')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { name, phone, address } = req.body;

        // Build dynamic update query
        const updates = [];
        const values = [];

        if (name) { updates.push('name = ?'); values.push(name); }
        if (phone !== undefined) { updates.push('phone = ?'); values.push(phone || null); }
        if (address !== undefined) { updates.push('address = ?'); values.push(address || null); }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update.'
            });
        }

        values.push(req.user.id);
        await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Return updated profile
        const [updatedUser] = await pool.query(
            'SELECT id, name, email, phone, address, balance, account_number, account_type, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully!',
            user: updatedUser[0]
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile.'
        });
    }
});

module.exports = router;
