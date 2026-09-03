const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Payment Service — Razorpay, UPI & NOWPayments Integration (India AI Market)
 * 
 * Handles communication with Indian & international payment gateways.
 */
class PaymentService {
  constructor() {
    // Razorpay config (Primary for India Market)
    this.razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    this.razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    
    // SSLCommerz config (Legacy fallback)
    this.sslStoreId = process.env.SSLCOMMERZ_STORE_ID;
    this.sslStorePass = process.env.SSLCOMMERZ_STORE_PASSWORD;
    this.isLive = process.env.SSLCOMMERZ_IS_LIVE === 'true';
    this.sslBaseUrl = this.isLive 
      ? 'https://securepay.sslcommerz.com' 
      : 'https://sandbox.sslcommerz.com';
    
    // NOWPayments config
    this.npApiKey = process.env.NOWPAYMENTS_API_KEY;
    this.npIpnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
    this.npBaseUrl = process.env.NOWPAYMENTS_IS_SANDBOX === 'true'
      ? 'https://api-sandbox.nowpayments.io/v1'
      : 'https://api.nowpayments.io/v1';
  }

  /**
   * Create Razorpay Order (UPI / PhonePe / Paytm / GPay / NetBanking / Cards)
   */
  async createRazorpayOrder({ transactionId, totalAmountINR, customerName, customerEmail, customerPhone }) {
    try {
      // Amount in paise (1 INR = 100 paise)
      const amountPaise = Math.round(totalAmountINR * 100);

      if (!this.razorpayKeyId || !this.razorpayKeySecret) {
        logger.warn('Razorpay credentials missing. Generating simulated order response.');
        return {
          orderId: `order_sim_${Date.now()}`,
          amount: amountPaise,
          currency: 'INR',
          keyId: this.razorpayKeyId || 'rzp_test_simulated',
          isSimulated: true
        };
      }

      const auth = Buffer.from(`${this.razorpayKeyId}:${this.razorpayKeySecret}`).toString('base64');
      const response = await axios.post(
        'https://api.razorpay.com/v1/orders',
        {
          amount: amountPaise,
          currency: 'INR',
          receipt: `rcpt_${transactionId.substring(0, 16)}`,
          notes: {
            transactionId,
            customerEmail,
            customerName
          }
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Razorpay order created successfully', { transactionId, orderId: response.data.id });

      return {
        orderId: response.data.id,
        amount: response.data.amount,
        currency: response.data.currency,
        keyId: this.razorpayKeyId,
        isSimulated: false
      };
    } catch (error) {
      logger.error('Razorpay order creation error:', error.response?.data || error.message);
      throw new Error('Failed to initialize Razorpay payment order');
    }
  }

  /**
   * Verify Razorpay Payment Signature
   */
  verifyRazorpaySignature({ orderId, paymentId, signature }) {
    try {
      if (!this.razorpayKeySecret) return true; // Dev fallback
      const generatedSignature = crypto
        .createHmac('sha256', this.razorpayKeySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      return generatedSignature === signature;
    } catch (error) {
      logger.error('Razorpay signature verification error:', error);
      return false;
    }
  }

  /**
   * Initialize SSLCommerz session
   */
  async initSSLCommerz({ transactionId, totalAmount, customerName, customerEmail }) {
    try {
      const data = new URLSearchParams();
      data.append('store_id', this.sslStoreId || 'demo');
      data.append('store_passwd', this.sslStorePass || 'demo');
      data.append('total_amount', totalAmount.toString());
      data.append('currency', 'BDT');
      data.append('tran_id', transactionId);
      data.append('success_url', `${process.env.API_BASE_URL || 'http://localhost:8787'}/payment/callback/sslcommerz/success`);
      data.append('fail_url', `${process.env.API_BASE_URL || 'http://localhost:8787'}/payment/callback/sslcommerz/fail`);
      data.append('cancel_url', `${process.env.API_BASE_URL || 'http://localhost:8787'}/payment/callback/sslcommerz/cancel`);
      data.append('ipn_url', `${process.env.API_BASE_URL || 'http://localhost:8787'}/payment/callback/sslcommerz/ipn`);
      
      data.append('cus_name', customerName || 'ReadyPI User');
      data.append('cus_email', customerEmail);
      data.append('cus_add1', 'Mumbai, India');
      data.append('cus_city', 'Mumbai');
      data.append('cus_country', 'India');
      data.append('cus_phone', '9876543210');
      
      data.append('shipping_method', 'NO');
      data.append('product_name', 'ReadyPI India AI Credits');
      data.append('product_category', 'Software');
      data.append('product_profile', 'non-physical-goods');

      logger.info('Initializing SSLCommerz payment', { transactionId, totalAmount });

      const response = await axios.post(`${this.sslBaseUrl}/gwprocess/v4/api.php`, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (response.data.status === 'SUCCESS') {
        return {
          gatewayUrl: response.data.GatewayPageURL,
          sessionkey: response.data.sessionkey
        };
      } else {
        logger.error('SSLCommerz init failed', response.data);
        throw new Error(response.data.failedreason || 'SSLCommerz initialization failed');
      }
    } catch (error) {
      logger.error('SSLCommerz error:', error);
      throw error;
    }
  }

  /**
   * Validate SSLCommerz payment
   */
  async validateSSLCommerz(valId) {
    try {
      const url = `${this.sslBaseUrl}/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${this.sslStoreId}&store_passwd=${this.sslStorePass}&format=json`;
      
      const response = await axios.get(url);
      
      if (response.data.status === 'VALID' || response.data.status === 'AUTHENTICATED') {
        return response.data;
      } else {
        logger.warn('SSLCommerz validation failed', response.data);
        return null;
      }
    } catch (error) {
      logger.error('SSLCommerz validation error:', error);
      throw error;
    }
  }

  /**
   * Initialize NOWPayments session (International Crypto)
   */
  async initNOWPayments({ transactionId, totalAmount, customerEmail }) {
    try {
      const amountInUSD = (totalAmount / 86.5).toFixed(2); 

      const response = await axios.post(`${this.npBaseUrl}/payment`, {
        price_amount: amountInUSD,
        price_currency: 'usd',
        pay_currency: 'usdttrc20',
        order_id: transactionId,
        order_description: 'ReadyPI India AI Credits Top-up',
        ipn_callback_url: `${process.env.API_BASE_URL || 'http://localhost:8787'}/payment/callback/nowpayments/ipn`,
        success_url: `${process.env.DASHBOARD_URL || 'http://localhost:3001'}/dashboard?payment=success`,
        cancel_url: `${process.env.DASHBOARD_URL || 'http://localhost:3001'}/billing?payment=cancelled`,
      }, {
        headers: {
          'x-api-key': this.npApiKey,
          'Content-Type': 'application/json'
        }
      });

      return {
        gatewayUrl: response.data.invoice_url || response.data.payment_url,
        paymentId: response.data.payment_id
      };
    } catch (error) {
      logger.error('NOWPayments init error:', error.response?.data || error.message);
      throw new Error('NOWPayments initialization failed');
    }
  }
}

module.exports = new PaymentService();
