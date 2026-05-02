const axios = require('axios');
const logger = require('../utils/logger');

// AWS SDK v3 for Bedrock
let BedrockRuntimeClient, InvokeModelCommand;
try {
  const bedrock = require('@aws-sdk/client-bedrock-runtime');
  BedrockRuntimeClient = bedrock.BedrockRuntimeClient;
  InvokeModelCommand = bedrock.InvokeModelCommand;
} catch (e) {
  logger.warn('AWS SDK not installed. Run: npm install @aws-sdk/client-bedrock-runtime');
}

/**
 * Route AI requests to appropriate provider
 */
class AIRouter {
  constructor() {
    this.providers = {
      groq: {
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GROQ_API_KEY,
        models: ['llama3-70b-8192', 'llama-3.1-70b-versatile']
      },
      google: {
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        apiKey: process.env.GOOGLE_API_KEY,
        models: ['gemini-1.5-flash', 'gemini-1.5-pro']
      },
      openai: {
        baseURL: 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY,
        models: ['gpt-4o', 'gpt-4o-mini']
      },
      anthropic: {
        baseURL: 'https://api.anthropic.com/v1',
        apiKey: process.env.ANTHROPIC_API_KEY,
        models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022']
      },
      deepseek: {
        baseURL: 'https://api.deepseek.com/v1',
        apiKey: process.env.DEEPSEEK_API_KEY,
        models: ['deepseek-chat']
      },
      mistral: {
        baseURL: 'https://api.mistral.ai/v1',
        apiKey: process.env.MISTRAL_API_KEY,
        models: ['mistral-small-latest']
      },
      openrouter: {
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY,
        models: [
          'google/gemini-2.5-flash:free',
          'meta-llama/llama-3.3-70b-instruct:free',
          'mistralai/mistral-nemo:free',
          'deepseek/deepseek-r1:free',
          'qwen/qwen-2.5-72b-instruct:free',
          'microsoft/phi-3-mini-128k-instruct:free'
        ]
      },
      vertex: {
        baseURL: 'https://us-central1-aiplatform.googleapis.com/v1',
        projectId: process.env.VERTEX_PROJECT_ID,
        location: process.env.VERTEX_LOCATION || 'us-central1',
        apiKey: process.env.VERTEX_API_KEY, // Either an API key or an access token
        models: [
          'gemini-1.5-pro',
          'gemini-1.5-flash',
          'claude-3-5-sonnet@20241022',
          'claude-3-5-haiku@20241022',
          'llama-3-405b-instruct'
        ]
      },
      modal: {
        baseURL: 'https://api.us-west-2.modal.direct/v1',
        apiKey: process.env.MODAL_API_KEY,
        models: ['zai-org/GLM-5.1-FP8']
      },
      bedrock: {
        region: process.env.AWS_REGION || 'us-east-1',
        models: [
          'anthropic.claude-3-5-sonnet-20241022-v2:0',
          'anthropic.claude-3-5-haiku-20241022-v1:0',
          'anthropic.claude-3-haiku-20240307-v1:0',
          'meta.llama3-1-70b-instruct-v1:0',
          'meta.llama3-1-8b-instruct-v1:0',
          'mistral.mistral-7b-instruct-v0:2',
          'mistral.mixtral-8x7b-instruct-v0:1',
          'amazon.titan-text-express-v1',
          'amazon.nova-micro-v1:0',
          'amazon.nova-lite-v1:0',
          'amazon.nova-pro-v1:0'
        ]
      }
    };
  }

