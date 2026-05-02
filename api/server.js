require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const db = require('./utils/db');

// Import routes
const chatRoutes = require('./routes/chat');
const authRoutes = require('./routes/auth');
const creditsRoutes = require('./routes/credits');
const keysRoutes = require('./routes/keys');
const paymentRoutes = require('./routes/payment');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'ReadyPi API Gateway',
    version: '1.0.0',
    description: 'Bangladesh\'s first AI API aggregation platform',
    documentation: 'https://docs.readypi.io',
    status: 'operational'
  });
});

// API routes
app.use('/v1/chat', chatRoutes);           // OpenAI-compatible chat completions
app.use('/auth', authRoutes);              // Signup, login, logout
app.use('/credits', creditsRoutes);        // Credit balance, top-up
app.use('/keys', keysRoutes);              // API key management
app.use('/payment', paymentRoutes);        // Payment callbacks (SSLCommerz, NOWPayments)

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
    documentation: 'https://docs.readypi.io'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
  // Test database connection
  try {
    await db.query('SELECT NOW()');
    logger.info('Database connection established');
  } catch (error) {
    logger.warn('⚠️  Database connection failed on startup. Endpoints requiring the database will fail.');
    logger.error('Database connection error:', error.message);
  }

  // Start Express server
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`ReadyPi API Gateway running on http://0.0.0.0:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`Base URL: ${process.env.API_BASE_URL || `http://0.0.0.0:${PORT}`}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await db.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await db.end();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
