/**
 * POST /auth/firebase-exchange
 *
 * Accepts a Firebase ID token, verifies it via Firebase Admin SDK,
 * upserts the user in our Postgres users table, and returns a ReadyPI JWT.
 *
 * This bridges Firebase Auth (frontend identity provider) with our
 * existing bcrypt/JWT/Postgres auth system.
 *
 * Request body: { id_token: string }
 * Response: { message, user, token }
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const logger = require('../utils/logger');

let admin;
try {
  admin = require('firebase-admin');
  if (!admin.apps.length) {
    // Only projectId is needed for verifyIdToken() — it uses Google's public keys
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'readypi-core',
    });
  }
} catch (err) {
  logger.warn('Firebase Admin SDK not available. Firebase OAuth exchange disabled.', err.message);
}

/**
 * Verify a Firebase ID token and return the decoded claims.
 */
async function verifyFirebaseToken(idToken) {
  if (!admin) {
    throw new Error('Firebase Admin SDK is not initialized');
  }
  return admin.auth().verifyIdToken(idToken);
}

/**
 * Upsert a user from Firebase claims into our Postgres users table.
 * If the user already exists (matched by email), return the existing record.
 * If new, create the user with a random password hash (they auth via Firebase).
 */
async function upsertFirebaseUser(decodedToken) {
  const email = decodedToken.email;
  const fullName = decodedToken.name || decodedToken.displayName || null;
  const firebaseUid = decodedToken.uid;
  const emailVerified = decodedToken.email_verified || false;

  if (!email) {
    throw new Error('Firebase token does not contain an email address');
  }

  // Check if user already exists
  const existingResult = await db.query(
    `SELECT u.id, u.email, u.full_name, u.plan_tier, u.is_active, c.balance as credit_balance
     FROM users u
     LEFT JOIN credits c ON u.id = c.user_id
     WHERE u.email = $1`,
    [email.toLowerCase()]
  );

  if (existingResult.rows.length > 0) {
    const user = existingResult.rows[0];

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Update firebase_uid and email_verified if not already set
    await db.query(
      `UPDATE users SET
        email_verified = COALESCE($1, email_verified),
        full_name = COALESCE(NULLIF($2, ''), full_name),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [emailVerified, fullName, user.id]
    );

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name || fullName,
      plan_tier: user.plan_tier,
      credit_balance: parseInt(user.credit_balance) || 0,
    };
  }

  // New user — create with a placeholder password hash
  // (Firebase-authenticated users don't use our password system)
  const bcrypt = require('bcrypt');
  const placeholderHash = await bcrypt.hash(
    `firebase_oauth_${firebaseUid}_${Date.now()}`,
    12
  );

  const insertResult = await db.query(
    `INSERT INTO users (email, password_hash, full_name, plan_tier, email_verified)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET
       full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), users.full_name),
       email_verified = GREATEST(EXCLUDED.email_verified, users.email_verified),
       updated_at = CURRENT_TIMESTAMP
     RETURNING id, email, full_name, plan_tier, created_at`,
    [email.toLowerCase(), placeholderHash, fullName, 'free', emailVerified]
  );

  const newUser = insertResult.rows[0];

  logger.info('New Firebase OAuth user created', {
    userId: newUser.id,
    email: newUser.email,
    provider: decodedToken.firebase?.sign_in_provider || 'unknown',
  });

  return {
    id: newUser.id,
    email: newUser.email,
    full_name: newUser.full_name,
    plan_tier: newUser.plan_tier,
    credit_balance: 50, // Trigger auto-creates 50 credits
  };
}

/**
 * Register the firebase-exchange route on the auth router.
 * Call this from routes/auth.js:
 *   require('./firebase-exchange').register(router);
 */
function register(router) {
  router.post('/firebase-exchange', async (req, res) => {
    try {
      const { id_token } = req.body;

      if (!id_token) {
        return res.status(400).json({
          error: 'Missing id_token',
          message: 'Firebase ID token is required',
        });
      }

      // Verify the Firebase token
      const decodedToken = await verifyFirebaseToken(id_token);

      // Upsert user in Postgres
      const user = await upsertFirebaseUser(decodedToken);

      // Generate our own JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      logger.info('Firebase token exchanged successfully', {
        userId: user.id,
        email: user.email,
        provider: decodedToken.firebase?.sign_in_provider || 'unknown',
      });

      res.json({
        message: 'Authentication successful',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          plan_tier: user.plan_tier,
          credit_balance: user.credit_balance,
        },
        token,
      });
    } catch (error) {
      logger.error('Firebase exchange error:', {
        error: error.message,
        code: error.code,
      });

      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Firebase token has expired. Please sign in again.',
        });
      }

      if (error.code === 'auth/argument-error' || error.code === 'auth/id-token-revoked') {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'Firebase token is invalid or has been revoked.',
        });
      }

      res.status(500).json({
        error: 'Authentication failed',
        message: error.message || 'An error occurred during Firebase authentication',
      });
    }
  });
}

module.exports = { register, verifyFirebaseToken, upsertFirebaseUser };
