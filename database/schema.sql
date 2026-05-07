-- ReadyPi Database Schema
-- PostgreSQL 16+
-- Created: April 2026

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Nullable: OAuth users don't have passwords
    full_name VARCHAR(255),
    avatar_url TEXT, -- Profile picture from OAuth provider
    oauth_provider VARCHAR(50), -- google.com, github.com, etc.
    oauth_uid VARCHAR(255), -- Firebase Auth UID
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    plan_tier VARCHAR(50) DEFAULT 'free', -- free, starter, pro, team, enterprise
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan_tier ON users(plan_tier);
CREATE UNIQUE INDEX idx_users_oauth_provider_uid ON users(oauth_provider, oauth_uid) WHERE oauth_provider IS NOT NULL;
CREATE INDEX idx_users_last_login ON users(last_login);

-- ============================================================================
-- API KEYS TABLE
-- ============================================================================
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL UNIQUE, -- bcrypt hash of the actual key
    key_prefix VARCHAR(20) NOT NULL, -- e.g., "rpi_live_a1b2c3d4"
    name VARCHAR(100), -- User-defined name for the key
    environment VARCHAR(10) DEFAULT 'live', -- live or test
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    rate_limit_per_minute INTEGER DEFAULT 10, -- Based on plan tier
    CONSTRAINT valid_environment CHECK (environment IN ('live', 'test'))
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);

-- ============================================================================
-- CREDITS TABLE
-- ============================================================================
CREATE TABLE credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance BIGINT DEFAULT 0, -- Credits in units (1 credit = 1000 tokens)
    total_purchased BIGINT DEFAULT 0, -- Lifetime credits purchased
    total_used BIGINT DEFAULT 0, -- Lifetime credits consumed
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_balance CHECK (balance >= 0)
);

CREATE INDEX idx_credits_user_id ON credits(user_id);

-- ============================================================================
-- TRANSACTIONS TABLE (Payment History)
-- ============================================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_bdt DECIMAL(10, 2) NOT NULL, -- Amount in BDT
    amount_usd DECIMAL(10, 2), -- Amount in USD (for crypto payments)
    credits_added BIGINT NOT NULL, -- Credits added to account
    payment_method VARCHAR(50) NOT NULL, -- bkash, nagad, rocket, usdt, btc, card
    payment_gateway VARCHAR(50), -- sslcommerz, nowpayments
    gateway_transaction_id VARCHAR(255), -- External transaction ID
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
    metadata JSONB, -- Additional payment data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('bkash', 'nagad', 'rocket', 'usdt', 'btc', 'card', 'bank')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_gateway_id ON transactions(gateway_transaction_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_tier VARCHAR(50) NOT NULL, -- starter, pro, team, enterprise
    status VARCHAR(50) DEFAULT 'active', -- active, cancelled, expired, paused
    price_bdt DECIMAL(10, 2) NOT NULL, -- Monthly price in BDT
    credits_per_month BIGINT NOT NULL, -- Credits included in plan
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_plan_tier CHECK (plan_tier IN ('starter', 'pro', 'team', 'enterprise')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
    CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly'))
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);

-- ============================================================================
-- USAGE LOGS TABLE (API Call History)
-- ============================================================================
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL, -- e.g., "readypi/gpt4o", "readypi/claude-sonnet"
    provider VARCHAR(50) NOT NULL, -- openai, anthropic, google, groq, deepseek
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    credits_used BIGINT NOT NULL, -- Credits deducted for this call
    cost_bdt DECIMAL(10, 4), -- Cost in BDT
    request_id VARCHAR(255), -- Unique request identifier
    status VARCHAR(50) DEFAULT 'success', -- success, error, rate_limited
    error_message TEXT,
    latency_ms INTEGER, -- Response time in milliseconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('success', 'error', 'rate_limited', 'insufficient_credits'))
);

CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_api_key_id ON usage_logs(api_key_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_model ON usage_logs(model);
CREATE INDEX idx_usage_logs_status ON usage_logs(status);

-- ============================================================================
-- REFERRALS TABLE
-- ============================================================================
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    credits_earned BIGINT DEFAULT 0, -- 20% of referred user's purchases
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_purchase_at TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'completed')),
    CONSTRAINT no_self_referral CHECK (referrer_user_id != referred_user_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);

-- ============================================================================
-- MODEL PRICING TABLE
-- ============================================================================
CREATE TABLE model_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) UNIQUE NOT NULL, -- e.g., "readypi/gpt4o"
    provider VARCHAR(50) NOT NULL, -- openai, anthropic, google, etc.
    display_name VARCHAR(100) NOT NULL, -- "GPT-4o"
    cost_per_1m_tokens_bdt DECIMAL(10, 2) NOT NULL, -- Cost in BDT per 1M tokens
    cost_per_1m_tokens_usd DECIMAL(10, 4), -- Original USD cost
    is_active BOOLEAN DEFAULT TRUE,
    is_free_tier BOOLEAN DEFAULT FALSE, -- Available on free plan
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_model_pricing_model_name ON model_pricing(model_name);
CREATE INDEX idx_model_pricing_provider ON model_pricing(provider);
CREATE INDEX idx_model_pricing_is_active ON model_pricing(is_active);

