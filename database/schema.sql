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
    amount_inr DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Amount in INR (primary, India market)
    amount_bdt DECIMAL(10, 2) DEFAULT 0.00, -- Amount in BDT (legacy)
    amount_usd DECIMAL(10, 2), -- Amount in USD (for crypto payments)
    credits_added BIGINT NOT NULL, -- Credits added to account
    payment_method VARCHAR(50) NOT NULL, -- upi, razorpay, phonepe, gpay, paytm, bhim, card, bank, netbanking, usdt, btc, bkash, nagad, rocket
    payment_gateway VARCHAR(50), -- razorpay, sslcommerz, nowpayments
    gateway_transaction_id VARCHAR(255), -- External transaction ID
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
    metadata JSONB, -- Additional payment data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('upi', 'razorpay', 'phonepe', 'gpay', 'paytm', 'bhim', 'card', 'bank', 'netbanking', 'usdt', 'btc', 'bkash', 'nagad', 'rocket')),
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
    price_inr DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Monthly price in INR (primary)
    price_bdt DECIMAL(10, 2) DEFAULT 0.00, -- Monthly price in BDT (legacy)
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
    cost_inr DECIMAL(10, 4) DEFAULT 0.0000, -- Cost in INR (primary)
    cost_bdt DECIMAL(10, 4), -- Cost in BDT (legacy)
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
    cost_per_1m_tokens_inr DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Cost in INR per 1M tokens (primary)
    cost_per_1m_tokens_bdt DECIMAL(10, 2) DEFAULT 0.00, -- Cost in BDT per 1M tokens (legacy)
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
-- Pricing: 30% markup on provider cost, USD converted to BDT at 110 BDT/USD
-- Formula: avg(promptPrice, completionPrice) × 1.30 markup = readypi_usd
--          readypi_usd × 110 = readypi_bdt
-- ============================================================================
INSERT INTO model_pricing (model_name, provider, display_name, cost_per_1m_tokens_inr, cost_per_1m_tokens_bdt, cost_per_1m_tokens_usd, is_free_tier) VALUES
-- Free OpenRouter models
('google/gemini-2.5-flash:free', 'openrouter', 'Gemini 2.5 Flash', 0.00, 0.00, 0.0000, TRUE),
('google/gemini-2.5-flash-preview-05-20:free', 'openrouter', 'Gemini 2.5 Flash Preview', 0.00, 0.00, 0.0000, TRUE),
('meta-llama/llama-3.3-70b-instruct:free', 'openrouter', 'Llama 3.3 70B', 0.00, 0.00, 0.0000, TRUE),
('meta-llama/llama-4-maverick:free', 'openrouter', 'Llama 4 Maverick', 0.00, 0.00, 0.0000, TRUE),
('meta-llama/llama-4-scout:free', 'openrouter', 'Llama 4 Scout', 0.00, 0.00, 0.0000, TRUE),
('deepseek/deepseek-r1:free', 'openrouter', 'DeepSeek R1', 0.00, 0.00, 0.0000, TRUE),
('deepseek/deepseek-chat-v3-0324:free', 'openrouter', 'DeepSeek V3 0324', 0.00, 0.00, 0.0000, TRUE),
('deepseek/deepseek-r1-0528:free', 'openrouter', 'DeepSeek R1 0528', 0.00, 0.00, 0.0000, TRUE),
('qwen/qwen-2.5-72b-instruct:free', 'openrouter', 'Qwen 2.5 72B', 0.00, 0.00, 0.0000, TRUE),
('qwen/qwen3-235b-a22b:free', 'openrouter', 'Qwen 3 235B', 0.00, 0.00, 0.0000, TRUE),
('qwen/qwen3-32b:free', 'openrouter', 'Qwen 3 32B', 0.00, 0.00, 0.0000, TRUE),
('qwen/qwen3-30b-a3b:free', 'openrouter', 'Qwen 3 30B A3B', 0.00, 0.00, 0.0000, TRUE),
('qwen/qwen-2.5-vl-72b-instruct:free', 'openrouter', 'Qwen 2.5 VL 72B', 0.00, 0.00, 0.0000, TRUE),
('qwen/qwen-2.5-coder-32b-instruct:free', 'openrouter', 'Qwen 2.5 Coder 32B', 0.00, 0.00, 0.0000, TRUE),
('mistralai/mistral-nemo:free', 'openrouter', 'Mistral Nemo', 0.00, 0.00, 0.0000, TRUE),
('mistralai/mistral-small-3.1-24b-instruct:free', 'openrouter', 'Mistral Small 3.1 24B', 0.00, 0.00, 0.0000, TRUE),
('microsoft/phi-3-mini-128k-instruct:free', 'openrouter', 'Phi-3 Mini 128K', 0.00, 0.00, 0.0000, TRUE),
('microsoft/phi-4-reasoning-plus:free', 'openrouter', 'Phi-4 Reasoning Plus', 0.00, 0.00, 0.0000, TRUE),
('microsoft/phi-4:free', 'openrouter', 'Phi-4', 0.00, 0.00, 0.0000, TRUE),
('microsoft/mai-ds-r1:free', 'openrouter', 'MAI DS R1', 0.00, 0.00, 0.0000, TRUE),
('nvidia/llama-3.1-nemotron-70b-instruct:free', 'openrouter', 'Nemotron 70B', 0.00, 0.00, 0.0000, TRUE),
('nvidia/llama-3.3-nemotron-super-49b-v1:free', 'openrouter', 'Nemotron Super 49B', 0.00, 0.00, 0.0000, TRUE),
('google/gemma-3-27b-it:free', 'openrouter', 'Gemma 3 27B', 0.00, 0.00, 0.0000, TRUE),
('google/gemma-3-12b-it:free', 'openrouter', 'Gemma 3 12B', 0.00, 0.00, 0.0000, TRUE),
('google/gemma-3-4b-it:free', 'openrouter', 'Gemma 3 4B', 0.00, 0.00, 0.0000, TRUE),
('rekaai/reka-flash-3:free', 'openrouter', 'Reka Flash 3', 0.00, 0.00, 0.0000, TRUE),
('moonshotai/kimi-vl-a3b-thinking:free', 'openrouter', 'Kimi VL A3B Thinking', 0.00, 0.00, 0.0000, TRUE),
('bytedance-research/ui-tars-72b:free', 'openrouter', 'UI-TARS 72B', 0.00, 0.00, 0.0000, TRUE),
('open-r1/olympicarena-7b:free', 'openrouter', 'OlympicArena 7B', 0.00, 0.00, 0.0000, TRUE),
('tngtech/deepseek-r1t-chimera:free', 'openrouter', 'DeepSeek R1T Chimera', 0.00, 0.00, 0.0000, TRUE),
('allenai/olmo-2-0325-32b-instruct:free', 'openrouter', 'OLMo 2 32B', 0.00, 0.00, 0.0000, TRUE),
('featherless/qwerky-72b:free', 'openrouter', 'Qwerky 72B', 0.00, 0.00, 0.0000, TRUE),
('shisa-ai/shisa-v2-llama-3.3-70b:free', 'openrouter', 'Shisa V2 70B', 0.00, 0.00, 0.0000, TRUE),
('thedrummer/rocinante-12b:free', 'openrouter', 'Rocinante 12B', 0.00, 0.00, 0.0000, TRUE),
('cognitivecomputations/dolphin-3.0-r1-mistral-24b:free', 'openrouter', 'Dolphin 3.0 R1 24B', 0.00, 0.00, 0.0000, TRUE),
('cognitivecomputations/dolphin-3.0-mistral-24b:free', 'openrouter', 'Dolphin 3.0 24B', 0.00, 0.00, 0.0000, TRUE),
('sophosympatheia/rogue-rose-103b-v0.2:free', 'openrouter', 'Rogue Rose 103B', 0.00, 0.00, 0.0000, TRUE),
('mancer/mythomist-7b:free', 'openrouter', 'MythoMist 7B', 0.00, 0.00, 0.0000, TRUE),
('huggingface/meta-llama/llama-3.2-11b-vision-instruct:free', 'openrouter', 'Llama 3.2 11B Vision', 0.00, 0.00, 0.0000, TRUE),
('all-hands/openhands-lm-32b-v0.1:free', 'openrouter', 'OpenHands LM 32B', 0.00, 0.00, 0.0000, TRUE),
('google/gemma-3-1b-it:free', 'openrouter', 'Gemma 3 1B', 0.00, 0.00, 0.0000, TRUE),
('qwen/qwen3-14b:free', 'openrouter', 'Qwen 3 14B', 0.00, 0.00, 0.0000, TRUE),
('qwen/qwen3-4b:free', 'openrouter', 'Qwen 3 4B', 0.00, 0.00, 0.0000, TRUE),
('meta-llama/llama-3.2-3b-instruct:free', 'openrouter', 'Llama 3.2 3B', 0.00, 0.00, 0.0000, TRUE),
('meta-llama/llama-3.2-1b-instruct:free', 'openrouter', 'Llama 3.2 1B', 0.00, 0.00, 0.0000, TRUE),
-- Google Direct
('gemini-1.5-flash', 'google', 'Gemini 1.5 Flash', 24.37, 32.17, 0.2925, FALSE),
('gemini-1.5-pro', 'google', 'Gemini 1.5 Pro', 338.55, 446.88, 4.0625, FALSE),
-- OpenAI Direct
('gpt-3.5-turbo', 'openai', 'GPT-3.5 Turbo', 108.33, 143.00, 1.3000, FALSE),
('gpt-3.5-turbo-instruct', 'openai', 'GPT-3.5 Turbo Instruct', 189.58, 250.25, 2.2750, FALSE),
('gpt-4', 'openai', 'GPT-4', 4875.00, 6435.00, 58.5000, FALSE),
('gpt-4-turbo', 'openai', 'GPT-4 Turbo', 2166.67, 2860.00, 26.0000, FALSE),
('gpt-4.1', 'openai', 'GPT-4.1', 541.67, 715.00, 6.5000, FALSE),
('gpt-4.1-mini', 'openai', 'GPT-4.1 Mini', 108.33, 143.00, 1.3000, FALSE),
('gpt-4.1-nano', 'openai', 'GPT-4.1 Nano', 27.08, 35.75, 0.3250, FALSE),
('gpt-4o', 'openai', 'GPT-4o', 1083.33, 1430.00, 13.0000, FALSE),
('gpt-4o-mini', 'openai', 'GPT-4o Mini', 40.63, 53.63, 0.4875, FALSE),
('gpt-4o-search-preview', 'openai', 'GPT-4o Search Preview', 677.08, 893.75, 8.1250, FALSE),
('gpt-4o-mini-search-preview', 'openai', 'GPT-4o Mini Search', 40.63, 53.63, 0.4875, FALSE),
('gpt-5', 'openai', 'GPT-5', 4062.50, 5362.50, 48.7500, FALSE),
('gpt-5-mini', 'openai', 'GPT-5 Mini', 812.50, 1072.50, 9.7500, FALSE),
('gpt-5-nano', 'openai', 'GPT-5 Nano', 270.83, 357.50, 3.2500, FALSE),
('gpt-5-pro', 'openai', 'GPT-5 Pro', 6500.00, 8580.00, 78.0000, FALSE),
('gpt-5-codex', 'openai', 'GPT-5 Codex', 4062.50, 5362.50, 48.7500, FALSE),
('gpt-5.1', 'openai', 'GPT-5.1', 4062.50, 5362.50, 48.7500, FALSE),
('gpt-5.1-codex', 'openai', 'GPT-5.1 Codex', 4062.50, 5362.50, 48.7500, FALSE),
('gpt-5.1-codex-mini', 'openai', 'GPT-5.1 Codex Mini', 812.50, 1072.50, 9.7500, FALSE),
('gpt-5.2', 'openai', 'GPT-5.2', 4062.50, 5362.50, 48.7500, FALSE),
('gpt-5.4', 'openai', 'GPT-5.4', 4062.50, 5362.50, 48.7500, FALSE),
('gpt-5.4-mini', 'openai', 'GPT-5.4 Mini', 812.50, 1072.50, 9.7500, FALSE),
('gpt-5.4-nano', 'openai', 'GPT-5.4 Nano', 135.42, 178.75, 1.6250, FALSE),
('gpt-5.5', 'openai', 'GPT-5.5', 4062.50, 5362.50, 48.7500, FALSE),
('o1', 'openai', 'OpenAI o1', 4062.50, 5362.50, 48.7500, FALSE),
('o1-pro', 'openai', 'OpenAI o1 Pro', 40625.00, 53625.00, 487.5000, FALSE),
('o3', 'openai', 'OpenAI o3', 541.67, 715.00, 6.5000, FALSE),
('o3-mini', 'openai', 'OpenAI o3 Mini', 297.92, 393.25, 3.5750, FALSE),
('o4-mini', 'openai', 'OpenAI o4 Mini', 297.92, 393.25, 3.5750, FALSE),
('dall-e-3', 'openai', 'DALL-E 3', 216.67, 286.00, 2.6000, FALSE),
('dall-e-2', 'openai', 'DALL-E 2', 108.33, 143.00, 1.3000, FALSE),
('gpt-image', 'openai', 'GPT Image', 162.50, 214.50, 1.9500, FALSE),
('whisper-1', 'openai', 'Whisper-1 (STT)', 0.33, 0.43, 0.0039, FALSE),
('tts-1', 'openai', 'TTS-1', 812.50, 1072.50, 9.7500, FALSE),
('tts-1-hd', 'openai', 'TTS-1 HD', 1625.00, 2145.00, 19.5000, FALSE),
('gpt-4o-mini-tts', 'openai', 'GPT-4o Mini TTS', 32.50, 42.90, 0.3900, FALSE),
-- Anthropic Direct
('claude-3-5-sonnet-20241022', 'anthropic', 'Claude 3.5 Sonnet', 975.00, 1287.00, 11.7000, FALSE),
('claude-3-5-haiku-20241022', 'anthropic', 'Claude 3.5 Haiku', 260.00, 343.20, 3.1200, FALSE),
-- DeepSeek Direct
('deepseek-chat', 'deepseek', 'DeepSeek Chat V3', 32.50, 42.90, 0.3900, FALSE),
-- Mistral Direct
('mistral-small-latest', 'mistral', 'Mistral Small', 43.33, 57.20, 0.5200, FALSE),
-- OpenRouter Premium
('openai/gpt-4.1', 'openrouter', 'GPT-4.1', 541.67, 715.00, 6.5000, FALSE),
('openai/gpt-4.1-mini', 'openrouter', 'GPT-4.1 Mini', 108.33, 143.00, 1.3000, FALSE),
('openai/gpt-4.1-nano', 'openrouter', 'GPT-4.1 Nano', 27.08, 35.75, 0.3250, FALSE),
('openai/o3', 'openrouter', 'OpenAI o3', 541.67, 715.00, 6.5000, FALSE),
('openai/o4-mini', 'openrouter', 'OpenAI o4 Mini', 297.92, 393.25, 3.5750, FALSE),
('openai/o3-mini', 'openrouter', 'OpenAI o3 Mini', 297.92, 393.25, 3.5750, FALSE),
('anthropic/claude-sonnet-4', 'openrouter', 'Claude Sonnet 4', 975.00, 1287.00, 11.7000, FALSE),
('anthropic/claude-opus-4', 'openrouter', 'Claude Opus 4', 4875.00, 6435.00, 58.5000, FALSE),
('anthropic/claude-3.5-sonnet', 'openrouter', 'Claude 3.5 Sonnet v2', 975.00, 1287.00, 11.7000, FALSE),
('anthropic/claude-3-haiku', 'openrouter', 'Claude 3 Haiku', 81.25, 107.25, 0.9750, FALSE),
('anthropic/claude-3-opus', 'openrouter', 'Claude 3 Opus', 4875.00, 6435.00, 58.5000, FALSE),
('google/gemini-2.5-pro-preview-03-25', 'openrouter', 'Gemini 2.5 Pro', 609.38, 804.38, 7.3125, FALSE),
('google/gemini-2.0-flash-001', 'openrouter', 'Gemini 2.0 Flash', 27.08, 35.75, 0.3250, FALSE),
('google/gemini-2.5-flash-preview-05-20', 'openrouter', 'Gemini 2.5 Flash 05-20', 40.63, 53.63, 0.4875, FALSE),
('google/gemini-2.0-flash-lite-001', 'openrouter', 'Gemini 2.0 Flash Lite', 10.29, 13.58, 0.1235, FALSE),
('deepseek/deepseek-chat', 'openrouter', 'DeepSeek V3', 63.92, 84.37, 0.7670, FALSE),
('deepseek/deepseek-r1', 'openrouter', 'DeepSeek R1 (Premium)', 161.95, 213.78, 1.9435, FALSE),
('deepseek/deepseek-prover-v2', 'openrouter', 'DeepSeek Prover V2', 161.95, 213.78, 1.9435, FALSE),
('qwen/qwen-2.5-72b-instruct', 'openrouter', 'Qwen 2.5 72B (Premium)', 32.50, 42.90, 0.3900, FALSE),
('qwen/qwen3-235b-a22b', 'openrouter', 'Qwen 3 235B (Premium)', 81.25, 107.25, 0.9750, FALSE),
('qwen/qwq-32b', 'openrouter', 'QwQ 32B', 43.33, 57.20, 0.5200, FALSE),
('qwen/qwen3-8b', 'openrouter', 'Qwen 3 8B', 7.04, 9.29, 0.0845, FALSE),
('mistralai/mistral-large', 'openrouter', 'Mistral Large', 433.33, 572.00, 5.2000, FALSE),
('mistralai/mistral-medium-3', 'openrouter', 'Mistral Medium 3', 130.00, 171.60, 1.5600, FALSE),
('mistralai/codestral-2501', 'openrouter', 'Codestral', 65.00, 85.80, 0.7800, FALSE),
('mistralai/pixtral-large-2411', 'openrouter', 'Pixtral Large', 433.33, 572.00, 5.2000, FALSE),
('x-ai/grok-3-mini-beta', 'openrouter', 'Grok 3 Mini', 43.33, 57.20, 0.5200, FALSE),
('x-ai/grok-3-beta', 'openrouter', 'Grok 3', 975.00, 1287.00, 11.7000, FALSE),
('x-ai/grok-2-vision-1212', 'openrouter', 'Grok 2 Vision', 650.00, 858.00, 7.8000, FALSE),
('meta-llama/llama-3.1-405b-instruct', 'openrouter', 'Llama 3.1 405B', 86.67, 114.40, 1.0400, FALSE),
('meta-llama/llama-3.1-70b-instruct', 'openrouter', 'Llama 3.1 70B', 43.33, 57.20, 0.5200, FALSE),
('meta-llama/llama-3.1-8b-instruct', 'openrouter', 'Llama 3.1 8B', 5.42, 7.15, 0.0650, FALSE),
('meta-llama/llama-4-maverick', 'openrouter', 'Llama 4 Maverick (Premium)', 43.33, 57.20, 0.5200, FALSE),
('meta-llama/llama-4-scout', 'openrouter', 'Llama 4 Scout (Premium)', 29.79, 39.32, 0.3575, FALSE),
('moonshotai/moonlight-16b-a3b-instruct', 'openrouter', 'Moonlight 16B', 10.83, 14.30, 0.1300, FALSE),
('moonshotai/kimi-vl-a3b-thinking', 'openrouter', 'Kimi VL Thinking', 43.33, 57.20, 0.5200, FALSE),
('minimax/minimax-m1', 'openrouter', 'MiniMax M1', 81.25, 107.25, 0.9750, FALSE),
('minimax/minimax-m1-40k', 'openrouter', 'MiniMax M1 40K', 81.25, 107.25, 0.9750, FALSE),
('nvidia/llama-3.1-nemotron-ultra-253b-v1', 'openrouter', 'Nemotron Ultra 253B', 303.33, 400.40, 3.6400, FALSE),
('nvidia/llama-3.3-nemotron-super-49b-v1', 'openrouter', 'Nemotron Super 49B (Premium)', 21.67, 28.60, 0.2600, FALSE),
('cohere/command-r-plus-08-2024', 'openrouter', 'Command R+', 677.08, 893.75, 8.1250, FALSE),
('cohere/command-r-08-2024', 'openrouter', 'Command R', 40.63, 53.63, 0.4875, FALSE),
('cohere/command-a', 'openrouter', 'Command A', 677.08, 893.75, 8.1250, FALSE),
('amazon/nova-pro-v1', 'openrouter', 'Amazon Nova Pro', 216.67, 286.00, 2.6000, FALSE),
('amazon/nova-lite-v1', 'openrouter', 'Amazon Nova Lite', 16.25, 21.45, 0.1950, FALSE),
('amazon/nova-micro-v1', 'openrouter', 'Amazon Nova Micro', 9.75, 12.87, 0.1170, FALSE),
('openai/chatgpt-4o-latest', 'openrouter', 'ChatGPT-4o Latest', 1083.33, 1430.00, 13.0000, FALSE),
('openai/o1', 'openrouter', 'OpenAI o1', 4062.50, 5362.50, 48.7500, FALSE),
('openai/o1-mini', 'openrouter', 'OpenAI o1 Mini', 812.50, 1072.50, 9.7500, FALSE),
('perplexity/sonar-pro', 'openrouter', 'Sonar Pro', 975.00, 1287.00, 11.7000, FALSE),
('perplexity/sonar', 'openrouter', 'Sonar', 108.33, 143.00, 1.3000, FALSE),
('perplexity/sonar-reasoning-pro', 'openrouter', 'Sonar Reasoning Pro', 541.67, 715.00, 6.5000, FALSE),
('ai21/jamba-1.6-large', 'openrouter', 'Jamba 1.6 Large', 541.67, 715.00, 6.5000, FALSE),
('ai21/jamba-1.6-mini', 'openrouter', 'Jamba 1.6 Mini', 32.50, 42.90, 0.3900, FALSE),
('together/deepseek-r1-turbo', 'openrouter', 'DeepSeek R1 Turbo', 148.42, 195.91, 1.7810, FALSE),
('inflection/inflection-3.5', 'openrouter', 'Inflection 3.5', 216.67, 286.00, 2.6000, FALSE),
('microsoft/wizardlm-2-8x22b', 'openrouter', 'WizardLM 2 8x22B', 70.42, 92.95, 0.8450, FALSE),
('nousresearch/hermes-3-llama-3.1-405b', 'openrouter', 'Hermes 3 405B', 86.67, 114.40, 1.0400, FALSE),
('openai/text-embedding-3-large', 'openrouter', 'Text Embedding 3 Large', 7.04, 9.29, 0.0845, FALSE),
('openai/text-embedding-3-small', 'openrouter', 'Text Embedding 3 Small', 1.08, 1.43, 0.0130, FALSE),
('cohere/embed-multilingual-v3.0', 'openrouter', 'Embed Multilingual V3', 5.42, 7.15, 0.0650, FALSE),
('huggingface/eva-qwen2.5-72b', 'openrouter', 'EVA Qwen 2.5 72B', 43.33, 57.20, 0.5200, FALSE),
-- Image/Video Gen via OpenRouter
('black-forest-labs/flux-1.1-pro', 'openrouter', 'FLUX 1.1 Pro', 216.67, 286.00, 2.6000, FALSE),
('black-forest-labs/flux-pro-1.1-ultra', 'openrouter', 'FLUX Pro Ultra', 325.00, 429.00, 3.9000, FALSE),
('black-forest-labs/flux-schnell', 'openrouter', 'FLUX Schnell', 16.25, 21.45, 0.1950, FALSE),
('seedance/seedance-1.0-turbo', 'openrouter', 'Seedance 1.0 Turbo', 216.67, 286.00, 2.6000, FALSE),
('kling-ai/kling-video-v2', 'openrouter', 'Kling Video V2', 270.83, 357.50, 3.2500, FALSE),
('kling-ai/kling-video-v2-master', 'openrouter', 'Kling Video V2 Master', 541.67, 715.00, 6.5000, FALSE),
('ideogram/ideogram-v3', 'openrouter', 'Ideogram V3', 216.67, 286.00, 2.6000, FALSE),
('recraft/recraft-v3', 'openrouter', 'Recraft V3', 216.67, 286.00, 2.6000, FALSE),
('stability/stable-diffusion-xl', 'openrouter', 'SDXL', 54.17, 71.50, 0.6500, FALSE),
('stability/sd3.5-large', 'openrouter', 'SD 3.5 Large', 352.08, 464.75, 4.2250, FALSE),
-- Fireworks
('accounts/fireworks/models/llama-v3p3-70b-instruct', 'fireworks', 'Llama 3.3 70B (Fireworks)', 21.67, 28.60, 0.2600, FALSE),
('accounts/fireworks/models/llama-v3p1-405b-instruct', 'fireworks', 'Llama 3.1 405B (Fireworks)', 325.00, 429.00, 3.9000, FALSE),
('accounts/fireworks/models/llama-v3p1-8b-instruct', 'fireworks', 'Llama 3.1 8B (Fireworks)', 10.83, 14.30, 0.1300, FALSE),
('accounts/fireworks/models/llama4-scout-instruct-basic', 'fireworks', 'Llama 4 Scout (Fireworks)', 40.63, 53.63, 0.4875, FALSE),
('accounts/fireworks/models/llama4-maverick-instruct-basic', 'fireworks', 'Llama 4 Maverick (Fireworks)', 59.58, 78.65, 0.7150, FALSE),
('accounts/fireworks/models/deepseek-v3', 'fireworks', 'DeepSeek V3 (Fireworks)', 43.33, 57.20, 0.5200, FALSE),
('accounts/fireworks/models/deepseek-r1', 'fireworks', 'DeepSeek R1 (Fireworks)', 173.33, 228.80, 2.0800, FALSE),
('accounts/fireworks/models/qwen3-235b-a22b', 'fireworks', 'Qwen 3 235B (Fireworks)', 81.25, 107.25, 0.9750, FALSE),
('accounts/fireworks/models/qwen3-30b-a3b', 'fireworks', 'Qwen 3 30B (Fireworks)', 21.67, 28.60, 0.2600, FALSE),
('accounts/fireworks/models/qwen2.5-72b-instruct', 'fireworks', 'Qwen 2.5 72B (Fireworks)', 54.17, 71.50, 0.6500, FALSE),
('accounts/fireworks/models/gemma3-27b-it', 'fireworks', 'Gemma 3 27B (Fireworks)', 16.25, 21.45, 0.1950, FALSE),
('accounts/fireworks/models/phi-4', 'fireworks', 'Phi-4 (Fireworks)', 10.83, 14.30, 0.1300, FALSE),
('accounts/fireworks/models/mistral-small-24b-instruct-2501', 'fireworks', 'Mistral Small 24B (Fireworks)', 21.67, 28.60, 0.2600, FALSE),
('accounts/fireworks/models/llama-v3p2-11b-vision-instruct', 'fireworks', 'Llama 3.2 11B Vision (Fireworks)', 10.83, 14.30, 0.1300, FALSE),
('accounts/fireworks/models/qwen2-vl-72b-instruct', 'fireworks', 'Qwen 2 VL 72B (Fireworks)', 54.17, 71.50, 0.6500, FALSE),
-- Fireworks (ReadyPI branded)
('readypi/llama-3.3-70b', 'fireworks', 'Llama 3.3 70B', 59.58, 78.65, 0.7150, FALSE),
('readypi/deepseek-v4-pro', 'fireworks', 'DeepSeek V4 Pro', 86.67, 114.40, 1.0400, FALSE),
('readypi/kimi-k2', 'fireworks', 'Kimi K2', 65.00, 85.80, 0.7800, FALSE),
-- Modal
('zai-org/GLM-5.1-FP8', 'modal', 'GLM 5.1 FP8', 43.33, 57.20, 0.5200, FALSE);

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
