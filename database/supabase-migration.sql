-- ============================================================================
-- ReadyPi → Supabase Migration
-- Run this in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- Safe to run once on a fresh Supabase project.
-- ============================================================================

-- Enable UUID extension (Supabase supports this natively)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    oauth_provider VARCHAR(50),
    oauth_uid VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    plan_tier VARCHAR(50) DEFAULT 'free',
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan_tier ON users(plan_tier);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth_provider_uid ON users(oauth_provider, oauth_uid) WHERE oauth_provider IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- ============================================================================
-- API KEYS
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    environment VARCHAR(10) DEFAULT 'live',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    rate_limit_per_minute INTEGER DEFAULT 10,
    CONSTRAINT valid_environment CHECK (environment IN ('live', 'test'))
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);

-- ============================================================================
-- CREDITS
-- ============================================================================
CREATE TABLE IF NOT EXISTS credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance BIGINT DEFAULT 0,
    total_purchased BIGINT DEFAULT 0,
    total_used BIGINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_balance CHECK (balance >= 0)
);

CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);

-- ============================================================================
-- TRANSACTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_inr DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    amount_bdt DECIMAL(10, 2) DEFAULT 0.00,
    amount_usd DECIMAL(10, 2),
    credits_added BIGINT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_gateway VARCHAR(50),
    gateway_transaction_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('upi', 'razorpay', 'phonepe', 'gpay', 'paytm', 'bhim', 'card', 'bank', 'netbanking', 'usdt', 'btc', 'bkash', 'nagad', 'rocket')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway_id ON transactions(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_tier VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    price_inr DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    price_bdt DECIMAL(10, 2) DEFAULT 0.00,
    credits_per_month BIGINT NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_plan_tier CHECK (plan_tier IN ('starter', 'pro', 'team', 'enterprise')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
    CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

-- ============================================================================
-- USAGE LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    credits_used BIGINT NOT NULL,
    cost_inr DECIMAL(10, 4) DEFAULT 0.0000,
    cost_bdt DECIMAL(10, 4) DEFAULT 0.0000,
    request_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'success',
    error_message TEXT,
    latency_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('success', 'error', 'rate_limited', 'insufficient_credits'))
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key_id ON usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_model ON usage_logs(model);
CREATE INDEX IF NOT EXISTS idx_usage_logs_status ON usage_logs(status);

-- ============================================================================
-- REFERRALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    credits_earned BIGINT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_purchase_at TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'completed')),
    CONSTRAINT no_self_referral CHECK (referrer_user_id != referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- ============================================================================
-- MODEL PRICING
-- ============================================================================
CREATE TABLE IF NOT EXISTS model_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    cost_per_1m_tokens_inr DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cost_per_1m_tokens_bdt DECIMAL(10, 2) DEFAULT 0.00,
    cost_per_1m_tokens_usd DECIMAL(10, 4),
    is_active BOOLEAN DEFAULT TRUE,
    is_free_tier BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_model_pricing_model_name ON model_pricing(model_name);
CREATE INDEX IF NOT EXISTS idx_model_pricing_provider ON model_pricing(provider);
CREATE INDEX IF NOT EXISTS idx_model_pricing_is_active ON model_pricing(is_active);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_credits_updated_at ON credits;
CREATE TRIGGER update_credits_updated_at
BEFORE UPDATE ON credits
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION create_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO credits (user_id, balance, total_purchased, total_used)
    VALUES (NEW.id, 50, 50, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_credits_on_user_signup ON users;
CREATE TRIGGER create_credits_on_user_signup
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION create_user_credits();

-- ============================================================================
-- VIEWS
-- ============================================================================
CREATE OR REPLACE VIEW user_summary AS
SELECT
    u.id, u.email, u.full_name, u.plan_tier, u.created_at,
    c.balance AS credit_balance, c.total_purchased, c.total_used,
    COUNT(DISTINCT ak.id) AS api_key_count,
    COUNT(DISTINCT ul.id) AS total_api_calls,
    SUM(ul.total_tokens) AS total_tokens_used
FROM users u
LEFT JOIN credits c ON u.id = c.user_id
LEFT JOIN api_keys ak ON u.id = ak.user_id AND ak.is_active = TRUE
LEFT JOIN usage_logs ul ON u.id = ul.user_id
GROUP BY u.id, u.email, u.full_name, u.plan_tier, u.created_at, c.balance, c.total_purchased, c.total_used;

CREATE OR REPLACE VIEW daily_revenue AS
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

CREATE OR REPLACE VIEW model_usage_stats AS
SELECT
    model, provider,
    COUNT(*) AS request_count,
    SUM(total_tokens) AS total_tokens,
    SUM(credits_used) AS total_credits_used,
    AVG(latency_ms) AS avg_latency_ms,
    COUNT(CASE WHEN status = 'error' THEN 1 END) AS error_count
FROM usage_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY model, provider
ORDER BY request_count DESC;

-- ============================================================================
-- SECURITY NOTE (Supabase-specific)
-- The API connects directly with the service connection string, so Row Level
-- Security is not required for these tables. But since Supabase exposes
-- tables via its auto-generated REST API, we enable RLS with no policies —
-- this blocks all anon/authenticated access via PostgREST while the pg
-- connection from the Express API (role: postgres) bypasses RLS entirely.
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_pricing ENABLE ROW LEVEL SECURITY;
