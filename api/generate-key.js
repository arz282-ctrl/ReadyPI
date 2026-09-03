const { Client } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:KLcJHtxPvD5ugO201GuXBt8xaTIQBZ1@34.124.136.27:5432/readypi',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Generate key
    const environment = 'live';
    const randomPart = crypto.randomBytes(16).toString('hex'); // 32 chars
    const apiKey = `rpi_${environment}_${randomPart}`;
    const keyPrefix = apiKey.substring(0, 16);
    
    // Hash key
    const keyHash = await bcrypt.hash(apiKey, 12);
    
    // Admin user id
    const userId = '48844fe2-c2b0-4fd5-95e6-ad5e79460b9e';
    const name = 'SergeantPI Integration Key';
    const rateLimit = 1000; // Team limit is 1000 per minute
    
    // Insert into database
    const query = `
      INSERT INTO api_keys (user_id, key_hash, key_prefix, name, environment, rate_limit_per_minute, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, key_prefix, created_at;
    `;
    
    const result = await client.query(query, [userId, keyHash, keyPrefix, name, environment, rateLimit]);
    console.log('API Key Created in Database!');
    console.log('Key ID:', result.rows[0].id);
    console.log('Key Prefix:', result.rows[0].key_prefix);
    console.log('Plaintext API Key:', apiKey);
    
  } catch (err) {
    console.error('Error generating key:', err);
  } finally {
    await client.end();
  }
}

run();
