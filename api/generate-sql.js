const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function run() {
  // Generate key offline
  const environment = 'live';
  const randomPart = crypto.randomBytes(16).toString('hex'); // 32 chars
  const apiKey = `rpi_${environment}_${randomPart}`;
  const keyPrefix = apiKey.substring(0, 16);
  
  // Hash key offline
  const keyHash = await bcrypt.hash(apiKey, 12);
  
  // Admin user id
  const userId = '48844fe2-c2b0-4fd5-95e6-ad5e79460b9e';
  const name = 'SergeantPI Integration Key';
  const rateLimit = 1000; // Team limit is 1000 per minute
  
  // Print SQL and Plaintext Key
  console.log('--- GENERATED KEY DETAILS ---');
  console.log(`Plaintext API Key: ${apiKey}`);
  console.log(`Key Prefix: ${keyPrefix}`);
  console.log('\n--- SQL INSERT STATEMENT ---');
  console.log(`INSERT INTO api_keys (user_id, key_hash, key_prefix, name, environment, rate_limit_per_minute, is_active) VALUES ('${userId}', '${keyHash}', '${keyPrefix}', '${name}', '${environment}', ${rateLimit}, true);`);
}

run();
