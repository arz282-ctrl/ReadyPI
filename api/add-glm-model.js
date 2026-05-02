/**
 * Add GLM-5.1 (Modal) model to the database
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

(async () => {
  try {
    console.log('Adding GLM-5.1 model to database...');
    
    await pool.query(`
      INSERT INTO model_pricing (model_name, display_name, provider, cost_per_1m_tokens_bdt, is_free_tier, is_active)
      VALUES ('readypi/glm-5.1', 'GLM 5.1 (ZhipuAI)', 'modal', 0.50, true, true)
      ON CONFLICT (model_name) DO UPDATE SET 
        provider = 'modal', 
        display_name = 'GLM 5.1 (ZhipuAI)',
        is_active = true,
        is_free_tier = true
    `);
    
    console.log('✅ GLM-5.1 model added successfully');
    
    // Verify
    const result = await pool.query('SELECT model_name, display_name, provider, is_free_tier FROM model_pricing WHERE provider = $1', ['modal']);
    console.log('Modal models:', result.rows);
    
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    await pool.end();
    process.exit(1);
  }
})();
