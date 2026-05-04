const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { paymentRateLimiter } = require('../middleware/rateLimit');
const db = require('../utils/db');
const logger = require('../utils/logger');
const paymentService = require('../services/payment');
const axios = require('axios');
const Stripe = require('stripe');
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const NP_BASE = process.env.SANDBOX_MODE === 'true'
  ? 'https://sandbox.nowpayments.io/v1'
  : 'https://api.nowpayments.io/v1';
const NP_API_KEY = process.env.NOWPAYMENTS_API_KEY;

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
             SET status = 'completed', completed_at = NOW(), gateway_transaction_id = $2
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
            "UPDATE transactions SET status = 'completed', completed_at = NOW(), gateway_transaction_id = $2 WHERE id = $1",
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

/**
 * POST /payment/stripe/create-session
 * Create a Stripe Checkout session
 */
router.post('/stripe/create-session', verifyJWT, paymentRateLimiter, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    const { package_id } = req.body;

    const packages = {
      micro: { price_usd: 199, credits: 1000, name: 'Micro' },
      small: { price_usd: 499, credits: 3000, name: 'Small' },
      medium: { price_usd: 999, credits: 7000, name: 'Medium' },
      large: { price_usd: 1999, credits: 18000, name: 'Large' },
      xl: { price_usd: 4999, credits: 50000, name: 'XL' }
    };

    if (!packages[package_id]) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    const pkg = packages[package_id];

    const txResult = await db.query(
      `INSERT INTO transactions (user_id, amount_bdt, credits_added, payment_method, payment_gateway, status)
       VALUES ($1, $2, $3, 'card', 'stripe', 'pending')
       RETURNING id`,
      [req.user.id, pkg.price_usd, pkg.credits]
    );

    const transactionId = txResult.rows[0].id;
    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3001';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.user.email,
      metadata: {
        transaction_id: transactionId,
        user_id: req.user.id,
        package_id,
        credits: pkg.credits.toString()
      },
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: pkg.price_usd,
          product_data: {
            name: `ReadyPI Credits — ${pkg.name} Pack`,
            description: `${pkg.credits.toLocaleString()} credits`
          }
        },
        quantity: 1
      }],
      success_url: `${dashboardUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${dashboardUrl}/billing?payment=cancelled`
    });

    logger.info('Stripe checkout session created', {
      userId: req.user.id,
      transactionId,
      sessionId: session.id,
      package: package_id
    });

    res.json({
      transaction_id: transactionId,
      checkout_url: session.url,
      session_id: session.id
    });

  } catch (error) {
    logger.error('Stripe create session error:', error);
    res.status(500).json({ error: 'Failed to create Stripe checkout session' });
  }
});

/**
 * POST /payment/stripe/webhook
 * Stripe webhook handler — credits added only on confirmed payment
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).send('Stripe not configured');
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET not set');
      return res.status(500).send('Webhook secret not configured');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      logger.warn('Stripe webhook signature verification failed', { error: err.message });
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { transaction_id, user_id, credits } = session.metadata;

      if (!transaction_id || !user_id || !credits) {
        logger.warn('Stripe webhook missing metadata', { sessionId: session.id });
        return res.status(400).send('Missing metadata');
      }

      const creditsToAdd = parseInt(credits);

      const client = await db.getClient();
      try {
        await client.query('BEGIN');

        const txCheck = await client.query(
          'SELECT status FROM transactions WHERE id = $1',
          [transaction_id]
        );

        if (txCheck.rows.length > 0 && txCheck.rows[0].status === 'pending') {
          await client.query(
            `UPDATE transactions
             SET status = 'completed', completed_at = NOW(), gateway_transaction_id = $2
             WHERE id = $1`,
            [transaction_id, session.payment_intent]
          );

          await client.query(
            `UPDATE credits
             SET balance = balance + $2, total_purchased = total_purchased + $2
             WHERE user_id = $1`,
            [user_id, creditsToAdd]
          );

          await client.query('COMMIT');
          logger.info('Stripe payment completed, credits added', {
            userId: user_id,
            transactionId: transaction_id,
            credits: creditsToAdd
          });
        } else {
          await client.query('ROLLBACK');
          logger.info('Stripe webhook: transaction already processed or not found', { transaction_id });
        }
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    res.status(200).json({ received: true });

  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(500).send('Webhook handler error');
  }
});

/**
 * POST /payment/crypto/create
 * Create a NOWPayments USDT BSC payment
 */
