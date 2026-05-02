const express = require('express');
const router = express.Router();
const { verifyAPIKey, verifyJWT } = require('../middleware/auth');
const { apiKeyRateLimiter } = require('../middleware/rateLimit');
const aiRouter = require('../services/router');
const tokenizer = require('../services/tokenizer');
const db = require('../utils/db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /v1/chat/playground
 * Playground chat endpoint for logged-in users (JWT auth)
 */
router.post('/playground', verifyJWT, async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    const { model, messages, temperature, max_tokens } = req.body;

    // 1. Fetch user credit balance
    const creditResult = await db.query(
      'SELECT balance FROM credits WHERE user_id = $1',
      [req.user.id]
    );

    if (creditResult.rows.length === 0) {
      return res.status(404).json({ error: 'Credits not found' });
    }

    const currentBalance = parseInt(creditResult.rows[0].balance);

    // 2. Map frontend model names to backend model IDs if needed
    // In this case, we use the same names or map them
    const modelMap = {
      'meta-llama/llama-3-70b-instruct': 'readypi/llama',
      'google/gemini-1.5-flash': 'readypi/gemini-flash',
      'google/gemini-1.5-pro': 'readypi/gemini-pro',
      'anthropic/claude-3.5-sonnet': 'readypi/claude-sonnet',
      'mixtral-8x7b': 'readypi/mistral',
      'zai-org/glm-5.1': 'readypi/glm-5.1',
      // AWS Bedrock models
      'bedrock/nova-micro': 'readypi/bedrock-nova-micro',
      'bedrock/nova-lite': 'readypi/bedrock-nova-lite',
      'bedrock/nova-pro': 'readypi/bedrock-nova-pro',
      'bedrock/titan': 'readypi/bedrock-titan',
      'bedrock/llama-8b': 'readypi/bedrock-llama-8b',
      'bedrock/llama-70b': 'readypi/bedrock-llama-70b',
      'bedrock/mistral-7b': 'readypi/bedrock-mistral-7b',
      'bedrock/mixtral': 'readypi/bedrock-mixtral',
      'bedrock/claude-haiku-3': 'readypi/bedrock-claude-haiku-3',
      'bedrock/claude-haiku': 'readypi/bedrock-claude-haiku',
      'bedrock/claude-sonnet': 'readypi/bedrock-claude-sonnet',
    };

    const backendModel = modelMap[model] || model;

    // 3. Get pricing
    const pricingResult = await db.query(
      'SELECT * FROM model_pricing WHERE model_name = $1 AND is_active = true',
      [backendModel]
    );

    if (pricingResult.rows.length === 0) {
      return res.status(400).json({ error: `Model '${model}' not available` });
    }

    const modelPricing = pricingResult.rows[0];

    // 4. Estimate & Check credits
    // Pricing: minimum 5 BDT per request + 1 credit per 100 tokens
    // This ensures 50 free BDT lasts ~5-10 requests
    const promptTokens = tokenizer.countTokens(messages);
    const estimatedCredits = Math.max(5, Math.ceil((promptTokens + (max_tokens || 1000)) / 100));

    if (currentBalance < estimatedCredits) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    // 5. Route request
    const aiResponse = await aiRouter.routeRequest({
      model: backendModel,
      provider: modelPricing.provider,
      messages,
      temperature,
      max_tokens,
      stream: false
    });

    // 6. Calculate actual usage
    // Pricing: min 5 BDT + 1 credit per 100 tokens (50 BDT ≈ 5-10 requests)
    const completionTokens = aiResponse.usage?.completion_tokens || tokenizer.countTokens([{ role: 'assistant', content: aiResponse.content }]);
    const totalTokens = promptTokens + completionTokens;
    const creditsUsed = Math.max(5, Math.ceil(totalTokens / 100));
    const costBdt = creditsUsed; // 1 credit = 1 BDT

    // 7. Record usage & Deduct credits
    await db.transaction(async (client) => {
      await client.query(
        'UPDATE credits SET balance = balance - $1, total_used = total_used + $1 WHERE user_id = $2',
        [creditsUsed, req.user.id]
      );

      await client.query(
        `INSERT INTO usage_logs 
        (user_id, model, provider, prompt_tokens, completion_tokens, total_tokens, credits_used, cost_bdt, request_id, status, latency_ms)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [req.user.id, backendModel, modelPricing.provider, promptTokens, completionTokens, totalTokens, creditsUsed, costBdt, requestId, 'success', Date.now() - startTime]
      );
    });

    res.json({
      content: aiResponse.content,
      usage: {
        total_tokens: totalTokens,
        credits_used: creditsUsed,
        cost_bdt: costBdt
      },
      latency_ms: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Playground chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

/**
 * POST /v1/chat/completions
 * OpenAI-compatible chat completions endpoint
 * Routes to Groq, Google, OpenAI, Anthropic, etc.
 */
router.post('/completions', verifyAPIKey, apiKeyRateLimiter, async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    const { model, messages, stream = false, temperature, max_tokens, ...otherParams } = req.body;

    // Validate required fields
    if (!model) {
      return res.status(400).json({
        error: {
          message: 'Missing required parameter: model',
          type: 'invalid_request_error',
          code: 'missing_parameter'
        }
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Missing or invalid required parameter: messages',
          type: 'invalid_request_error',
          code: 'invalid_parameter'
        }
      });
    }

    // Get model pricing
    const pricingResult = await db.query(
      'SELECT * FROM model_pricing WHERE model_name = $1 AND is_active = true',
      [model]
    );

    if (pricingResult.rows.length === 0) {
      return res.status(400).json({
        error: {
          message: `Model '${model}' not found or not available`,
          type: 'invalid_request_error',
          code: 'model_not_found',
          available_models: [
            'readypi/deepseek',
            'readypi/llama',
            'readypi/gemini-flash',
            'readypi/gpt4o-mini',
            'readypi/claude-haiku',
            'readypi/mistral',
            'readypi/claude-sonnet',
            'readypi/gpt4o'
          ]
        }
      });
    }

    const modelPricing = pricingResult.rows[0];

    // Check if model is allowed on user's plan
    if (req.apiKey.planTier === 'free' && !modelPricing.is_free_tier) {
      return res.status(403).json({
        error: {
          message: `Model '${model}' is not available on the free plan. Upgrade to Starter (৳499/mo) to access all models.`,
          type: 'insufficient_quota',
          code: 'plan_upgrade_required',
          upgrade_url: 'https://readypi.io/pricing'
        }
      });
    }

    // Estimate prompt tokens
    const promptTokens = tokenizer.countTokens(messages);

    // Estimate credits needed (min 5 BDT + 1 per 100 tokens)
    const estimatedTotalTokens = promptTokens + (max_tokens || 1000);
    const estimatedCredits = Math.max(5, Math.ceil(estimatedTotalTokens / 100));

    // Check credit balance
    if (req.apiKey.creditBalance < estimatedCredits) {
      return res.status(402).json({
        error: {
          message: `Insufficient credits. Required: ${estimatedCredits}, Available: ${req.apiKey.creditBalance}`,
          type: 'insufficient_quota',
          code: 'insufficient_credits',
          credits_required: estimatedCredits,
          credits_available: req.apiKey.creditBalance,
          top_up_url: 'https://readypi.io/dashboard/credits'
        }
      });
    }

    // Route request to appropriate AI provider
    logger.info('Routing AI request', {
      requestId,
      model,
      provider: modelPricing.provider,
      userId: req.apiKey.userId,
      promptTokens
    });

    const aiResponse = await aiRouter.routeRequest({
      model,
      provider: modelPricing.provider,
      messages,
      temperature,
      max_tokens,
      stream,
      ...otherParams
    });

    // Calculate actual tokens used (min 5 BDT + 1 per 100 tokens)
    const completionTokens = aiResponse.usage?.completion_tokens || tokenizer.countTokens([{ role: 'assistant', content: aiResponse.content }]);
    const totalTokens = promptTokens + completionTokens;
    const creditsUsed = Math.max(5, Math.ceil(totalTokens / 100));
    const costBdt = creditsUsed; // 1 credit = 1 BDT

    // Deduct credits in transaction
    await db.transaction(async (client) => {
      // Deduct credits
      await client.query(
        'UPDATE credits SET balance = balance - $1, total_used = total_used + $1 WHERE user_id = $2',
        [creditsUsed, req.apiKey.userId]
      );

      // Log usage
      await client.query(
        `INSERT INTO usage_logs 
        (user_id, api_key_id, model, provider, prompt_tokens, completion_tokens, total_tokens, credits_used, cost_bdt, request_id, status, latency_ms)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          req.apiKey.userId,
          req.apiKey.id,
          model,
          modelPricing.provider,
          promptTokens,
          completionTokens,
          totalTokens,
          creditsUsed,
          costBdt,
          requestId,
          'success',
          Date.now() - startTime
        ]
      );
    });

    logger.info('AI request completed', {
      requestId,
      model,
      totalTokens,
      creditsUsed,
      costBdt,
      latency: Date.now() - startTime
    });

    // Return OpenAI-compatible response
    res.json({
      id: requestId,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: aiResponse.content
          },
          finish_reason: aiResponse.finish_reason || 'stop'
        }
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens
      },
      readypi: {
        credits_used: creditsUsed,
        cost_bdt: parseFloat(costBdt.toFixed(4)),
        credits_remaining: req.apiKey.creditBalance - creditsUsed,
        provider: modelPricing.provider
      }
    });

  } catch (error) {
    logger.error('Chat completion error', {
      requestId,
      error: error.message,
      stack: error.stack,
      userId: req.apiKey?.userId
    });

    // Log failed request
    if (req.apiKey) {
      await db.query(
        `INSERT INTO usage_logs 
        (user_id, api_key_id, model, provider, prompt_tokens, completion_tokens, total_tokens, credits_used, request_id, status, error_message, latency_ms)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          req.apiKey.userId,
          req.apiKey.id,
          req.body.model || 'unknown',
          'unknown',
          0,
          0,
          0,
          0,
          requestId,
          'error',
          error.message,
          Date.now() - startTime
        ]
      ).catch(err => logger.error('Failed to log error:', err));
    }

    res.status(500).json({
      error: {
        message: 'An error occurred while processing your request',
        type: 'api_error',
        code: 'internal_error',
        request_id: requestId
      }
    });
  }
});

/**
 * GET /v1/chat/models
 * List available models
 */
router.get('/models', verifyAPIKey, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT model_name, display_name, provider, cost_per_1m_tokens_bdt, is_free_tier
       FROM model_pricing
       WHERE is_active = true
       ORDER BY cost_per_1m_tokens_bdt`
    );

    const models = result.rows.map(row => ({
      id: row.model_name,
      name: row.display_name,
      provider: row.provider,
      pricing: {
        bdt_per_1m_tokens: parseFloat(row.cost_per_1m_tokens_bdt),
        free_tier: row.is_free_tier
      },
      available_on_plan: req.apiKey.planTier === 'free' ? row.is_free_tier : true
    }));

    res.json({
      object: 'list',
      data: models
    });
  } catch (error) {
    logger.error('Error fetching models:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch models',
        type: 'api_error'
      }
    });
  }
});

module.exports = router;
