/**
 * Add AWS Bedrock models to the database
 */
const { Pool } = require('pg');

const pool = new Pool({
  host: '34.124.136.27',
  port: 5432,
  database: 'readypi',
  user: 'postgres',
  password: 'KLcJHtxPvD5ugO201GuXBt8xaTIQBZ1',
  ssl: false
});

const bedrockModels = [
  { name: 'readypi/bedrock-nova-micro', display: 'Amazon Nova Micro', cost: 0.35, free: true },
  { name: 'readypi/bedrock-nova-lite', display: 'Amazon Nova Lite', cost: 0.60, free: true },
  { name: 'readypi/bedrock-nova-pro', display: 'Amazon Nova Pro', cost: 2.50, free: false },
  { name: 'readypi/bedrock-titan', display: 'Amazon Titan Express', cost: 1.30, free: true },
  { name: 'readypi/bedrock-llama-8b', display: 'Llama 3.1 8B (Bedrock)', cost: 0.30, free: true },
  { name: 'readypi/bedrock-llama-70b', display: 'Llama 3.1 70B (Bedrock)', cost: 2.65, free: false },
  { name: 'readypi/bedrock-mistral-7b', display: 'Mistral 7B (Bedrock)', cost: 0.15, free: true },
  { name: 'readypi/bedrock-mixtral', display: 'Mixtral 8x7B (Bedrock)', cost: 0.45, free: true },
  { name: 'readypi/bedrock-claude-haiku-3', display: 'Claude 3 Haiku (Bedrock)', cost: 0.80, free: true },
  { name: 'readypi/bedrock-claude-haiku', display: 'Claude 3.5 Haiku (Bedrock)', cost: 3.00, free: false },
  { name: 'readypi/bedrock-claude-sonnet', display: 'Claude 3.5 Sonnet (Bedrock)', cost: 9.00, free: false },
];

(async () => {
  try {
    console.log('Adding AWS Bedrock models to database...\n');
    
    for (const m of bedrockModels) {
      await pool.query(`
        INSERT INTO model_pricing (model_name, display_name, provider, cost_per_1m_tokens_bdt, is_free_tier, is_active)
        VALUES ($1, $2, 'bedrock', $3, $4, true)
        ON CONFLICT (model_name) DO UPDATE SET 
          display_name = $2,
          provider = 'bedrock',
          cost_per_1m_tokens_bdt = $3,
          is_free_tier = $4,
          is_active = true
      `, [m.name, m.display, m.cost, m.free]);
      
      console.log(`  ✅ ${m.display} (${m.name}) — ৳${m.cost}/1M tokens ${m.free ? '[FREE TIER]' : '[PAID]'}`);
    }
    
    console.log(`\n✅ ${bedrockModels.length} Bedrock models added successfully!`);
    
    // Show all active models
    const result = await pool.query(
      'SELECT model_name, display_name, provider, cost_per_1m_tokens_bdt, is_free_tier FROM model_pricing WHERE is_active = true ORDER BY provider, cost_per_1m_tokens_bdt'
    );
    console.log('\n📋 All active models:');
    result.rows.forEach(r => {
      console.log(`  ${r.provider.padEnd(10)} | ${r.display_name.padEnd(30)} | ৳${parseFloat(r.cost_per_1m_tokens_bdt).toFixed(2)}/1M | ${r.is_free_tier ? 'FREE' : 'PAID'}`);
    });
    
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    await pool.end();
    process.exit(1);
  }
})();
