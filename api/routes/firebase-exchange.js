const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const logger = require('../utils/logger');

// Lazy-loaded Firebase Admin SDK
let admin = null;
let initializationError = null;

/**
 * Get or initialize Firebase Admin SDK with robust error handling
 * @returns {object} Firebase Admin SDK instance
 */
async function getFirebaseAdmin() {
  // Return cached instance if available
  if (admin) {
    return admin;
  }

  // Return cached error if initialization previously failed
  if (initializationError) {
    throw initializationError;
  }

  try {
    const adminModule = require('firebase-admin');

    // Check if already initialized (prevent double-init in hot-reload scenarios)
    if (adminModule.apps.length > 0) {
      admin = adminModule;
      return admin;
    }

    // Two initialization strategies:
    // 1. If FIREBASE_SERVICE_ACCOUNT env var exists → use service account JSON
    // 2. Otherwise → use Application Default Credentials (ADC) for Cloud Run
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountEnv) {
      // Strategy 1: Service account JSON from environment variable
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountEnv);
      } catch (parseError) {
        const error = new Error('Firebase service account is not valid JSON');
        error.code = 'FIREBASE_INVALID_JSON';
        error.originalError = parseError.message;
        initializationError = error;
        throw error;
      }

      // Validate service account has required fields
      const requiredFields = ['project_id', 'client_email', 'private_key'];
      const missingFields = requiredFields.filter(field => !serviceAccount[field]);

      if (missingFields.length > 0) {
        const error = new Error(`Firebase service account is missing required fields: ${missingFields.join(', ')}`);
        error.code = 'FIREBASE_INVALID_SERVICE_ACCOUNT';
        error.missingFields = missingFields;
        initializationError = error;
        throw error;
      }

      // Initialize Firebase Admin with service account
      adminModule.initializeApp({
        credential: adminModule.credential.cert(serviceAccount),
      });

      logger.info('Firebase Admin SDK initialized with service account JSON', {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
      });
    } else {
      // Strategy 2: Application Default Credentials (Cloud Run / GCE metadata)
      // Cloud Run automatically provides credentials via the metadata server
      adminModule.initializeApp({
        credential: adminModule.credential.applicationDefault(),
      });

      logger.info('Firebase Admin SDK initialized with Application Default Credentials');
    }

    admin = adminModule;
    return admin;
  } catch (error) {
    // Don't override already-set specific errors
    if (!error.code) {
      const wrappedError = new Error(`Firebase initialization failed: ${error.message}`);
      wrappedError.code = 'FIREBASE_INIT_FAILED';
      wrappedError.originalError = error.message;
      initializationError = wrappedError;
      throw wrappedError;
    }
    throw error;
  }
}

/**
 * Verify a Firebase ID token with proper error handling
 * @param {string} idToken - The Firebase ID token to verify
 * @returns {object} Decoded token claims
 */
async function verifyFirebaseToken(idToken) {
  try {
    const firebaseAdmin = await getFirebaseAdmin();
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      const tokenError = new Error('Firebase ID token has expired');
      tokenError.code = 'FIREBASE_TOKEN_EXPIRED';
      throw tokenError;
    }

    if (error.code === 'auth/invalid-id-token') {
      const tokenError = new Error('Firebase ID token is invalid');
      tokenError.code = 'FIREBASE_TOKEN_INVALID';
      throw tokenError;
    }

    // Re-throw configuration errors as-is
    if (error.code && error.code.startsWith('FIREBASE_')) {
      throw error;
    }

    const verifyError = new Error(`Token verification failed: ${error.message}`);
    verifyError.code = 'FIREBASE_TOKEN_VERIFY_FAILED';
    throw verifyError;
  }
}

/**
 * Create or update a user from Firebase OAuth data
 * @param {object} decodedToken - Verified Firebase decoded token
 * @returns {object} Database user record
 */
