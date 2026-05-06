const { Pool } = require('pg');
const logger = require('./logger');

// Create PostgreSQL connection pool
// Supports DATABASE_URL (Neon/Supabase/Cloud SQL proxy) or individual env vars
const dbUrl = process.env.DATABASE_URL || '';
const isUnixSocket = dbUrl.includes('/cloudsql/');
const poolConfig = dbUrl
  ? {
      connectionString: dbUrl,
      ...(isUnixSocket ? {} : { ssl: { rejectUnauthorized: false } }),
    }
  : process.env.CLOUD_SQL_CONNECTION_NAME
  ? {
      // Cloud SQL Auth Proxy via Unix socket (Cloud Run native)
      host: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
      database: process.env.DB_NAME || 'readypi',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'readypi',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool({
  ...poolConfig,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log pool errors
pool.on('error', (err) => {
  logger.error('Unexpected database error:', err);
});

// Query helper with logging
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Executed query', {
      query: text,
      duration: `${duration}ms`,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    logger.error('Database query error:', {
      query: text,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Get a client from the pool (for complex operations)
const getClient = async () => {
  return await pool.connect();
};

// Close all connections (for graceful shutdown)
const end = async () => {
  await pool.end();
  logger.info('Database connection pool closed');
};

module.exports = {
  query,
  transaction,
  getClient,
  end,
  pool
};
