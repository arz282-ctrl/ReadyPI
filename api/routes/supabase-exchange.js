const jwt = require('jsonwebtoken');
const axios = require('axios');
const db = require('../utils/db');
const logger = require('../utils/logger');

/**
 * Supabase Auth → ReadyPI JWT exchange
 *
 * Verifies a Supabase access token by calling Supabase's own /auth/v1/user
 * endpoint (no JWT secret needed on our side), upserts the user in Postgres,
 * and issues a ReadyPI backend JWT — mirroring the Firebase exchange flow.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://neijilifsxjlktjiweqg.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_fLxWGQDVw-a0wkRbojbWfw_KZEM1UAw';

/**
 * Verify a Supabase access token by asking Supabase who it belongs to.
 * @param {string} accessToken
 * @returns {object} Supabase user object
 */
async function verifySupabaseToken(accessToken) {
  try {
    const { data } = await axios.get(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
      timeout: 10000,
    });
    if (!data || !data.id) {
      const err = new Error('Supabase returned no user for this token');
      err.code = 'SUPABASE_TOKEN_INVALID';
      throw err;
    }
    return data;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const err = new Error('Supabase access token is invalid or expired');
      err.code = 'SUPABASE_TOKEN_INVALID';
      throw err;
    }
    if (error.code === 'SUPABASE_TOKEN_INVALID') throw error;
    const err = new Error(`Supabase verification failed: ${error.message}`);
    err.code = 'SUPABASE_VERIFY_FAILED';
    throw err;
  }
}

/**
 * Create or update a user from Supabase Auth data
 * @param {object} supaUser - Verified Supabase user object
 * @returns {object} Database user record
 */
async function upsertSupabaseUser(supaUser) {
  const uid = supaUser.id;
  const email = supaUser.email?.toLowerCase();
  const name =
    supaUser.user_metadata?.full_name ||
    supaUser.user_metadata?.name ||
    null;
  const picture =
    supaUser.user_metadata?.avatar_url ||
    supaUser.user_metadata?.picture ||
    null;
  const provider = supaUser.app_metadata?.provider || 'supabase';

  const existingUser = await db.query(
    'SELECT id, email, full_name, plan_tier, email_verified FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
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
      [email, name, picture, provider, uid]
    );
    return updated.rows[0];
  }

  const result = await db.query(
    `INSERT INTO users (email, full_name, avatar_url, oauth_provider, oauth_uid, plan_tier, email_verified)
     VALUES ($1, $2, $3, $4, $5, 'free', true)
     RETURNING id, email, full_name, plan_tier, avatar_url, email_verified, created_at`,
    [email, name, picture, provider, uid]
  );
  const user = result.rows[0];

  // Safety net: ensure credits row exists (DB trigger normally handles this)
  const creditCheck = await db.query('SELECT user_id FROM credits WHERE user_id = $1', [
    user.id,
  ]);
  if (creditCheck.rows.length === 0) {
    await db.query(
      'INSERT INTO credits (user_id, balance, total_purchased, total_used) VALUES ($1, 50, 50, 0)',
      [user.id]
    );
    logger.info('Created initial credits for Supabase user', { userId: user.id });
  }

  return user;
}

/**
 * Register Supabase exchange routes on the given router
 * @param {import('express').Router} router
 */
function register(router) {
  /**
   * POST /auth/supabase-exchange
   * Exchange a Supabase access token for a backend JWT
   */
  router.post('/supabase-exchange', async (req, res) => {
    try {
      const { access_token } = req.body;

      if (!access_token) {
        return res.status(400).json({
          error: 'Missing required field',
          message: 'access_token is required',
        });
      }

      let supaUser;
      try {
        supaUser = await verifySupabaseToken(access_token);
      } catch (verifyError) {
        logger.error('Supabase token verification failed', {
          code: verifyError.code,
          message: verifyError.message,
        });
        const status = verifyError.code === 'SUPABASE_TOKEN_INVALID' ? 401 : 503;
        return res.status(status).json({
          error: 'Authentication Error',
          message:
            status === 401
              ? 'Your session has expired. Please sign in again.'
              : 'Authentication service temporarily unavailable.',
          code: verifyError.code,
        });
      }

      logger.info('Supabase token verified', {
        uid: supaUser.id,
        email: supaUser.email,
        provider: supaUser.app_metadata?.provider,
      });

      const user = await upsertSupabaseUser(supaUser);

      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        logger.error('JWT_SECRET not configured');
        return res.status(500).json({
          error: 'Server Configuration Error',
          message: 'JWT secret is not configured',
        });
      }

      const backendToken = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      logger.info('Supabase user authenticated', {
        userId: user.id,
        email: user.email,
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
          provider: supaUser.app_metadata?.provider || 'supabase',
        },
      });
    } catch (error) {
      logger.error('Supabase exchange error', { error: error.message });
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during authentication',
      });
    }
  });
}

module.exports = { register, verifySupabaseToken };