  /**
   * Route request to appropriate provider
   */
  async routeRequest({ model, provider, messages, temperature, max_tokens, stream, ...otherParams }) {
    try {
      switch (provider) {
        case 'groq':
          return await this.callGroq({ model, messages, temperature, max_tokens, stream });
        
        case 'google':
          return await this.callGoogle({ model, messages, temperature, max_tokens });
        
        case 'openai':
          return await this.callOpenAI({ model, messages, temperature, max_tokens, stream });
        
        case 'anthropic':
          return await this.callAnthropic({ model, messages, temperature, max_tokens, stream });
        
        case 'deepseek':
          return await this.callDeepSeek({ model, messages, temperature, max_tokens, stream });
        
        case 'mistral':
          return await this.callMistral({ model, messages, temperature, max_tokens, stream });
        
        case 'openrouter':
          return await this.callOpenRouter({ model, messages, temperature, max_tokens, stream });
        
        case 'vertex':
          return await this.callVertex({ model, messages, temperature, max_tokens, stream });
        
        case 'modal':
          return await this.callModal({ model, messages, temperature, max_tokens, stream });
        
        case 'bedrock':
          return await this.callBedrock({ model, messages, temperature, max_tokens });
        
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      logger.error('AI routing error', {
        provider,
        model,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Call Groq API (Llama models)
   */
  async callGroq({ messages, temperature = 0.7, max_tokens = 1024 }) {
    const response = await axios.post(
      `${this.providers.groq.baseURL}/chat/completions`,
      {
        model: 'llama-3.1-70b-versatile',
        messages,
        temperature,
        max_tokens
      },
      {
        headers: {
          'Authorization': `Bearer ${this.providers.groq.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      content: response.data.choices[0].message.content,
      finish_reason: response.data.choices[0].finish_reason,
      usage: response.data.usage
    };
  }

  /**
   * Call Google AI (Gemini models)
   */
  async callGoogle({ messages, temperature = 0.7, max_tokens = 1024 }) {
    // Convert OpenAI format to Gemini format
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await axios.post(
      `${this.providers.google.baseURL}/models/gemini-1.5-flash:generateContent?key=${this.providers.google.apiKey}`,
      {
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: max_tokens
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const candidate = response.data.candidates[0];
    
    return {
      content: candidate.content.parts[0].text,
      finish_reason: candidate.finishReason,
      usage: {
        prompt_tokens: response.data.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.data.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.data.usageMetadata?.totalTokenCount || 0
      }
    };
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI({ model, messages, temperature = 0.7, max_tokens = 1024 }) {
    const modelMap = {
      'readypi/gpt4o': 'gpt-4o',
      'readypi/gpt4o-mini': 'gpt-4o-mini'
    };

    const response = await axios.post(
      `${this.providers.openai.baseURL}/chat/completions`,
      {
        model: modelMap[model] || 'gpt-4o-mini',
        messages,
        temperature,
        max_tokens
      },
      {
        headers: {
          'Authorization': `Bearer ${this.providers.openai.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      content: response.data.choices[0].message.content,
      finish_reason: response.data.choices[0].finish_reason,
      usage: response.data.usage
    };
  }

  /**
   * Call Anthropic API (Claude models)
   */
  async callAnthropic({ model, messages, temperature = 0.7, max_tokens = 1024 }) {
    const modelMap = {
      'readypi/claude-sonnet': 'claude-3-5-sonnet-20241022',
      'readypi/claude-haiku': 'claude-3-5-haiku-20241022'
    };

    // Extract system message if present
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const response = await axios.post(
      `${this.providers.anthropic.baseURL}/messages`,
      {
        model: modelMap[model] || 'claude-3-5-haiku-20241022',
        messages: userMessages,
        system: systemMessage?.content,
        temperature,
        max_tokens
      },
      {
        headers: {
          'x-api-key': this.providers.anthropic.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      content: response.data.content[0].text,
      finish_reason: response.data.stop_reason,
      usage: {
        prompt_tokens: response.data.usage.input_tokens,
        completion_tokens: response.data.usage.output_tokens,
        total_tokens: response.data.usage.input_tokens + response.data.usage.output_tokens
      }
    };
  }

  /**
   * Call DeepSeek API
   */
  async callDeepSeek({ messages, temperature = 0.7, max_tokens = 1024 }) {
    const response = await axios.post(
      `${this.providers.deepseek.baseURL}/chat/completions`,
      {
        model: 'deepseek-chat',
        messages,
        temperature,
        max_tokens
      },
      {
        headers: {
          'Authorization': `Bearer ${this.providers.deepseek.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      content: response.data.choices[0].message.content,
      finish_reason: response.data.choices[0].finish_reason,
      usage: response.data.usage
    };
  }

  /**
   * Call Mistral API
   */
  async callMistral({ messages, temperature = 0.7, max_tokens = 1024 }) {
    const response = await axios.post(
      `${this.providers.mistral.baseURL}/chat/completions`,
      {
        model: 'mistral-small-latest',
        messages,
        temperature,
        max_tokens
      },
      {
        headers: {
          'Authorization': `Bearer ${this.providers.mistral.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      content: response.data.choices[0].message.content,
      finish_reason: response.data.choices[0].finish_reason,
      usage: response.data.usage
    };
  }

  /**
   * Call OpenRouter API
   */
  async callOpenRouter({ model, messages, temperature = 0.7, max_tokens = 1024 }) {
    const modelMap = {
      'readypi/gemini-2.5-flash-free': 'google/gemini-2.0-flash-exp:free',
      'readypi/llama-3.3-70b-free': 'meta-llama/llama-3.3-70b-instruct:free',
      'readypi/mistral-nemo-free': 'mistralai/mistral-nemo:free',
      'readypi/deepseek-r1-free': 'deepseek/deepseek-r1:free',
      'readypi/qwen-2.5-72b-free': 'qwen/qwen-2.5-72b-instruct:free',
      'readypi/phi-3-mini-free': 'microsoft/phi-3-mini-128k-instruct:free'
    };

    const targetModel = modelMap[model] || 'google/gemini-2.0-flash-exp:free';

    const response = await axios.post(
      `${this.providers.openrouter.baseURL}/chat/completions`,
      {
        model: targetModel,
        messages,
        temperature,
        max_tokens
      },
      {
        headers: {
          'Authorization': `Bearer ${this.providers.openrouter.apiKey}`,
          'HTTP-Referer': 'https://readypi.io', // Optional, for including your app on openrouter.ai rankings.
          'X-Title': 'ReadyPi Gateway', // Optional. Shows in rankings on openrouter.ai.
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      content: response.data.choices[0].message.content,
      finish_reason: response.data.choices[0].finish_reason,
      usage: response.data.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }

  /**
   * Call Google Vertex AI API
   */
  async callVertex({ model, messages, temperature = 0.7, max_tokens = 1024 }) {
    const { projectId, location, apiKey } = this.providers.vertex;
    const modelMap = {
      'readypi/vertex-gemini-1.5-pro': 'gemini-1.5-pro',
      'readypi/vertex-gemini-1.5-flash': 'gemini-1.5-flash',
      'readypi/vertex-claude-sonnet': 'claude-3-5-sonnet@20241022',
      'readypi/vertex-claude-haiku': 'claude-3-5-haiku@20241022',
      'readypi/vertex-llama-405b': 'llama-3-405b-instruct'
    };

    const targetModel = modelMap[model] || model || 'gemini-1.5-flash';
    const isClaude = targetModel.includes('claude');
    
    // For Vertex AI Gemini API (using generateContent)
    if (!isClaude) {
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${targetModel}:generateContent`;
      
      const response = await axios.post(
        url,
        {
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens: max_tokens
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const candidate = response.data.candidates[0];
      return {
        content: candidate.content.parts[0].text,
        finish_reason: candidate.finishReason,
        usage: {
          prompt_tokens: response.data.usageMetadata?.promptTokenCount || 0,
          completion_tokens: response.data.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: response.data.usageMetadata?.totalTokenCount || 0
        }
      };
    } else {
      // For Vertex AI Anthropic API (Claude models)
      const systemMessage = messages.find(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role !== 'system');

      const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/anthropic/models/${targetModel}:streamRawPredict`;

      const response = await axios.post(
        url,
        {
          anthropic_version: "vertex-2023-10-16",
          messages: userMessages,
          system: systemMessage?.content,
          max_tokens: max_tokens,
          temperature: temperature,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.content?.[0]?.text || '',
        finish_reason: response.data.stop_reason,
        usage: {
          prompt_tokens: response.data.usage?.input_tokens || 0,
          completion_tokens: response.data.usage?.output_tokens || 0,
          total_tokens: (response.data.usage?.input_tokens || 0) + (response.data.usage?.output_tokens || 0)
        }
      };
    }
  }

  /**
   * Call Modal API (GLM-5.1 and other hosted models)
   * OpenAI-compatible format
   */
  async callModal({ model, messages, temperature = 0.7, max_tokens = 1024 }) {
    const modelMap = {
      'readypi/glm-5.1': 'zai-org/GLM-5.1-FP8'
    };

    const targetModel = modelMap[model] || 'zai-org/GLM-5.1-FP8';

    const response = await axios.post(
      `${this.providers.modal.baseURL}/chat/completions`,
      {
        model: targetModel,
        messages,
        temperature,
        max_tokens
      },
      {
        headers: {
          'Authorization': `Bearer ${this.providers.modal.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      content: response.data.choices[0].message.content,
      finish_reason: response.data.choices[0].finish_reason,
      usage: response.data.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }

  /**
   * Call AWS Bedrock (Claude, Llama, Mistral, Amazon Nova/Titan)
   * Uses AWS SDK v3 with credentials from ~/.aws/credentials
   */
  async callBedrock({ model, messages, temperature = 0.7, max_tokens = 1024 }) {
    if (!BedrockRuntimeClient) {
      throw new Error('AWS SDK not installed. Run: npm install @aws-sdk/client-bedrock-runtime');
    }

    const modelMap = {
      'readypi/bedrock-claude-sonnet': 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      'readypi/bedrock-claude-haiku': 'anthropic.claude-3-5-haiku-20241022-v1:0',
      'readypi/bedrock-claude-haiku-3': 'anthropic.claude-3-haiku-20240307-v1:0',
      'readypi/bedrock-llama-70b': 'meta.llama3-1-70b-instruct-v1:0',
      'readypi/bedrock-llama-8b': 'meta.llama3-1-8b-instruct-v1:0',
      'readypi/bedrock-mistral-7b': 'mistral.mistral-7b-instruct-v0:2',
      'readypi/bedrock-mixtral': 'mistral.mixtral-8x7b-instruct-v0:1',
      'readypi/bedrock-titan': 'amazon.titan-text-express-v1',
      'readypi/bedrock-nova-micro': 'amazon.nova-micro-v1:0',
      'readypi/bedrock-nova-lite': 'amazon.nova-lite-v1:0',
      'readypi/bedrock-nova-pro': 'amazon.nova-pro-v1:0',
    };

    const targetModel = modelMap[model] || model;
    const region = this.providers.bedrock.region;

    const client = new BedrockRuntimeClient({ region });

    // Anthropic Claude models use the Messages API format
    if (targetModel.startsWith('anthropic.')) {
      const systemMessage = messages.find(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role !== 'system');

      const body = JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        messages: userMessages.map(m => ({ role: m.role, content: m.content })),
        system: systemMessage?.content || '',
        max_tokens,
        temperature,
      });

      const command = new InvokeModelCommand({
        modelId: targetModel,
        contentType: 'application/json',
        accept: 'application/json',
        body,
      });

      const response = await client.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));

      return {
        content: result.content?.[0]?.text || '',
        finish_reason: result.stop_reason || 'stop',
        usage: {
          prompt_tokens: result.usage?.input_tokens || 0,
          completion_tokens: result.usage?.output_tokens || 0,
          total_tokens: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0),
        },
      };
    }

    // All other models (Llama, Mistral, Amazon Nova/Titan) use the Converse API
    const { ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
    
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role,
        content: [{ text: m.content }],
      }));

    const converseParams = {
      modelId: targetModel,
      messages: conversationMessages,
      inferenceConfig: {
        maxTokens: max_tokens,
        temperature,
      },
    };

    if (systemMessage) {
      converseParams.system = [{ text: systemMessage.content }];
    }

    const command = new ConverseCommand(converseParams);
    const response = await client.send(command);

    return {
      content: response.output?.message?.content?.[0]?.text || '',
      finish_reason: response.stopReason || 'stop',
      usage: {
        prompt_tokens: response.usage?.inputTokens || 0,
        completion_tokens: response.usage?.outputTokens || 0,
        total_tokens: (response.usage?.inputTokens || 0) + (response.usage?.outputTokens || 0),
      },
    };
  }
}

module.exports = new AIRouter();
