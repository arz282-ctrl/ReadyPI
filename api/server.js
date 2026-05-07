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
const assistantRoutes = require('./routes/assistant');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for Cloud Run
// Use numeric value (1) instead of true to satisfy express-rate-limit's strict check
if (process.env.NODE_ENV !== 'test') {
  app.set('trust proxy', 1);
}

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
// NOTE: Stripe webhook requires the raw request body for signature verification.
// We must skip the global JSON parser for that path — the route applies express.raw() itself.
app.use((req, res, next) => {
  if (req.originalUrl === '/payment/stripe/webhook') {
    return next(); // skip — payment route's express.raw() handles it
  }
  express.json({ limit: '10mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.originalUrl === '/payment/stripe/webhook') {
    return next();
  }
  express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
});

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

// Detailed health check with service diagnostics
app.get('/health/detailed', async (req, res) => {
  const diagnostics = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    services: {
      database: { status: 'checking' },
      firebase: { status: 'checking' }
    }
  };

  // Check database connection (await to avoid race condition)
  try {
    await db.query('SELECT NOW()');
    diagnostics.services.database.status = 'ok';
    diagnostics.services.database.message = 'Database connection healthy';
  } catch (err) {
    diagnostics.services.database.status = 'error';
    diagnostics.services.database.message = err.message;
    diagnostics.status = 'degraded';
  }

  // Check Firebase configuration
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (sa.project_id && sa.private_key && sa.client_email) {
        diagnostics.services.firebase.status = 'configured';
        diagnostics.services.firebase.project_id = sa.project_id;
        diagnostics.services.firebase.client_email = sa.client_email;
        diagnostics.services.firebase.message = 'Firebase credentials are valid';
      } else {
        diagnostics.services.firebase.status = 'error';
        diagnostics.services.firebase.message = 'Firebase service account missing required fields';
        diagnostics.status = 'degraded';
      }
    } catch (parseErr) {
      diagnostics.services.firebase.status = 'error';
      diagnostics.services.firebase.message = `Firebase service account JSON parsing failed: ${parseErr.message}`;
      diagnostics.status = 'degraded';
    }
  } else {
    diagnostics.services.firebase.status = 'not_configured';
    diagnostics.services.firebase.message = 'FIREBASE_SERVICE_ACCOUNT environment variable is not set';
    diagnostics.status = 'degraded';
  }

  res.json(diagnostics);
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
app.use('/assistant', assistantRoutes);    // Native ReadyPI live assistant (GPT-4o-mini, SSE)

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
    
    // Tell PM2 the app is ready (required for pm2-runtime container startup)
    if (process.send) {
      process.send('ready');
    }
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

// Only start listening when run directly (not when required by Jest tests)
if (require.main === module) {
  startServer();
}

module.exports = app;