-- ============================================================================
-- INITIAL MODEL PRICING DATA
-- ============================================================================
INSERT INTO model_pricing (model_name, provider, display_name, cost_per_1m_tokens_bdt, cost_per_1m_tokens_usd, is_free_tier) VALUES
('readypi/deepseek', 'deepseek', 'DeepSeek-V3', 0.90, 0.008, TRUE),
('readypi/llama', 'groq', 'Llama 3 70B', 0.60, 0.005, TRUE),
('readypi/gemini-flash', 'google', 'Gemini 1.5 Flash', 0.30, 0.003, TRUE),
('readypi/gpt4o-mini', 'openai', 'GPT-4o Mini', 0.60, 0.005, FALSE),
('readypi/claude-haiku', 'anthropic', 'Claude Haiku 4.5', 2.50, 0.023, FALSE),
('readypi/mistral', 'mistral', 'Mistral Small', 0.70, 0.006, FALSE),
('readypi/claude-sonnet', 'anthropic', 'Claude Sonnet 4.6', 12.00, 0.109, FALSE),
('readypi/gpt4o', 'openai', 'GPT-4o', 10.00, 0.091, FALSE),
('readypi/gemini-2.5-flash-free', 'openrouter', 'Gemini 2.5 Flash (Free)', 0.00, 0.000, TRUE),
('readypi/llama-3.3-70b-free', 'openrouter', 'Llama 3.3 70B (Free)', 0.00, 0.000, TRUE),
('readypi/mistral-nemo-free', 'openrouter', 'Mistral Nemo (Free)', 0.00, 0.000, TRUE),
('readypi/deepseek-r1-free', 'openrouter', 'DeepSeek R1 (Free)', 0.00, 0.000, TRUE),
('readypi/qwen-2.5-72b-free', 'openrouter', 'Qwen 2.5 72B (Free)', 0.00, 0.000, TRUE),
('readypi/phi-3-mini-free', 'openrouter', 'Phi-3 Mini 128K (Free)', 0.00, 0.000, TRUE),
('readypi/vertex-gemini-1.5-pro', 'vertex', 'Gemini 1.5 Pro (Vertex)', 1.50, 0.014, FALSE),
('readypi/vertex-gemini-1.5-flash', 'vertex', 'Gemini 1.5 Flash (Vertex)', 0.35, 0.003, FALSE),
('readypi/vertex-claude-sonnet', 'vertex', 'Claude 3.5 Sonnet (Vertex)', 12.00, 0.109, FALSE),
('readypi/vertex-claude-haiku', 'vertex', 'Claude 3.5 Haiku (Vertex)', 2.50, 0.023, FALSE),
('readypi/vertex-llama-405b', 'vertex', 'Llama 3 405B (Vertex)', 15.00, 0.136, FALSE);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for credits table
CREATE TRIGGER update_credits_updated_at
BEFORE UPDATE ON credits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for subscriptions table
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create credits record when user is created
CREATE OR REPLACE FUNCTION create_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO credits (user_id, balance, total_purchased, total_used)
    VALUES (NEW.id, 50, 50, 0); -- Free tier: 50 credits = 50K tokens
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_credits_on_user_signup
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_credits();

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- User summary view
CREATE VIEW user_summary AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.plan_tier,
    u.created_at,
    c.balance AS credit_balance,
    c.total_purchased,
    c.total_used,
    COUNT(DISTINCT ak.id) AS api_key_count,
    COUNT(DISTINCT ul.id) AS total_api_calls,
    SUM(ul.total_tokens) AS total_tokens_used
FROM users u
LEFT JOIN credits c ON u.id = c.user_id
LEFT JOIN api_keys ak ON u.id = ak.user_id AND ak.is_active = TRUE
LEFT JOIN usage_logs ul ON u.id = ul.user_id
GROUP BY u.id, u.email, u.full_name, u.plan_tier, u.created_at, c.balance, c.total_purchased, c.total_used;

-- Daily revenue view
CREATE VIEW daily_revenue AS
SELECT 
    DATE(created_at) AS date,
    COUNT(*) AS transaction_count,
    SUM(amount_bdt) AS total_bdt,
    SUM(amount_usd) AS total_usd,
    SUM(credits_added) AS total_credits_sold
FROM transactions
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Model usage stats
CREATE VIEW model_usage_stats AS
SELECT 
    model,
    provider,
    COUNT(*) AS request_count,
    SUM(total_tokens) AS total_tokens,
    SUM(credits_used) AS total_credits_used,
    AVG(latency_ms) AS avg_latency_ms,
    COUNT(CASE WHEN status = 'error' THEN 1 END) AS error_count
FROM usage_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY model, provider
ORDER BY request_count DESC;

COMMIT;