router.post('/crypto/create', verifyJWT, paymentRateLimiter, async (req, res) => {
  try {
    if (!NP_API_KEY) {
      return res.status(503).json({ error: 'Crypto payments are not configured' });
    }

    const { package_id } = req.body;

    const packages = {
      micro: { price_usd: 1.73, credits: 1000, name: 'Micro' },
      small: { price_usd: 4.34, credits: 3000, name: 'Small' },
      medium: { price_usd: 8.69, credits: 7000, name: 'Medium' },
      large: { price_usd: 17.38, credits: 18000, name: 'Large' },
      xl: { price_usd: 43.47, credits: 50000, name: 'XL' }
    };

    if (!packages[package_id]) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    const pkg = packages[package_id];

    const txResult = await db.query(
      `INSERT INTO transactions (user_id, amount_bdt, amount_usd, credits_added, payment_method, payment_gateway, status)
       VALUES ($1, $2, $3, $4, 'usdt', 'nowpayments', 'pending')
       RETURNING id`,
      [req.user.id, (pkg.price_usd * 115).toFixed(2), pkg.price_usd, pkg.credits]
    );

    const transactionId = txResult.rows[0].id;

    const npResponse = await axios.post(`${NP_BASE}/payment`, {
      price_amount: pkg.price_usd,
      price_currency: 'usd',
      pay_currency: 'usdtbsc',
      order_id: transactionId,
      order_description: `ReadyPI Credits — ${pkg.name} Pack (${pkg.credits} credits)`,
      ipn_callback_url: `${process.env.API_BASE_URL}/payment/callback/nowpayments/ipn`,
      success_url: `${process.env.DASHBOARD_URL || 'http://localhost:3001'}/dashboard?payment=success`,
      cancel_url: `${process.env.DASHBOARD_URL || 'http://localhost:3001'}/billing?payment=cancelled`
    }, {
      headers: {
        'x-api-key': NP_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const npData = npResponse.data;

    await db.query(
      `UPDATE transactions SET gateway_transaction_id = $2 WHERE id = $1`,
      [transactionId, npData.payment_id?.toString()]
    );

    logger.info('NOWPayments crypto payment created', {
      userId: req.user.id,
      transactionId,
      paymentId: npData.payment_id,
      package: package_id,
      payCurrency: 'usdtbsc'
    });

    res.json({
      transaction_id: transactionId,
      payment_id: npData.payment_id,
      pay_address: npData.pay_address,
      pay_amount: npData.pay_amount,
      pay_currency: npData.pay_currency,
      price_amount: npData.price_amount,
      price_currency: npData.price_currency,
      payment_status: npData.payment_status,
      credits: pkg.credits
    });

  } catch (error) {
    logger.error('NOWPayments create error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to create crypto payment',
      message: error.response?.data?.message || error.message
    });
  }
});

/**
 * GET /payment/crypto/:id
 * Check NOWPayments payment status
 */
router.get('/crypto/:id', verifyJWT, async (req, res) => {
  try {
    if (!NP_API_KEY) {
      return res.status(503).json({ error: 'Crypto payments are not configured' });
    }

    const paymentId = req.params.id;

    const npResponse = await axios.get(`${NP_BASE}/payment/${paymentId}`, {
      headers: { 'x-api-key': NP_API_KEY }
    });

    const npData = npResponse.data;

    res.json({
      payment_id: npData.payment_id,
      payment_status: npData.payment_status,
      pay_address: npData.pay_address,
      pay_amount: npData.pay_amount,
      actually_paid: npData.actually_paid,
      pay_currency: npData.pay_currency,
      price_amount: npData.price_amount,
      price_currency: npData.price_currency,
      order_id: npData.order_id,
      created_at: npData.created_at,
      updated_at: npData.updated_at
    });

  } catch (error) {
    logger.error('NOWPayments status check error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to check payment status',
      message: error.response?.data?.message || error.message
    });
  }
});

/**
 * GET /payment/bdt/info
 * Return payment numbers for manual BDT transfer
 */
router.get('/bdt/info', (req, res) => {
  res.json({
    methods: {
      bkash: [
        process.env.BKASH_NUMBER,
        process.env.BKASH_NUMBER_2
      ].filter(Boolean),
      nagad: [process.env.NAGAD_NUMBER].filter(Boolean),
      rocket: [process.env.ROCKET_NUMBER].filter(Boolean),
      upay: [process.env.UPAY_NUMBER].filter(Boolean)
    },
    instructions: 'Send the exact amount to one of the numbers above. Then submit your transaction ID using POST /payment/bdt/submit.'
  });
});

/**
 * POST /payment/bdt/submit
 * User submits a manual BDT payment for admin verification
 */
router.post('/bdt/submit', verifyJWT, paymentRateLimiter, async (req, res) => {
  try {
    const { amount_bdt, transaction_id, method, phone } = req.body;

    const validMethods = ['bkash', 'nagad', 'rocket', 'upay'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        error: 'Invalid method',
        message: `Must be one of: ${validMethods.join(', ')}`
      });
    }

    if (!amount_bdt || !transaction_id || !phone) {
      return res.status(400).json({
        error: 'Missing fields',
        message: 'amount_bdt, transaction_id, method, and phone are required'
      });
    }

    const parsedAmount = parseFloat(amount_bdt);
    if (isNaN(parsedAmount) || parsedAmount < 50) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Minimum top-up is 50 BDT'
      });
    }

    const credits = Math.floor(parsedAmount);

    const existing = await db.query(
      "SELECT id FROM transactions WHERE gateway_transaction_id = $1 AND payment_gateway = 'manual_bdt'",
      [transaction_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Duplicate transaction',
        message: 'This transaction ID has already been submitted'
      });
    }

    const result = await db.query(
      `INSERT INTO transactions
       (user_id, amount_bdt, credits_added, payment_method, payment_gateway, gateway_transaction_id, status, metadata)
       VALUES ($1, $2, $3, $4, 'manual_bdt', $5, 'pending_verification', $6)
       RETURNING id`,
      [
        req.user.id,
        parsedAmount,
        credits,
        method,
        transaction_id,
        JSON.stringify({ phone, submitted_at: new Date().toISOString() })
      ]
    );

    logger.info('Manual BDT payment submitted', {
      userId: req.user.id,
      txId: result.rows[0].id,
      method,
      amount: parsedAmount,
      senderPhone: phone,
      gatewayTxId: transaction_id
    });

    res.status(201).json({
      message: 'Payment submitted for verification. Credits will be added after admin approval.',
      id: result.rows[0].id,
      amount_bdt: parsedAmount,
      credits_pending: credits,
      status: 'pending_verification'
    });

  } catch (error) {
    logger.error('BDT submit error:', error);
    res.status(500).json({ error: 'Failed to submit payment' });
  }
});

