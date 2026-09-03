// Jest test setup file
// This file runs before each test suite

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.API_BASE_URL = 'http://localhost:3000';

// Mock database configuration for tests
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'readypi_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_SSL = 'false';

// JWT secret for tests
process.env.JWT_SECRET = 'test_jwt_secret_key_32_characters_long';
process.env.API_KEY_SALT_ROUNDS = '10'; // Faster tests

// Mock external service API keys
process.env.GOOGLE_API_KEY = 'test_google_api_key';
process.env.OPENAI_API_KEY = 'test_openai_api_key';
process.env.ANTHROPIC_API_KEY = 'test_anthropic_api_key';
process.env.DEEPSEEK_API_KEY = 'test_deepseek_api_key';
process.env.MISTRAL_API_KEY = 'test_mistral_api_key';
process.env.OPENROUTER_API_KEY = 'test_openrouter_api_key';
process.env.FIREWORKS_API_KEY = 'test_fireworks_api_key';
process.env.MODAL_API_KEY = 'test_modal_api_key';

// Payment gateway keys (test mode)
process.env.SSLCOMMERZ_STORE_ID = 'test_store_id';
process.env.SSLCOMMERZ_STORE_PASSWORD = 'test_store_password';
process.env.SSLCOMMERZ_IS_LIVE = 'false';
process.env.NOWPAYMENTS_API_KEY = 'test_nowpayments_key';
process.env.NOWPAYMENTS_IPN_SECRET = 'test_nowpayments_secret';
process.env.NOWPAYMENTS_IS_SANDBOX = 'true';

// CORS configuration
process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:3001';

// Logging
process.env.LOG_LEVEL = 'error';

// Supabase mock
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test_supabase_anon_key';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in test mode
global.console = {
  ...console,
  // Suppress noisy logs during tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Mock process.send for PM2 readiness signal (when tests run server.js)
if (!process.send) {
  process.send = jest.fn();
}

// Cleanup after all tests
afterAll(async () => {
  // Close database connections if any
  try {
    const db = require('./utils/db');
    if (db && db.end) {
      await db.end();
    }
  } catch (err) {
    // Ignore cleanup errors
  }
});

module.exports = {};
