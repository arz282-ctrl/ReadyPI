const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { generateAPIKey, hashAPIKey } = require('../middleware/auth');
const db = require('../utils/db');
const logger = require('../utils/logger');

/**
 * GET /keys
 * List all API keys for current user
 */
router.get('/', verifyJWT, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, key_prefix, name, environment, created_at, last_used_at, is_active, rate_limit_per_minute
       FROM api_keys
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      keys: result.rows.map(key => ({
        id: key.id,
        key_prefix: key.key_prefix,
        name: key.name,
        environment: key.environment,
        created_at: key.created_at,
        last_used_at: key.last_used_at,
        is_active: key.is_active,
        rate_limit: key.rate_limit_per_minute
      }))
    });

  } catch (error) {
    logger.error('List API keys error:', error);
    res.status(500).json({
      error: 'Failed to fetch API keys'
    });
  }
});

/**
 * POST /keys
 * Generate new API key
 */
router.post('/', verifyJWT, async (req, res) => {
  try {
    const { name, environment = 'live' } = req.body;

    // Validate environment
    if (!['live', 'test'].includes(environment)) {
      return res.status(400).json({
        error: 'Invalid environment',
        message: 'Environment must be either "live" or "test"'
      });
    }

    // Check key limit (max 10 keys per user)
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM api_keys WHERE user_id = $1 AND is_active = true',
      [req.user.id]
    );

    if (parseInt(countResult.rows[0].count) >= 10) {
      return res.status(400).json({
        error: 'Key limit reached',
        message: 'Maximum 10 active API keys allowed per account'
      });
    }

    // Get user's plan tier for rate limit
    const userResult = await db.query(
      'SELECT plan_tier FROM users WHERE id = $1',
      [req.user.id]
    );

    const planTier = userResult.rows[0].plan_tier;

    // Set rate limit based on plan
    const rateLimits = {
      free: 10,
      starter: 60,
      pro: 200,
      team: 1000,
      enterprise: 10000
    };

    const rateLimit = rateLimits[planTier] || 10;

    // Generate new API key
    const apiKey = generateAPIKey(environment);
    const keyHash = await hashAPIKey(apiKey);
    const keyPrefix = apiKey.substring(0, 16);

    // Insert into database
    const result = await db.query(
      `INSERT INTO api_keys (user_id, key_hash, key_prefix, name, environment, rate_limit_per_minute)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, key_prefix, name, environment, created_at, rate_limit_per_minute`,
      [req.user.id, keyHash, keyPrefix, name || `${environment} key`, environment, rateLimit]
    );

    const keyData = result.rows[0];

    logger.info('API key created', {
      userId: req.user.id,
      keyId: keyData.id,
      environment
    });

    res.status(201).json({
      message: 'API key created successfully',
      key: apiKey, // Only shown once!
      key_data: {
        id: keyData.id,
        key_prefix: keyData.key_prefix,
        name: keyData.name,
        environment: keyData.environment,
        created_at: keyData.created_at,
        rate_limit: keyData.rate_limit_per_minute
      },
      warning: 'Save this key now. You will not be able to see it again.'
    });

  } catch (error) {
    logger.error('Create API key error:', error);
    res.status(500).json({
      error: 'Failed to create API key'
    });
  }
});

/**
 * DELETE /keys/:keyId
 * Deactivate an API key
 */
router.delete('/:keyId', verifyJWT, async (req, res) => {
  try {
    const { keyId } = req.params;

    // Verify key belongs to user
    const result = await db.query(
      'UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING id',
      [keyId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'API key not found',
        message: 'Key does not exist or does not belong to you'
      });
    }

    logger.info('API key deactivated', {
      userId: req.user.id,
      keyId
    });

    res.json({
      message: 'API key deactivated successfully',
      key_id: keyId
    });

  } catch (error) {
    logger.error('Delete API key error:', error);
    res.status(500).json({
      error: 'Failed to deactivate API key'
    });
  }
});

/**
 * PATCH /keys/:keyId
 * Update API key name
 */
router.patch('/:keyId', verifyJWT, async (req, res) => {
  try {
    const { keyId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Missing name',
        message: 'Name is required'
      });
    }

    const result = await db.query(
      'UPDATE api_keys SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id, name',
      [name, keyId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'API key not found'
      });
    }

    res.json({
      message: 'API key updated successfully',
      key: result.rows[0]
    });

  } catch (error) {
    logger.error('Update API key error:', error);
    res.status(500).json({
      error: 'Failed to update API key'
    });
  }
});

module.exports = router;
