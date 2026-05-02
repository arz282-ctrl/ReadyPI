const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { paymentRateLimiter } = require('../middleware/rateLimit');
const db = require('../utils/db');
const logger = require('../utils/logger');
const paymentService = require('../services/payment');

/**
 * POST /payment/create
 * Initiate payment (SSLCommerz)
 */
router.post('/create', verifyJWT, paymentRateLimiter, async (req, res) => {
  try {
    const { package_id, payment_method } = req.body;

    // Validate payment method
    const validMethods = ['bkash', 'nagad', 'rocket', 'card', 'usdt', 'btc'];
    if (!validMethods.includes(payment_method)) {
      return res.status(400).json({
        error: 'Invalid payment method',
        message: `Payment method must be one of: ${validMethods.join(', ')}`
      });
    }

    // Get package details
    const packages = {
      micro: { price_bdt: 199, credits: 1000 },
      small: { price_bdt: 499, credits: 3000 },
      medium: { price_bdt: 999, credits: 7000 },
      large: { price_bdt: 1999, credits: 18000 },
      xl: { price_bdt: 4999, credits: 50000 }
    };

    if (!packages[package_id]) {
      return res.status(400).json({
        error: 'Invalid package',
        message: 'Package not found'
      });
    }

    const pkg = packages[package_id];

    // Create pending transaction
    const txResult = await db.query(
      `INSERT INTO transactions (user_id, amount_bdt, credits_added, payment_method, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id`,
      [req.user.id, pkg.price_bdt, pkg.credits, payment_method]
    );

    const transactionId = txResult.rows[0].id;
    const isInternational = ['usdt', 'btc'].includes(payment_method);

    // Initialize Payment Gateway
    let paymentData;
    if (isInternational) {
      paymentData = await paymentService.initNOWPayments({
        transactionId,
        totalAmount: pkg.price_bdt,
        customerEmail: req.user.email
      });
    } else {
      paymentData = await paymentService.initSSLCommerz({
        transactionId,
        totalAmount: pkg.price_bdt,
        customerName: req.user.full_name,
        customerEmail: req.user.email
      });
    }

    logger.info('Payment initiated with SSLCommerz', {
      userId: req.user.id,
      transactionId,
      package: package_id,
      amount: pkg.price_bdt,
      method: payment_method
    });

    res.json({
      transaction_id: transactionId,
      payment_url: paymentData.gatewayUrl,
      amount_bdt: pkg.price_bdt,
      credits: pkg.credits,
      payment_method
    });

  } catch (error) {
    logger.error('Create payment error:', error);
    res.status(500).json({
      error: 'Failed to create payment',
      message: error.message
    });
  }
});

/**
 * POST /payment/callback/sslcommerz/success
 * SSLCommerz success callback
 */
router.post('/callback/sslcommerz/success', async (req, res) => {
  try {
    const { val_id, tran_id } = req.body;

    logger.info('SSLCommerz success callback received', { val_id, tran_id });

    // Validate payment
    const validation = await paymentService.validateSSLCommerz(val_id);

    if (validation) {
      // Begin transaction to ensure consistency
      const client = await db.getClient();
      try {
        await client.query('BEGIN');

        // Check if transaction is already completed
        const txCheck = await client.query(
          'SELECT status, user_id, credits_added FROM transactions WHERE id = $1',
          [tran_id]
        );

        if (txCheck.rows.length > 0 && txCheck.rows[0].status === 'pending') {
          const { user_id, credits_added } = txCheck.rows[0];

          // 1. Update transaction status
          await client.query(
            `UPDATE transactions 
             SET status = 'completed', completed_at = NOW(), pg_txid = $2
             WHERE id = $1`,
            [tran_id, val_id]
          );

          // 2. Add credits to user
          await client.query(
            `UPDATE credits 
             SET balance = balance + $2, total_purchased = total_purchased + $2
             WHERE user_id = $1`,
            [user_id, credits_added]
          );

          await client.query('COMMIT');
          logger.info('Credits added to user after successful payment', { userId: user_id, credits: credits_added });
        } else {
          await client.query('ROLLBACK');
        }
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // Redirect user back to dashboard
    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3001';
    res.redirect(`${dashboardUrl}/dashboard?payment=success`);

  } catch (error) {
    logger.error('SSLCommerz success processing failed:', error);
    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3001';
    res.redirect(`${dashboardUrl}/billing?error=payment_verification_failed`);
  }
});

/**
 * POST /payment/callback/sslcommerz/fail
 * SSLCommerz failure callback
 */
router.post('/callback/sslcommerz/fail', async (req, res) => {
  const { tran_id } = req.body;
  logger.warn('Payment failed', { tran_id });
  
  await db.query("UPDATE transactions SET status = 'failed' WHERE id = $1", [tran_id]);
  
  const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3001';
  res.redirect(`${dashboardUrl}/billing?error=payment_failed`);
});

/**
 * POST /payment/callback/nowpayments/ipn
 * NOWPayments IPN handler
 */
router.post('/callback/nowpayments/ipn', async (req, res) => {
  try {
    const { payment_status, order_id, payment_id } = req.body;
    
    logger.info('NOWPayments IPN received', { payment_status, order_id, payment_id });

    if (payment_status === 'finished') {
      const client = await db.getClient();
      try {
        await client.query('BEGIN');

        const txCheck = await client.query(
          'SELECT status, user_id, credits_added FROM transactions WHERE id = $1',
          [order_id]
        );

        if (txCheck.rows.length > 0 && txCheck.rows[0].status === 'pending') {
          const { user_id, credits_added } = txCheck.rows[0];

          await client.query(
            "UPDATE transactions SET status = 'completed', completed_at = NOW(), pg_txid = $2 WHERE id = $1",
            [order_id, payment_id]
          );

          await client.query(
            "UPDATE credits SET balance = balance + $2, total_purchased = total_purchased + $2 WHERE user_id = $1",
            [user_id, credits_added]
          );

          await client.query('COMMIT');
        } else {
          await client.query('ROLLBACK');
        }
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('NOWPayments IPN error:', error);
    res.status(500).send('Error');
  }
});

/**
 * GET /payment/history
 * Get payment transaction history
 */
router.get('/history', verifyJWT, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, amount_bdt, credits_added, payment_method, status, created_at, completed_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json({
      transactions: result.rows.map(tx => ({
        id: tx.id,
        amount_bdt: parseFloat(tx.amount_bdt),
        credits_added: parseInt(tx.credits_added),
        payment_method: tx.payment_method,
        status: tx.status,
        created_at: tx.created_at,
        completed_at: tx.completed_at
      }))
    });

  } catch (error) {
    logger.error('Get payment history error:', error);
    res.status(500).json({
      error: 'Failed to fetch payment history'
    });
  }
});

module.exports = router;

