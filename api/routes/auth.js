const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authRateLimiter } = require('../middleware/rateLimit');
const { verifyJWT } = require('../middleware/auth');
const db = require('../utils/db');
const logger = require('../utils/logger');
const emailService = require('../utils/email');

/**
 * POST /auth/signup
 * Create new user account
 */
router.post('/signup', authRateLimiter, async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Email already registered',
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user (trigger will auto-create credits with 50 free credits)
    const result = await db.query(
      `INSERT INTO users (email, password_hash, full_name, plan_tier)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, plan_tier, created_at`,
      [email.toLowerCase(), passwordHash, full_name || null, 'free']
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    logger.info('User signed up', {
      userId: user.id,
      email: user.email
    });

    // Send welcome email (async, don't wait)
    emailService.sendWelcomeEmail(email, full_name).catch(err => logger.error('Failed to send welcome email:', err));

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        plan_tier: user.plan_tier,
        created_at: user.created_at
      },
      token,
      welcome_credits: 50 // 50K tokens free
    });

  } catch (error) {
    logger.error('Signup error:', error);
    res.status(500).json({
      error: 'Signup failed',
      message: 'An error occurred while creating your account'
    });
  }
});

/**
 * POST /auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    // Find user
    const result = await db.query(
      `SELECT u.id, u.email, u.password_hash, u.full_name, u.plan_tier, u.is_active, c.balance as credit_balance
       FROM users u
       LEFT JOIN credits c ON u.id = c.user_id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Contact support@readypi.io'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    logger.info('User logged in', {
      userId: user.id,
      email: user.email
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        plan_tier: user.plan_tier,
        credit_balance: parseInt(user.credit_balance) || 0
      },
      token
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred while logging in'
    });
  }
});

/**
 * GET /auth/me
 * Get current user profile
 */
router.get('/me', verifyJWT, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.full_name, u.plan_tier, u.created_at, u.email_verified,
              c.balance as credit_balance, c.total_purchased, c.total_used,
              COUNT(DISTINCT ak.id) as api_key_count
       FROM users u
       LEFT JOIN credits c ON u.id = c.user_id
       LEFT JOIN api_keys ak ON u.id = ak.user_id AND ak.is_active = true
       WHERE u.id = $1
       GROUP BY u.id, c.balance, c.total_purchased, c.total_used`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      plan_tier: user.plan_tier,
      email_verified: user.email_verified,
      created_at: user.created_at,
      credits: {
        balance: parseInt(user.credit_balance) || 0,
        total_purchased: parseInt(user.total_purchased) || 0,
        total_used: parseInt(user.total_used) || 0
      },
      api_key_count: parseInt(user.api_key_count) || 0
    });

  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch user profile'
    });
  }
});

/**
 * POST /auth/logout
 * Logout user (client-side token removal, server logs event)
 */
router.post('/logout', verifyJWT, (req, res) => {
  logger.info('User logged out', {
    userId: req.user.id,
    email: req.user.email
  });

  res.json({
    message: 'Logged out successfully'
  });
});

// Register Firebase Auth token exchange route
const firebaseExchange = require('./firebase-exchange');
firebaseExchange.register(router);

module.exports = router;