async function upsertFirebaseUser(decodedToken) {
  const { uid, email, name, picture } = decodedToken;
  const provider = decodedToken.firebase?.sign_in_provider || 'unknown';

  // Step 1: Check if user already exists by email
  const existingUser = await db.query(
    'SELECT id, email, full_name, plan_tier, email_verified FROM users WHERE email = $1',
    [email?.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    // User exists — update OAuth fields and login timestamp
    try {
      const updated = await db.query(
        `UPDATE users SET
           full_name = COALESCE($2, full_name),
           avatar_url = COALESCE($3, avatar_url),
           oauth_provider = $4,
           oauth_uid = $5,
           last_login = NOW(),
           email_verified = true
         WHERE email = $1
         RETURNING id, email, full_name, plan_tier, avatar_url, email_verified, created_at`,
        [email?.toLowerCase(), name || null, picture || null, provider, uid]
      );
      return updated.rows[0];
    } catch (updateErr) {
      // If OAuth columns don't exist yet (migration not run), just update what we can
      if (updateErr.code === '42703') { // undefined_column
        logger.warn('OAuth columns not yet migrated, updating basic fields only');
        const updated = await db.query(
          `UPDATE users SET
             full_name = COALESCE($2, full_name),
             email_verified = true
           WHERE email = $1
           RETURNING id, email, full_name, plan_tier, email_verified, created_at`,
          [email?.toLowerCase(), name || null]
        );
        return updated.rows[0];
      }
      throw updateErr;
    }
  }

  // Step 2: New user — create via OAuth
  try {
    const result = await db.query(
      `INSERT INTO users (email, full_name, avatar_url, oauth_provider, oauth_uid, plan_tier, email_verified)
       VALUES ($1, $2, $3, $4, $5, 'free', true)
       RETURNING id, email, full_name, plan_tier, avatar_url, email_verified, created_at`,
      [email?.toLowerCase(), name || null, picture || null, provider, uid]
    );
    const user = result.rows[0];

    // Ensure user has credits (trigger should handle this, but as safety net)
    const creditCheck = await db.query(
      'SELECT user_id FROM credits WHERE user_id = $1',
      [user.id]
    );
    if (creditCheck.rows.length === 0) {
      await db.query(
        'INSERT INTO credits (user_id, balance, total_purchased, total_used) VALUES ($1, 50, 50, 0)',
        [user.id]
      );
      logger.info('Created initial credits for OAuth user', { userId: user.id });
    }

    return user;
  } catch (insertErr) {
    // If OAuth columns don't exist yet (migration not run), create with basic fields
    if (insertErr.code === '42703') { // undefined_column
      logger.warn('OAuth columns not yet migrated, creating user with basic fields only');
      const result = await db.query(
        `INSERT INTO users (email, full_name, plan_tier, email_verified, password_hash)
         VALUES ($1, $2, 'free', true, '')
         RETURNING id, email, full_name, plan_tier, email_verified, created_at`,
        [email?.toLowerCase(), name || null]
      );
      const user = result.rows[0];

      const creditCheck = await db.query(
        'SELECT user_id FROM credits WHERE user_id = $1',
        [user.id]
      );
      if (creditCheck.rows.length === 0) {
        await db.query(
          'INSERT INTO credits (user_id, balance, total_purchased, total_used) VALUES ($1, 50, 50, 0)',
          [user.id]
        );
      }

      return user;
    }

    // If password_hash NOT NULL constraint fails, provide helpful message
    if (insertErr.code === '23502') { // not_null_violation
      logger.error('Cannot create OAuth user: password_hash is NOT NULL. Run migration 001_add_oauth_support.sql first.');
      throw new Error('Database schema not updated for OAuth. Run migration first.');
    }

    throw insertErr;
  }
}

/**
 * Register Firebase exchange routes on the given router
 * @param {express.Router} router - Express router to register routes on
 */
function register(router) {
  /**
   * POST /auth/firebase-exchange
   * Exchange a Firebase ID token for a backend JWT
   */
  router.post('/firebase-exchange', async (req, res) => {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          error: 'Missing required field',
          message: 'idToken is required',
        });
      }

      // Verify the Firebase ID token
      let decodedToken;
      try {
        decodedToken = await verifyFirebaseToken(idToken);
      } catch (verifyError) {
        logger.error('Firebase token verification failed', {
          code: verifyError.code,
          message: verifyError.message,
        });

        const errorResponses = {
          FIREBASE_NOT_CONFIGURED: {
            status: 503,
            message: 'Firebase authentication is not configured on the server',
          },
          FIREBASE_INVALID_JSON: {
            status: 503,
            message: 'Firebase service account configuration is invalid',
          },
          FIREBASE_INVALID_SERVICE_ACCOUNT: {
            status: 503,
            message: 'Firebase service account is missing required fields',
          },
          FIREBASE_INIT_FAILED: {
            status: 503,
            message: 'Firebase initialization failed',
          },
          FIREBASE_TOKEN_EXPIRED: {
            status: 401,
            message: 'Your session has expired. Please sign in again.',
          },
          FIREBASE_TOKEN_INVALID: {
            status: 401,
            message: 'Invalid authentication token. Please sign in again.',
          },
          FIREBASE_TOKEN_VERIFY_FAILED: {
            status: 401,
            message: 'Token verification failed. Please try again.',
          },
        };

        const errorInfo = errorResponses[verifyError.code] || {
          status: 500,
          message: 'Authentication failed',
        };

        return res.status(errorInfo.status).json({
          error: 'Authentication Error',
          message: errorInfo.message,
          code: verifyError.code,
        });
      }

      const { uid, email, name, picture } = decodedToken;
      const provider = decodedToken.firebase?.sign_in_provider || 'unknown';

      logger.info('Firebase token verified', { uid, email, provider });

      // Create or update user in database
      const user = await upsertFirebaseUser(decodedToken);

      // Generate backend JWT with DATABASE user ID (not Firebase uid)
      const JWT_SECRET = process.env.JWT_SECRET;

      if (!JWT_SECRET) {
        logger.error('JWT_SECRET not configured');
        return res.status(500).json({
          error: 'Server Configuration Error',
          message: 'JWT secret is not configured',
        });
      }

      const backendToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      logger.info('OAuth user authenticated', {
        userId: user.id,
        email: user.email,
        provider,
      });

      return res.json({
        message: 'Authentication successful',
        token: backendToken,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          plan_tier: user.plan_tier,
          email_verified: user.email_verified,
          provider,
        },
      });
    } catch (error) {
      logger.error('Firebase exchange error', { error: error.message });
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during authentication',
      });
    }
  });

  /**
   * GET /auth/firebase-status
   * Check if Firebase Admin SDK is configured (for diagnostics)
   */
  router.get('/firebase-status', async (req, res) => {
    try {
      const firebaseAdmin = await getFirebaseAdmin();

      const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountEnv);
      } catch {
        serviceAccount = {};
      }

      return res.json({
        status: 'configured',
        project_id: serviceAccount.project_id || 'unknown',
        client_email: serviceAccount.client_email || 'unknown',
        message: 'Firebase credentials are valid',
      });
    } catch (error) {
      return res.json({
        status: 'not_configured',
        code: error.code,
        message: error.message,
      });
    }
  });
}

module.exports = { register, getFirebaseAdmin, verifyFirebaseToken };