/**
 * GET /payment/bdt/pending
 * Admin: list all pending manual BDT payments
 */
router.get('/bdt/pending', verifyJWT, async (req, res) => {
  try {
    if (req.user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await db.query(
      `SELECT t.id, t.user_id, u.email, t.amount_bdt, t.credits_added,
              t.payment_method, t.gateway_transaction_id, t.metadata, t.created_at
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.status = 'pending_verification' AND t.payment_gateway = 'manual_bdt'
       ORDER BY t.created_at ASC`
    );

    res.json({ pending: result.rows });

  } catch (error) {
    logger.error('BDT pending list error:', error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
});

/**
 * POST /payment/bdt/verify
 * Admin: approve a pending manual BDT payment → credits added
 */
router.post('/bdt/verify', verifyJWT, async (req, res) => {
  try {
    if (req.user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { transaction_id, action } = req.body;

    if (!transaction_id || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'transaction_id and action (approve|reject) are required'
      });
    }

    const txCheck = await db.query(
      "SELECT id, user_id, credits_added, status FROM transactions WHERE id = $1 AND payment_gateway = 'manual_bdt'",
      [transaction_id]
    );

    if (txCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = txCheck.rows[0];

    if (tx.status !== 'pending_verification') {
      return res.status(400).json({
        error: 'Invalid state',
        message: `Transaction is already ${tx.status}`
      });
    }

    if (action === 'reject') {
      await db.query(
        "UPDATE transactions SET status = 'failed', completed_at = NOW() WHERE id = $1",
        [transaction_id]
      );

      logger.info('Manual BDT payment rejected', { txId: transaction_id, admin: req.user.email });
      return res.json({ message: 'Payment rejected', transaction_id });
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      await client.query(
        "UPDATE transactions SET status = 'completed', completed_at = NOW() WHERE id = $1",
        [transaction_id]
      );

      await client.query(
        "UPDATE credits SET balance = balance + $2, total_purchased = total_purchased + $2 WHERE user_id = $1",
        [tx.user_id, tx.credits_added]
      );

      await client.query('COMMIT');

      logger.info('Manual BDT payment approved, credits added', {
        txId: transaction_id,
        userId: tx.user_id,
        credits: tx.credits_added,
        admin: req.user.email
      });

      res.json({
        message: 'Payment approved. Credits added.',
        transaction_id,
        credits_added: tx.credits_added
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('BDT verify error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

module.exports = router;

