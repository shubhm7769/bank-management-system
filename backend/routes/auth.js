// ============================================
// Authentication Routes
// Handles user registration, login, and logout
// ============================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
require('dotenv').config();

// ---- Helper: Generate Account Number ----
// Creates a unique 10-digit account number
function generateAccountNumber() {
    const prefix = '10'; // Bank prefix
    const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return prefix + random;
}

// ============================================
// ============================================
// POST /api/auth/register
// Register a new user account
// ============================================
router.post('/register', [
    // Input validation rules
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
    body('phone')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 10, max: 15 }).withMessage('Phone must be 10-15 digits'),
    body('address')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 255 }).withMessage('Address too long'),
    body('dateOfBirth')
        .optional({ checkFalsy: true })
        .isDate().withMessage('Please enter a valid date of birth'),
    body('gender')
        .optional({ checkFalsy: true })
        .isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
    body('fatherName')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Father name must be 2-100 characters'),
    body('aadharNumber')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^[0-9]{12}$/).withMessage('Aadhar number must be 12 digits'),
    body('panNumber')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('PAN number format: ABCDE1234F'),
    body('nationality')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 50 }).withMessage('Nationality too long'),
    body('occupation')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 }).withMessage('Occupation too long'),
    body('accountType')
        .optional()
        .isIn(['savings', 'current']).withMessage('Account type must be savings or current')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
                errors: errors.array()
            });
        }

        const { name, email, password, phone, address, dateOfBirth, gender, fatherName, aadharNumber, panNumber, nationality, occupation, accountType } = req.body;

        // Check if email already exists
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate unique account number
        let accountNumber;
        let isUnique = false;
        while (!isUnique) {
            accountNumber = generateAccountNumber();
            const [existing] = await pool.query(
                'SELECT id FROM users WHERE account_number = ?',
                [accountNumber]
            );
            if (existing.length === 0) isUnique = true;
        }

        // Insert new user into database
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, phone, address, date_of_birth, gender, father_name, aadhar_number, pan_number, nationality, occupation, account_number, account_type, role, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, phone || null, address || null, dateOfBirth || null, gender || null, fatherName || null, aadharNumber || null, panNumber || null, nationality || 'Indian', occupation || null, accountNumber, accountType || 'savings', 'user', 0.00]
        );

        // Generate JWT token
        const token = jwt.sign(
            { id: result.insertId, email, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful! Welcome to SecureBank.',
            token,
            user: {
                id: result.insertId,
                name,
                email,
                phone: phone || null,
                address: address || null,
                dateOfBirth: dateOfBirth || null,
                gender: gender || null,
                fatherName: fatherName || null,
                aadharNumber: aadharNumber || null,
                panNumber: panNumber || null,
                nationality: nationality || 'Indian',
                occupation: occupation || null,
                accountNumber,
                accountType: accountType || 'savings',
                balance: 0.00,
                role: 'user'
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration. Please try again.'
        });
    }
});

// ============================================
// POST /api/auth/login
// Login for both users and admins
// ============================================
router.post('/login', [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email'),
    body('password')
        .notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { email, password } = req.body;
        const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';

        // Find user by email
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        // Check if account is blocked
        if (user.is_blocked) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been blocked. Please contact the administrator.'
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                accountNumber: user.account_number,
                accountType: user.account_type,
                balance: parseFloat(user.balance),
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login. Please try again.'
        });
    }
});

module.exports = router;
