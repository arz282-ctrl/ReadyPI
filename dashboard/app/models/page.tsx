'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Play, Filter, ChevronDown } from 'lucide-react'
import Navbar from '@/components/Navbar'

interface Model {
  id: string
  name: string
  provider: string
  via: string
  context: string
  promptPrice: number
  completionPrice: number
  latency: string
  isFree: boolean
  features: string[]
}

const models: Model[] = [
  // ─── FREE MODELS (OpenRouter :free) ───────────────────────────────────────
  { id: 'google/gemini-2.5-flash:free', name: 'Gemini 2.5 Flash', provider: 'Google', via: 'OpenRouter', context: '1M', promptPrice: 0, completionPrice: 0, latency: '0.3s', isFree: true, features: ['Text', 'Vision', 'Code'] },
  { id: 'google/gemini-2.5-flash-preview-05-20:free', name: 'Gemini 2.5 Flash Preview', provider: 'Google', via: 'OpenRouter', context: '1M', promptPrice: 0, completionPrice: 0, latency: '0.4s', isFree: true, features: ['Text', 'Vision'] },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', provider: 'Meta', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.3s', isFree: true, features: ['Text', 'Code'] },
  { id: 'meta-llama/llama-4-maverick:free', name: 'Llama 4 Maverick', provider: 'Meta', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.4s', isFree: true, features: ['Text', 'Vision'] },
  { id: 'meta-llama/llama-4-scout:free', name: 'Llama 4 Scout', provider: 'Meta', via: 'OpenRouter', context: '512K', promptPrice: 0, completionPrice: 0, latency: '0.3s', isFree: true, features: ['Text', 'Vision'] },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', provider: 'DeepSeek', via: 'OpenRouter', context: '64K', promptPrice: 0, completionPrice: 0, latency: '1.0s', isFree: true, features: ['Reasoning', 'Math', 'Code'] },
  { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3 0324', provider: 'DeepSeek', via: 'OpenRouter', context: '64K', promptPrice: 0, completionPrice: 0, latency: '0.5s', isFree: true, features: ['Text', 'Code'] },
  { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 0528', provider: 'DeepSeek', via: 'OpenRouter', context: '64K', promptPrice: 0, completionPrice: 0, latency: '1.2s', isFree: true, features: ['Reasoning', 'Code'] },
  { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B', provider: 'Qwen', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.4s', isFree: true, features: ['Text', 'Code'] },
  { id: 'qwen/qwen3-235b-a22b:free', name: 'Qwen 3 235B', provider: 'Qwen', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.5s', isFree: true, features: ['Text', 'Reasoning'] },
  { id: 'qwen/qwen3-32b:free', name: 'Qwen 3 32B', provider: 'Qwen', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.3s', isFree: true, features: ['Text', 'Code'] },
  { id: 'qwen/qwen3-30b-a3b:free', name: 'Qwen 3 30B A3B', provider: 'Qwen', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.3s', isFree: true, features: ['Text'] },
  { id: 'qwen/qwen-2.5-vl-72b-instruct:free', name: 'Qwen 2.5 VL 72B', provider: 'Qwen', via: 'OpenRouter', context: '32K', promptPrice: 0, completionPrice: 0, latency: '0.6s', isFree: true, features: ['Vision', 'Text'] },
  { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder 32B', provider: 'Qwen', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.3s', isFree: true, features: ['Code', 'Text'] },
  { id: 'mistralai/mistral-nemo:free', name: 'Mistral Nemo', provider: 'Mistral', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.3s', isFree: true, features: ['Text', 'Code'] },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1 24B', provider: 'Mistral', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.3s', isFree: true, features: ['Text', 'Vision'] },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini 128K', provider: 'Microsoft', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.2s', isFree: true, features: ['Text', 'Code'] },
  { id: 'microsoft/phi-4-reasoning-plus:free', name: 'Phi-4 Reasoning Plus', provider: 'Microsoft', via: 'OpenRouter', context: '32K', promptPrice: 0, completionPrice: 0, latency: '0.4s', isFree: true, features: ['Reasoning', 'Math'] },
  { id: 'microsoft/phi-4:free', name: 'Phi-4', provider: 'Microsoft', via: 'OpenRouter', context: '16K', promptPrice: 0, completionPrice: 0, latency: '0.2s', isFree: true, features: ['Text', 'Code'] },
  { id: 'microsoft/mai-ds-r1:free', name: 'MAI DS R1', provider: 'Microsoft', via: 'OpenRouter', context: '64K', promptPrice: 0, completionPrice: 0, latency: '0.5s', isFree: true, features: ['Reasoning'] },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct:free', name: 'Nemotron 70B', provider: 'NVIDIA', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.3s', isFree: true, features: ['Text', 'Code'] },
  { id: 'nvidia/llama-3.3-nemotron-super-49b-v1:free', name: 'Nemotron Super 49B', provider: 'NVIDIA', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.3s', isFree: true, features: ['Text', 'Code'] },
  { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', provider: 'Google', via: 'OpenRouter', context: '96K', promptPrice: 0, completionPrice: 0, latency: '0.3s', isFree: true, features: ['Text', 'Vision'] },
  { id: 'google/gemma-3-12b-it:free', name: 'Gemma 3 12B', provider: 'Google', via: 'OpenRouter', context: '96K', promptPrice: 0, completionPrice: 0, latency: '0.2s', isFree: true, features: ['Text'] },
  { id: 'google/gemma-3-4b-it:free', name: 'Gemma 3 4B', provider: 'Google', via: 'OpenRouter', context: '32K', promptPrice: 0, completionPrice: 0, latency: '0.1s', isFree: true, features: ['Text'] },
  { id: 'rekaai/reka-flash-3:free', name: 'Reka Flash 3', provider: 'Reka', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.4s', isFree: true, features: ['Text', 'Vision'] },
  { id: 'moonshotai/kimi-vl-a3b-thinking:free', name: 'Kimi VL A3B Thinking', provider: 'Moonshot', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.5s', isFree: true, features: ['Vision', 'Reasoning'] },
  { id: 'bytedance-research/ui-tars-72b:free', name: 'UI-TARS 72B', provider: 'ByteDance', via: 'OpenRouter', context: '32K', promptPrice: 0, completionPrice: 0, latency: '0.5s', isFree: true, features: ['Vision', 'UI'] },
  { id: 'open-r1/olympicarena-7b:free', name: 'OlympicArena 7B', provider: 'Open-R1', via: 'OpenRouter', context: '32K', promptPrice: 0, completionPrice: 0, latency: '0.2s', isFree: true, features: ['Reasoning', 'Math'] },
  { id: 'tngtech/deepseek-r1t-chimera:free', name: 'DeepSeek R1T Chimera', provider: 'TNG', via: 'OpenRouter', context: '64K', promptPrice: 0, completionPrice: 0, latency: '0.8s', isFree: true, features: ['Reasoning'] },
  { id: 'allenai/olmo-2-0325-32b-instruct:free', name: 'OLMo 2 32B', provider: 'AllenAI', via: 'OpenRouter', context: '32K', promptPrice: 0, completionPrice: 0, latency: '0.3s', isFree: true, features: ['Text'] },
  { id: 'featherless/qwerky-72b:free', name: 'Qwerky 72B', provider: 'Featherless', via: 'OpenRouter', context: '32K', promptPrice: 0, completionPrice: 0, latency: '0.4s', isFree: true, features: ['Text', 'Creative'] },
  { id: 'shisa-ai/shisa-v2-llama-3.3-70b:free', name: 'Shisa V2 70B', provider: 'ShisaAI', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.4s', isFree: true, features: ['Text', 'Multilingual'] },
  { id: 'thedrummer/rocinante-12b:free', name: 'Rocinante 12B', provider: 'TheDrummer', via: 'OpenRouter', context: '32K', promptPrice: 0, completionPrice: 0, latency: '0.2s', isFree: true, features: ['Text', 'Creative'] },

  // ─── GOOGLE (Direct) ──────────────────────────────────────────────────────
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', via: 'Direct', context: '1M', promptPrice: 0.15, completionPrice: 0.30, latency: '0.3s', isFree: false, features: ['Text', 'Vision', 'Tools'] },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', via: 'Direct', context: '1M', promptPrice: 1.25, completionPrice: 5.00, latency: '0.5s', isFree: false, features: ['Text', 'Vision', 'Tools'] },

  // ─── FIREWORKS (Llama, DeepSeek, Kimi — fast inference) ─────────────────
  { id: 'readypi/llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'Meta', via: 'Fireworks', context: '128K', promptPrice: 0.50, completionPrice: 0.60, latency: '0.2s', isFree: false, features: ['Text', 'Code', 'Fast'] },
  { id: 'readypi/deepseek-v4-pro', name: 'DeepSeek V4 Pro', provider: 'DeepSeek', via: 'Fireworks', context: '128K', promptPrice: 0.80, completionPrice: 0.80, latency: '0.3s', isFree: false, features: ['Text', 'Code', 'Reasoning'] },
  { id: 'readypi/kimi-k2', name: 'Kimi K2', provider: 'Moonshot', via: 'Fireworks', context: '128K', promptPrice: 0.60, completionPrice: 0.60, latency: '0.3s', isFree: false, features: ['Text', 'Code'] },

  // ─── OPENAI DIRECT — Full Tier 1 Catalog ────────────────────────────────
  // Rate limits (OpenAI Tier 1) converted: 1 ReadyPI credit = 1K tokens
  //
  // Model                   TPM      RPM    RPD     → credits/min capacity
  // gpt-4o-mini             200K     500    10K     → 200 cr/min
  // gpt-4.1-mini            200K     500    none    → 200 cr/min (no daily cap)
  // gpt-4.1                  30K     500    none    →  30 cr/min
  // gpt-4o                   30K     500    90K     →  30 cr/min
  // gpt-5                   500K     500    1.5M    → 500 cr/min
  // gpt-5-mini              500K     500    5M      → 500 cr/min
  // o3 / o4-mini            200K     500    2M      → 200 cr/min
  // o1                       30K     500    90K     →  30 cr/min

  // ── GPT-3.5 ──
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', via: 'Direct', context: '16K', promptPrice: 0.50, completionPrice: 1.50, latency: '0.2s', isFree: false, features: ['Text', 'Fast'] },
  { id: 'gpt-3.5-turbo-instruct', name: 'GPT-3.5 Turbo Instruct', provider: 'OpenAI', via: 'Direct', context: '4K', promptPrice: 1.50, completionPrice: 2.00, latency: '0.2s', isFree: false, features: ['Text', 'Fast'] },

  // ── GPT-4 ──
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', via: 'Direct', context: '8K', promptPrice: 30.00, completionPrice: 60.00, latency: '0.8s', isFree: false, features: ['Text', 'Vision', 'Tools'] },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 10.00, completionPrice: 30.00, latency: '0.7s', isFree: false, features: ['Text', 'Vision', 'Tools'] },

  // ── GPT-4.1 family (new) ──
  { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI', via: 'Direct', context: '1M', promptPrice: 2.00, completionPrice: 8.00, latency: '0.5s', isFree: false, features: ['Text', 'Vision', 'Tools'] },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI', via: 'Direct', context: '1M', promptPrice: 0.40, completionPrice: 1.60, latency: '0.3s', isFree: false, features: ['Text', 'Vision', 'Tools'] },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'OpenAI', via: 'Direct', context: '1M', promptPrice: 0.10, completionPrice: 0.40, latency: '0.2s', isFree: false, features: ['Text', 'Fast'] },

  // ── GPT-4o family ──
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 5.00, completionPrice: 15.00, latency: '0.6s', isFree: false, features: ['Text', 'Vision', 'Tools'] },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 0.15, completionPrice: 0.60, latency: '0.3s', isFree: false, features: ['Text', 'Vision'] },
  { id: 'gpt-4o-search-preview', name: 'GPT-4o Search Preview', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 2.50, completionPrice: 10.00, latency: '1.2s', isFree: false, features: ['Search', 'Text'] },
  { id: 'gpt-4o-mini-search-preview', name: 'GPT-4o Mini Search', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 0.15, completionPrice: 0.60, latency: '0.8s', isFree: false, features: ['Search', 'Text', 'Fast'] },

  // ── GPT-5 family ──
  { id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 15.00, completionPrice: 60.00, latency: '0.8s', isFree: false, features: ['Text', 'Vision', 'Tools', 'Reasoning'] },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 3.00, completionPrice: 12.00, latency: '0.5s', isFree: false, features: ['Text', 'Vision', 'Tools'] },
  { id: 'gpt-5-nano', name: 'GPT-5 Nano', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 1.00, completionPrice: 4.00, latency: '0.3s', isFree: false, features: ['Text', 'Fast'] },
  { id: 'gpt-5-pro', name: 'GPT-5 Pro', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 30.00, completionPrice: 90.00, latency: '1.2s', isFree: false, features: ['Text', 'Vision', 'Reasoning', 'Tools'] },
  { id: 'gpt-5-codex', name: 'GPT-5 Codex', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 15.00, completionPrice: 60.00, latency: '1.0s', isFree: false, features: ['Code', 'Reasoning', 'Text'] },
  { id: 'gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 15.00, completionPrice: 60.00, latency: '0.8s', isFree: false, features: ['Text', 'Vision', 'Tools', 'Reasoning'] },
  { id: 'gpt-5.1-codex', name: 'GPT-5.1 Codex', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 15.00, completionPrice: 60.00, latency: '1.0s', isFree: false, features: ['Code', 'Reasoning'] },
  { id: 'gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 3.00, completionPrice: 12.00, latency: '0.6s', isFree: false, features: ['Code', 'Fast'] },
  { id: 'gpt-5.2', name: 'GPT-5.2', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 15.00, completionPrice: 60.00, latency: '0.8s', isFree: false, features: ['Text', 'Vision', 'Tools', 'Reasoning'] },
  { id: 'gpt-5.4', name: 'GPT-5.4', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 15.00, completionPrice: 60.00, latency: '0.8s', isFree: false, features: ['Text', 'Vision', 'Tools', 'Reasoning'] },
  { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 3.00, completionPrice: 12.00, latency: '0.5s', isFree: false, features: ['Text', 'Vision', 'Fast'] },
  { id: 'gpt-5.4-nano', name: 'GPT-5.4 Nano', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 0.50, completionPrice: 2.00, latency: '0.3s', isFree: false, features: ['Text', 'Fast'] },
  { id: 'gpt-5.5', name: 'GPT-5.5', provider: 'OpenAI', via: 'Direct', context: '128K', promptPrice: 15.00, completionPrice: 60.00, latency: '0.8s', isFree: false, features: ['Text', 'Vision', 'Tools', 'Reasoning'] },

  // ── o-series Reasoning ──
  { id: 'o1', name: 'OpenAI o1', provider: 'OpenAI', via: 'Direct', context: '200K', promptPrice: 15.00, completionPrice: 60.00, latency: '3.0s', isFree: false, features: ['Reasoning', 'Math', 'Code'] },
  { id: 'o1-pro', name: 'OpenAI o1 Pro', provider: 'OpenAI', via: 'Direct', context: '200K', promptPrice: 150.00, completionPrice: 600.00, latency: '5.0s', isFree: false, features: ['Reasoning', 'Math', 'Code'] },
  { id: 'o3', name: 'OpenAI o3', provider: 'OpenAI', via: 'Direct', context: '200K', promptPrice: 2.00, completionPrice: 8.00, latency: '2.0s', isFree: false, features: ['Reasoning', 'Math', 'Code'] },
  { id: 'o3-mini', name: 'OpenAI o3 Mini', provider: 'OpenAI', via: 'Direct', context: '200K', promptPrice: 1.10, completionPrice: 4.40, latency: '1.2s', isFree: false, features: ['Reasoning', 'Code'] },
  { id: 'o4-mini', name: 'OpenAI o4 Mini', provider: 'OpenAI', via: 'Direct', context: '200K', promptPrice: 1.10, completionPrice: 4.40, latency: '1.0s', isFree: false, features: ['Reasoning', 'Code', 'Fast'] },

  // ── Image Generation ──
  { id: 'dall-e-3', name: 'DALL-E 3', provider: 'OpenAI', via: 'Direct', context: 'N/A', promptPrice: 4.00, completionPrice: 0, latency: '4.0s', isFree: false, features: ['Image Gen', 'HD'] },
  { id: 'dall-e-2', name: 'DALL-E 2', provider: 'OpenAI', via: 'Direct', context: 'N/A', promptPrice: 2.00, completionPrice: 0, latency: '3.0s', isFree: false, features: ['Image Gen'] },
  { id: 'gpt-image', name: 'GPT Image', provider: 'OpenAI', via: 'Direct', context: 'N/A', promptPrice: 3.00, completionPrice: 0, latency: '3.5s', isFree: false, features: ['Image Gen'] },

  // ── Audio / STT / TTS ──
  { id: 'whisper-1', name: 'Whisper-1 (STT)', provider: 'OpenAI', via: 'Direct', context: 'N/A', promptPrice: 0.006, completionPrice: 0, latency: '1.0s', isFree: false, features: ['Audio', 'STT'] },
  { id: 'tts-1', name: 'TTS-1', provider: 'OpenAI', via: 'Direct', context: 'N/A', promptPrice: 15.00, completionPrice: 0, latency: '0.5s', isFree: false, features: ['Audio', 'TTS'] },
  { id: 'tts-1-hd', name: 'TTS-1 HD', provider: 'OpenAI', via: 'Direct', context: 'N/A', promptPrice: 30.00, completionPrice: 0, latency: '0.8s', isFree: false, features: ['Audio', 'TTS', 'HD'] },
  { id: 'gpt-4o-mini-tts', name: 'GPT-4o Mini TTS', provider: 'OpenAI', via: 'Direct', context: 'N/A', promptPrice: 0.60, completionPrice: 0, latency: '0.3s', isFree: false, features: ['Audio', 'TTS', 'Fast'] },

  // ─── ANTHROPIC (Direct) ───────────────────────────────────────────────────
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', via: 'Direct', context: '200K', promptPrice: 3.00, completionPrice: 15.00, latency: '0.5s', isFree: false, features: ['Text', 'Vision', 'Tools'] },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'Anthropic', via: 'Direct', context: '200K', promptPrice: 0.80, completionPrice: 4.00, latency: '0.3s', isFree: false, features: ['Text', 'Vision'] },

  // ─── DEEPSEEK (Direct) ────────────────────────────────────────────────────
  { id: 'deepseek-chat', name: 'DeepSeek Chat V3', provider: 'DeepSeek', via: 'Direct', context: '64K', promptPrice: 0.20, completionPrice: 0.40, latency: '0.4s', isFree: false, features: ['Text', 'Code'] },

  // ─── MISTRAL (Direct) ─────────────────────────────────────────────────────
  { id: 'mistral-small-latest', name: 'Mistral Small', provider: 'Mistral', via: 'Direct', context: '32K', promptPrice: 0.20, completionPrice: 0.60, latency: '0.3s', isFree: false, features: ['Text', 'Code'] },

  // ─── OPENROUTER PREMIUM ───────────────────────────────────────────────────
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI', via: 'OpenRouter', context: '1M', promptPrice: 2.00, completionPrice: 8.00, latency: '0.5s', isFree: false, features: ['Text', 'Vision', 'Tools'] },
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI', via: 'OpenRouter', context: '1M', promptPrice: 0.40, completionPrice: 1.60, latency: '0.3s', isFree: false, features: ['Text', 'Vision'] },
  { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'OpenAI', via: 'OpenRouter', context: '1M', promptPrice: 0.10, completionPrice: 0.40, latency: '0.2s', isFree: false, features: ['Text', 'Fast'] },
  { id: 'openai/o3', name: 'OpenAI o3', provider: 'OpenAI', via: 'OpenRouter', context: '200K', promptPrice: 2.00, completionPrice: 8.00, latency: '2s', isFree: false, features: ['Reasoning', 'Math', 'Code'] },
  { id: 'openai/o4-mini', name: 'OpenAI o4 Mini', provider: 'OpenAI', via: 'OpenRouter', context: '200K', promptPrice: 1.10, completionPrice: 4.40, latency: '1.5s', isFree: false, features: ['Reasoning', 'Code'] },
  { id: 'openai/o3-mini', name: 'OpenAI o3 Mini', provider: 'OpenAI', via: 'OpenRouter', context: '200K', promptPrice: 1.10, completionPrice: 4.40, latency: '1.2s', isFree: false, features: ['Reasoning', 'Code'] },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', via: 'OpenRouter', context: '200K', promptPrice: 3.00, completionPrice: 15.00, latency: '0.5s', isFree: false, features: ['Text', 'Vision', 'Tools'] },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', provider: 'Anthropic', via: 'OpenRouter', context: '200K', promptPrice: 15.00, completionPrice: 75.00, latency: '1.0s', isFree: false, features: ['Text', 'Vision', 'Tools', 'Reasoning'] },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet v2', provider: 'Anthropic', via: 'OpenRouter', context: '200K', promptPrice: 3.00, completionPrice: 15.00, latency: '0.5s', isFree: false, features: ['Text', 'Vision', 'Tools'] },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', via: 'OpenRouter', context: '200K', promptPrice: 0.25, completionPrice: 1.25, latency: '0.2s', isFree: false, features: ['Text', 'Vision', 'Fast'] },
  { id: 'google/gemini-2.5-pro-preview-03-25', name: 'Gemini 2.5 Pro', provider: 'Google', via: 'OpenRouter', context: '1M', promptPrice: 1.25, completionPrice: 10.00, latency: '0.6s', isFree: false, features: ['Text', 'Vision', 'Tools', 'Reasoning'] },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google', via: 'OpenRouter', context: '1M', promptPrice: 0.10, completionPrice: 0.40, latency: '0.3s', isFree: false, features: ['Text', 'Vision'] },
  { id: 'google/gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash 05-20', provider: 'Google', via: 'OpenRouter', context: '1M', promptPrice: 0.15, completionPrice: 0.60, latency: '0.3s', isFree: false, features: ['Text', 'Vision', 'Code'] },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek', via: 'OpenRouter', context: '64K', promptPrice: 0.30, completionPrice: 0.88, latency: '0.4s', isFree: false, features: ['Text', 'Code'] },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (Premium)', provider: 'DeepSeek', via: 'OpenRouter', context: '64K', promptPrice: 0.80, completionPrice: 2.19, latency: '1.0s', isFree: false, features: ['Reasoning', 'Math'] },
  { id: 'deepseek/deepseek-prover-v2', name: 'DeepSeek Prover V2', provider: 'DeepSeek', via: 'OpenRouter', context: '64K', promptPrice: 0.80, completionPrice: 2.19, latency: '1.2s', isFree: false, features: ['Math', 'Reasoning'] },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B (Premium)', provider: 'Qwen', via: 'OpenRouter', context: '128K', promptPrice: 0.30, completionPrice: 0.30, latency: '0.4s', isFree: false, features: ['Text', 'Code'] },
  { id: 'qwen/qwen3-235b-a22b', name: 'Qwen 3 235B (Premium)', provider: 'Qwen', via: 'OpenRouter', context: '128K', promptPrice: 0.30, completionPrice: 1.20, latency: '0.5s', isFree: false, features: ['Text', 'Reasoning'] },
  { id: 'qwen/qwq-32b', name: 'QwQ 32B', provider: 'Qwen', via: 'OpenRouter', context: '128K', promptPrice: 0.20, completionPrice: 0.60, latency: '0.4s', isFree: false, features: ['Reasoning', 'Math'] },
  { id: 'qwen/qwen3-8b', name: 'Qwen 3 8B', provider: 'Qwen', via: 'OpenRouter', context: '128K', promptPrice: 0.03, completionPrice: 0.10, latency: '0.1s', isFree: false, features: ['Text', 'Fast'] },
  { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'Mistral', via: 'OpenRouter', context: '128K', promptPrice: 2.00, completionPrice: 6.00, latency: '0.5s', isFree: false, features: ['Text', 'Tools', 'Code'] },
  { id: 'mistralai/mistral-medium-3', name: 'Mistral Medium 3', provider: 'Mistral', via: 'OpenRouter', context: '128K', promptPrice: 0.40, completionPrice: 2.00, latency: '0.4s', isFree: false, features: ['Text', 'Code'] },
  { id: 'mistralai/codestral-2501', name: 'Codestral', provider: 'Mistral', via: 'OpenRouter', context: '256K', promptPrice: 0.30, completionPrice: 0.90, latency: '0.3s', isFree: false, features: ['Code', 'Text'] },
  { id: 'mistralai/pixtral-large-2411', name: 'Pixtral Large', provider: 'Mistral', via: 'OpenRouter', context: '128K', promptPrice: 2.00, completionPrice: 6.00, latency: '0.6s', isFree: false, features: ['Vision', 'Text'] },
  { id: 'x-ai/grok-3-mini-beta', name: 'Grok 3 Mini', provider: 'xAI', via: 'OpenRouter', context: '128K', promptPrice: 0.30, completionPrice: 0.50, latency: '0.4s', isFree: false, features: ['Text', 'Reasoning'] },
  { id: 'x-ai/grok-3-beta', name: 'Grok 3', provider: 'xAI', via: 'OpenRouter', context: '128K', promptPrice: 3.00, completionPrice: 15.00, latency: '0.6s', isFree: false, features: ['Text', 'Vision', 'Tools'] },
  { id: 'x-ai/grok-2-vision-1212', name: 'Grok 2 Vision', provider: 'xAI', via: 'OpenRouter', context: '32K', promptPrice: 2.00, completionPrice: 10.00, latency: '0.5s', isFree: false, features: ['Vision', 'Text'] },
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'Meta', via: 'OpenRouter', context: '128K', promptPrice: 0.80, completionPrice: 0.80, latency: '0.6s', isFree: false, features: ['Text', 'Code'] },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'Meta', via: 'OpenRouter', context: '128K', promptPrice: 0.40, completionPrice: 0.40, latency: '0.3s', isFree: false, features: ['Text', 'Code'] },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'Meta', via: 'OpenRouter', context: '128K', promptPrice: 0.05, completionPrice: 0.05, latency: '0.1s', isFree: false, features: ['Text', 'Fast'] },
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick (Premium)', provider: 'Meta', via: 'OpenRouter', context: '128K', promptPrice: 0.20, completionPrice: 0.60, latency: '0.3s', isFree: false, features: ['Text', 'Vision'] },
  { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout (Premium)', provider: 'Meta', via: 'OpenRouter', context: '512K', promptPrice: 0.15, completionPrice: 0.40, latency: '0.3s', isFree: false, features: ['Text', 'Vision'] },
  { id: 'moonshotai/moonlight-16b-a3b-instruct', name: 'Moonlight 16B', provider: 'Moonshot', via: 'OpenRouter', context: '8K', promptPrice: 0.10, completionPrice: 0.10, latency: '0.2s', isFree: false, features: ['Text', 'Code'] },
  { id: 'moonshotai/kimi-vl-a3b-thinking', name: 'Kimi VL Thinking', provider: 'Moonshot', via: 'OpenRouter', context: '128K', promptPrice: 0.20, completionPrice: 0.60, latency: '0.5s', isFree: false, features: ['Vision', 'Reasoning'] },
  { id: 'minimax/minimax-m1', name: 'MiniMax M1', provider: 'MiniMax', via: 'OpenRouter', context: '1M', promptPrice: 0.40, completionPrice: 1.10, latency: '0.5s', isFree: false, features: ['Text', 'Reasoning'] },
  { id: 'minimax/minimax-m1-40k', name: 'MiniMax M1 40K', provider: 'MiniMax', via: 'OpenRouter', context: '40K', promptPrice: 0.40, completionPrice: 1.10, latency: '0.4s', isFree: false, features: ['Text'] },
  { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', name: 'Nemotron Ultra 253B', provider: 'NVIDIA', via: 'OpenRouter', context: '128K', promptPrice: 2.40, completionPrice: 3.20, latency: '0.8s', isFree: false, features: ['Text', 'Code', 'Reasoning'] },
  { id: 'nvidia/llama-3.3-nemotron-super-49b-v1', name: 'Nemotron Super 49B (Premium)', provider: 'NVIDIA', via: 'OpenRouter', context: '128K', promptPrice: 0.10, completionPrice: 0.30, latency: '0.3s', isFree: false, features: ['Text', 'Code'] },
  { id: 'cohere/command-r-plus-08-2024', name: 'Command R+', provider: 'Cohere', via: 'OpenRouter', context: '128K', promptPrice: 2.50, completionPrice: 10.00, latency: '0.5s', isFree: false, features: ['Text', 'Tools', 'RAG'] },
  { id: 'cohere/command-r-08-2024', name: 'Command R', provider: 'Cohere', via: 'OpenRouter', context: '128K', promptPrice: 0.15, completionPrice: 0.60, latency: '0.3s', isFree: false, features: ['Text', 'RAG'] },
  { id: 'cohere/command-a', name: 'Command A', provider: 'Cohere', via: 'OpenRouter', context: '256K', promptPrice: 2.50, completionPrice: 10.00, latency: '0.5s', isFree: false, features: ['Text', 'Tools'] },
  { id: 'amazon/nova-pro-v1', name: 'Amazon Nova Pro', provider: 'Amazon', via: 'OpenRouter', context: '300K', promptPrice: 0.80, completionPrice: 3.20, latency: '0.5s', isFree: false, features: ['Text', 'Vision'] },
  { id: 'amazon/nova-lite-v1', name: 'Amazon Nova Lite', provider: 'Amazon', via: 'OpenRouter', context: '300K', promptPrice: 0.06, completionPrice: 0.24, latency: '0.3s', isFree: false, features: ['Text', 'Vision', 'Fast'] },
  { id: 'amazon/nova-micro-v1', name: 'Amazon Nova Micro', provider: 'Amazon', via: 'OpenRouter', context: '128K', promptPrice: 0.04, completionPrice: 0.14, latency: '0.2s', isFree: false, features: ['Text', 'Fast'] },

  // ─── FIREWORKS ─────────────────────────────────────────────────────────────
  { id: 'accounts/fireworks/models/llama-v3p3-70b-instruct', name: 'Llama 3.3 70B (Fireworks)', provider: 'Meta', via: 'Fireworks', context: '128K', promptPrice: 0.20, completionPrice: 0.20, latency: '0.2s', isFree: false, features: ['Text', 'Code', 'Fast'] },
  { id: 'accounts/fireworks/models/llama-v3p1-405b-instruct', name: 'Llama 3.1 405B (Fireworks)', provider: 'Meta', via: 'Fireworks', context: '128K', promptPrice: 3.00, completionPrice: 3.00, latency: '0.5s', isFree: false, features: ['Text', 'Code'] },
  { id: 'accounts/fireworks/models/llama-v3p1-8b-instruct', name: 'Llama 3.1 8B (Fireworks)', provider: 'Meta', via: 'Fireworks', context: '128K', promptPrice: 0.10, completionPrice: 0.10, latency: '0.1s', isFree: false, features: ['Text', 'Fast'] },
  { id: 'accounts/fireworks/models/llama4-scout-instruct-basic', name: 'Llama 4 Scout (Fireworks)', provider: 'Meta', via: 'Fireworks', context: '512K', promptPrice: 0.15, completionPrice: 0.60, latency: '0.3s', isFree: false, features: ['Text', 'Vision'] },
  { id: 'accounts/fireworks/models/llama4-maverick-instruct-basic', name: 'Llama 4 Maverick (Fireworks)', provider: 'Meta', via: 'Fireworks', context: '128K', promptPrice: 0.22, completionPrice: 0.88, latency: '0.3s', isFree: false, features: ['Text', 'Vision'] },
  { id: 'accounts/fireworks/models/deepseek-v3', name: 'DeepSeek V3 (Fireworks)', provider: 'DeepSeek', via: 'Fireworks', context: '64K', promptPrice: 0.20, completionPrice: 0.60, latency: '0.3s', isFree: false, features: ['Text', 'Code', 'Fast'] },
  { id: 'accounts/fireworks/models/deepseek-r1', name: 'DeepSeek R1 (Fireworks)', provider: 'DeepSeek', via: 'Fireworks', context: '64K', promptPrice: 0.80, completionPrice: 2.40, latency: '1.0s', isFree: false, features: ['Reasoning', 'Math'] },
  { id: 'accounts/fireworks/models/qwen3-235b-a22b', name: 'Qwen 3 235B (Fireworks)', provider: 'Qwen', via: 'Fireworks', context: '128K', promptPrice: 0.30, completionPrice: 1.20, latency: '0.5s', isFree: false, features: ['Text', 'Reasoning'] },
  { id: 'accounts/fireworks/models/qwen3-30b-a3b', name: 'Qwen 3 30B (Fireworks)', provider: 'Qwen', via: 'Fireworks', context: '128K', promptPrice: 0.10, completionPrice: 0.30, latency: '0.2s', isFree: false, features: ['Text', 'Fast'] },
  { id: 'accounts/fireworks/models/qwen2.5-72b-instruct', name: 'Qwen 2.5 72B (Fireworks)', provider: 'Qwen', via: 'Fireworks', context: '128K', promptPrice: 0.50, completionPrice: 0.50, latency: '0.3s', isFree: false, features: ['Text', 'Code'] },
  { id: 'accounts/fireworks/models/gemma3-27b-it', name: 'Gemma 3 27B (Fireworks)', provider: 'Google', via: 'Fireworks', context: '96K', promptPrice: 0.10, completionPrice: 0.20, latency: '0.2s', isFree: false, features: ['Text'] },
  { id: 'accounts/fireworks/models/phi-4', name: 'Phi-4 (Fireworks)', provider: 'Microsoft', via: 'Fireworks', context: '16K', promptPrice: 0.10, completionPrice: 0.10, latency: '0.1s', isFree: false, features: ['Text', 'Fast'] },
  { id: 'accounts/fireworks/models/mistral-small-24b-instruct-2501', name: 'Mistral Small 24B (Fireworks)', provider: 'Mistral', via: 'Fireworks', context: '32K', promptPrice: 0.10, completionPrice: 0.30, latency: '0.2s', isFree: false, features: ['Text', 'Code'] },

  // ─── MORE OPENROUTER PREMIUM ──────────────────────────────────────────────
  { id: 'perplexity/sonar-pro', name: 'Sonar Pro', provider: 'Perplexity', via: 'OpenRouter', context: '200K', promptPrice: 3.00, completionPrice: 15.00, latency: '0.8s', isFree: false, features: ['Search', 'Text'] },
  { id: 'perplexity/sonar', name: 'Sonar', provider: 'Perplexity', via: 'OpenRouter', context: '128K', promptPrice: 1.00, completionPrice: 1.00, latency: '0.5s', isFree: false, features: ['Search', 'Text'] },
  { id: 'perplexity/sonar-reasoning-pro', name: 'Sonar Reasoning Pro', provider: 'Perplexity', via: 'OpenRouter', context: '128K', promptPrice: 2.00, completionPrice: 8.00, latency: '1.0s', isFree: false, features: ['Search', 'Reasoning'] },
  { id: 'ai21/jamba-1.6-large', name: 'Jamba 1.6 Large', provider: 'AI21', via: 'OpenRouter', context: '256K', promptPrice: 2.00, completionPrice: 8.00, latency: '0.5s', isFree: false, features: ['Text', 'Code'] },
  { id: 'ai21/jamba-1.6-mini', name: 'Jamba 1.6 Mini', provider: 'AI21', via: 'OpenRouter', context: '256K', promptPrice: 0.20, completionPrice: 0.40, latency: '0.3s', isFree: false, features: ['Text'] },
  { id: 'together/deepseek-r1-turbo', name: 'DeepSeek R1 Turbo', provider: 'Together', via: 'OpenRouter', context: '64K', promptPrice: 0.55, completionPrice: 2.19, latency: '0.8s', isFree: false, features: ['Reasoning'] },
  { id: 'inflection/inflection-3.5', name: 'Inflection 3.5', provider: 'Inflection', via: 'OpenRouter', context: '128K', promptPrice: 0.80, completionPrice: 3.20, latency: '0.4s', isFree: false, features: ['Text', 'Creative'] },
  { id: 'microsoft/wizardlm-2-8x22b', name: 'WizardLM 2 8x22B', provider: 'Microsoft', via: 'OpenRouter', context: '65K', promptPrice: 0.65, completionPrice: 0.65, latency: '0.5s', isFree: false, features: ['Text', 'Code'] },
  { id: 'nousresearch/hermes-3-llama-3.1-405b', name: 'Hermes 3 405B', provider: 'Nous', via: 'OpenRouter', context: '128K', promptPrice: 0.80, completionPrice: 0.80, latency: '0.6s', isFree: false, features: ['Text', 'Tools'] },

  // ─── IMAGE / VIDEO / MULTIMODAL ───────────────────────────────────────────
  { id: 'black-forest-labs/flux-1.1-pro', name: 'FLUX 1.1 Pro', provider: 'BFL', via: 'OpenRouter', context: 'N/A', promptPrice: 4.00, completionPrice: 0, latency: '3s', isFree: false, features: ['Image Gen'] },
  { id: 'black-forest-labs/flux-pro-1.1-ultra', name: 'FLUX Pro Ultra', provider: 'BFL', via: 'OpenRouter', context: 'N/A', promptPrice: 6.00, completionPrice: 0, latency: '5s', isFree: false, features: ['Image Gen', 'HD'] },
  { id: 'black-forest-labs/flux-schnell', name: 'FLUX Schnell', provider: 'BFL', via: 'OpenRouter', context: 'N/A', promptPrice: 0.30, completionPrice: 0, latency: '1s', isFree: false, features: ['Image Gen', 'Fast'] },
  { id: 'seedance/seedance-1.0-turbo', name: 'Seedance 1.0 Turbo', provider: 'ByteDance', via: 'OpenRouter', context: 'N/A', promptPrice: 4.00, completionPrice: 0, latency: '30s', isFree: false, features: ['Video Gen'] },
  { id: 'kling-ai/kling-video-v2', name: 'Kling Video V2', provider: 'Kling', via: 'OpenRouter', context: 'N/A', promptPrice: 5.00, completionPrice: 0, latency: '60s', isFree: false, features: ['Video Gen'] },
  { id: 'kling-ai/kling-video-v2-master', name: 'Kling Video V2 Master', provider: 'Kling', via: 'OpenRouter', context: 'N/A', promptPrice: 10.00, completionPrice: 0, latency: '90s', isFree: false, features: ['Video Gen', 'HD'] },
  { id: 'ideogram/ideogram-v3', name: 'Ideogram V3', provider: 'Ideogram', via: 'OpenRouter', context: 'N/A', promptPrice: 4.00, completionPrice: 0, latency: '3s', isFree: false, features: ['Image Gen'] },
  { id: 'recraft/recraft-v3', name: 'Recraft V3', provider: 'Recraft', via: 'OpenRouter', context: 'N/A', promptPrice: 4.00, completionPrice: 0, latency: '3s', isFree: false, features: ['Image Gen'] },
  { id: 'stability/stable-diffusion-xl', name: 'SDXL', provider: 'Stability', via: 'OpenRouter', context: 'N/A', promptPrice: 1.00, completionPrice: 0, latency: '2s', isFree: false, features: ['Image Gen'] },
  { id: 'stability/sd3.5-large', name: 'SD 3.5 Large', provider: 'Stability', via: 'OpenRouter', context: 'N/A', promptPrice: 6.50, completionPrice: 0, latency: '4s', isFree: false, features: ['Image Gen', 'HD'] },

  // ─── EMBEDDING MODELS ─────────────────────────────────────────────────────
  { id: 'openai/text-embedding-3-large', name: 'Text Embedding 3 Large', provider: 'OpenAI', via: 'OpenRouter', context: '8K', promptPrice: 0.13, completionPrice: 0, latency: '0.1s', isFree: false, features: ['Embedding'] },
  { id: 'openai/text-embedding-3-small', name: 'Text Embedding 3 Small', provider: 'OpenAI', via: 'OpenRouter', context: '8K', promptPrice: 0.02, completionPrice: 0, latency: '0.1s', isFree: false, features: ['Embedding'] },
  { id: 'cohere/embed-multilingual-v3.0', name: 'Embed Multilingual V3', provider: 'Cohere', via: 'OpenRouter', context: '512', promptPrice: 0.10, completionPrice: 0, latency: '0.1s', isFree: false, features: ['Embedding', 'Multilingual'] },

  // ─── HUGGING FACE (via OpenRouter) ────────────────────────────────────────
  { id: 'huggingface/eva-qwen2.5-72b', name: 'EVA Qwen 2.5 72B', provider: 'Hugging Face', via: 'OpenRouter', context: '64K', promptPrice: 0.40, completionPrice: 0.40, latency: '0.5s', isFree: false, features: ['Text', 'Vision'] },

  // ─── MODAL ─────────────────────────────────────────────────────────────────
  { id: 'zai-org/GLM-5.1-FP8', name: 'GLM 5.1 FP8', provider: 'Zhipu', via: 'Modal', context: '128K', promptPrice: 0.40, completionPrice: 0.40, latency: '0.4s', isFree: false, features: ['Text', 'Code'] },

  // ─── ADDITIONAL CHEAP MODELS ──────────────────────────────────────────────
  { id: 'cognitivecomputations/dolphin-3.0-r1-mistral-24b:free', name: 'Dolphin 3.0 R1 24B', provider: 'CogComp', via: 'OpenRouter', context: '32K', promptPrice: 0, completionPrice: 0, latency: '0.3s', isFree: true, features: ['Text', 'Creative'] },
  { id: 'cognitivecomputations/dolphin-3.0-mistral-24b:free', name: 'Dolphin 3.0 24B', provider: 'CogComp', via: 'OpenRouter', context: '32K', promptPrice: 0, completionPrice: 0, latency: '0.3s', isFree: true, features: ['Text'] },
  { id: 'sophosympatheia/rogue-rose-103b-v0.2:free', name: 'Rogue Rose 103B', provider: 'Sophos', via: 'OpenRouter', context: '8K', promptPrice: 0, completionPrice: 0, latency: '0.6s', isFree: true, features: ['Creative', 'RP'] },
  { id: 'mancer/mythomist-7b:free', name: 'MythoMist 7B', provider: 'Mancer', via: 'OpenRouter', context: '32K', promptPrice: 0, completionPrice: 0, latency: '0.1s', isFree: true, features: ['Creative', 'Text'] },
  { id: 'huggingface/meta-llama/llama-3.2-11b-vision-instruct:free', name: 'Llama 3.2 11B Vision', provider: 'Hugging Face', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.3s', isFree: true, features: ['Vision', 'Text'] },
  { id: 'all-hands/openhands-lm-32b-v0.1:free', name: 'OpenHands LM 32B', provider: 'AllHands', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.4s', isFree: true, features: ['Code', 'Text'] },
  { id: 'google/gemma-3-1b-it:free', name: 'Gemma 3 1B', provider: 'Google', via: 'OpenRouter', context: '32K', promptPrice: 0, completionPrice: 0, latency: '0.1s', isFree: true, features: ['Text', 'Fast'] },
  { id: 'qwen/qwen3-14b:free', name: 'Qwen 3 14B', provider: 'Qwen', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.2s', isFree: true, features: ['Text'] },
  { id: 'qwen/qwen3-4b:free', name: 'Qwen 3 4B', provider: 'Qwen', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.1s', isFree: true, features: ['Text', 'Fast'] },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B', provider: 'Meta', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.1s', isFree: true, features: ['Text', 'Fast'] },
  { id: 'meta-llama/llama-3.2-1b-instruct:free', name: 'Llama 3.2 1B', provider: 'Meta', via: 'OpenRouter', context: '128K', promptPrice: 0, completionPrice: 0, latency: '0.1s', isFree: true, features: ['Text', 'Fast'] },

  // ─── MORE PREMIUM VIA OPENROUTER ──────────────────────────────────────────
  { id: 'openai/chatgpt-4o-latest', name: 'ChatGPT-4o Latest', provider: 'OpenAI', via: 'OpenRouter', context: '128K', promptPrice: 5.00, completionPrice: 15.00, latency: '0.6s', isFree: false, features: ['Text', 'Vision', 'Tools'] },
  { id: 'openai/o1', name: 'OpenAI o1', provider: 'OpenAI', via: 'OpenRouter', context: '200K', promptPrice: 15.00, completionPrice: 60.00, latency: '3s', isFree: false, features: ['Reasoning', 'Math', 'Code'] },
  { id: 'openai/o1-mini', name: 'OpenAI o1 Mini', provider: 'OpenAI', via: 'OpenRouter', context: '128K', promptPrice: 3.00, completionPrice: 12.00, latency: '1.5s', isFree: false, features: ['Reasoning', 'Code'] },
  { id: 'google/gemini-2.0-flash-lite-001', name: 'Gemini 2.0 Flash Lite', provider: 'Google', via: 'OpenRouter', context: '1M', promptPrice: 0.04, completionPrice: 0.15, latency: '0.2s', isFree: false, features: ['Text', 'Fast'] },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', via: 'OpenRouter', context: '200K', promptPrice: 15.00, completionPrice: 75.00, latency: '1.2s', isFree: false, features: ['Text', 'Vision', 'Reasoning'] },
  { id: 'accounts/fireworks/models/llama-v3p2-11b-vision-instruct', name: 'Llama 3.2 11B Vision (Fireworks)', provider: 'Meta', via: 'Fireworks', context: '128K', promptPrice: 0.10, completionPrice: 0.10, latency: '0.2s', isFree: false, features: ['Vision', 'Text'] },
  { id: 'accounts/fireworks/models/qwen2-vl-72b-instruct', name: 'Qwen 2 VL 72B (Fireworks)', provider: 'Qwen', via: 'Fireworks', context: '32K', promptPrice: 0.50, completionPrice: 0.50, latency: '0.5s', isFree: false, features: ['Vision', 'Text'] },
]

const providerOptions = [
  'All Providers', 'OpenAI', 'Anthropic', 'Google', 'Meta', 'DeepSeek', 'Qwen',
  'Mistral', 'NVIDIA', 'Microsoft', 'Moonshot', 'MiniMax', 'xAI', 'Cohere',
  'Perplexity', 'Amazon', 'ByteDance', 'Kling', 'Groq', 'Hugging Face', 'Stability', 'BFL',
]

const viaOptions = ['All Routes', 'Direct', 'OpenRouter', 'Fireworks', 'Modal']

const featureOptions = ['All', 'Text', 'Vision', 'Code', 'Reasoning', 'Tools', 'Image Gen', 'Video Gen', 'Embedding', 'Audio', 'TTS', 'STT', 'Fast', 'Creative', 'Search', 'RAG', 'HD']

export default function ModelsPage() {
  const [search, setSearch] = useState('')
  const [filterProvider, setFilterProvider] = useState('All Providers')
  const [filterVia, setFilterVia] = useState('All Routes')
  const [filterFeature, setFilterFeature] = useState('All')
  const [showFreeOnly, setShowFreeOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'context'>('name')

  const filteredModels = useMemo(() => {
    let result = models.filter(m => {
      if (filterProvider !== 'All Providers' && m.provider !== filterProvider) return false
      if (filterVia !== 'All Routes' && m.via !== filterVia) return false
      if (filterFeature !== 'All' && !m.features.includes(filterFeature)) return false
      if (showFreeOnly && !m.isFree) return false
      if (search) {
        const q = search.toLowerCase()
        return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q)
      }
      return true
    })

    if (sortBy === 'price') {
      result.sort((a, b) => a.promptPrice - b.promptPrice)
    } else if (sortBy === 'context') {
      const parseCtx = (c: string) => {
        if (c === 'N/A') return 0
        const num = parseFloat(c)
        if (c.includes('M')) return num * 1000
        return num
      }
      result.sort((a, b) => parseCtx(b.context) - parseCtx(a.context))
    }

    return result
  }, [search, filterProvider, filterVia, filterFeature, showFreeOnly, sortBy])

  const freeCount = models.filter(m => m.isFree).length
  const totalCount = models.length

  return (
    <div className="min-h-screen bg-[#050508] text-gray-300 font-mono">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-20 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[3px] text-[#ff6b4a] font-mono mb-3">
            <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
            {totalCount} Models Available
          </div>
          <h1 className="text-3xl sm:text-4xl font-fraunces font-black text-white mb-2 tracking-tight">AI Models Directory</h1>
          <p className="text-gray-500 text-sm max-w-xl">
            Compare {totalCount} language, vision, reasoning, and generative models. {freeCount} free models for instant testing.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-[#0a0a0f] border border-gray-800 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search models, providers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#0d1117] border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff6b4a]/50 transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Provider filter */}
              <select
                value={filterProvider}
                onChange={e => setFilterProvider(e.target.value)}
                className="bg-[#0d1117] border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff6b4a]/50 transition-colors cursor-pointer"
              >
                {providerOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              {/* Via filter */}
              <select
                value={filterVia}
                onChange={e => setFilterVia(e.target.value)}
                className="bg-[#0d1117] border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff6b4a]/50 transition-colors cursor-pointer"
              >
                {viaOptions.map(v => <option key={v} value={v}>{v}</option>)}
              </select>

              {/* Feature filter */}
              <select
                value={filterFeature}
                onChange={e => setFilterFeature(e.target.value)}
                className="bg-[#0d1117] border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff6b4a]/50 transition-colors cursor-pointer"
              >
                {featureOptions.map(f => <option key={f} value={f}>{f}</option>)}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'name' | 'price' | 'context')}
                className="bg-[#0d1117] border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff6b4a]/50 transition-colors cursor-pointer"
              >
                <option value="name">Sort: Default</option>
                <option value="price">Sort: Price Low→High</option>
                <option value="context">Sort: Context High→Low</option>
              </select>

              {/* Free toggle */}
              <button
                onClick={() => setShowFreeOnly(!showFreeOnly)}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                  showFreeOnly
                    ? 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]'
                    : 'bg-[#0d1117] border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Free ({freeCount})
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">
            Showing {filteredModels.length} of {totalCount} models
          </span>
        </div>

        {/* Table */}
        <div className="bg-[#0a0a0f] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[#0d1117] border-b border-gray-800 text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-5 font-semibold">Model</th>
                  <th className="py-3.5 px-4 font-semibold">Route</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Context</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Prompt $/1M</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Output $/1M</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Latency</th>
                  <th className="py-3.5 px-4 font-semibold">Capabilities</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-800/40">
                {filteredModels.map((model, i) => (
                  <tr key={`${model.id}-${i}`} className="hover:bg-[#12161e] transition-colors group">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${model.isFree ? 'bg-[#00ff88]' : 'bg-[#ff6b4a]'}`} />
                        <div>
                          <div className="text-white font-semibold flex items-center gap-2">
                            {model.name}
                            {model.isFree && <span className="bg-[#00ff88]/10 text-[#00ff88] text-[8px] px-1.5 py-0.5 rounded uppercase border border-[#00ff88]/20 font-bold">Free</span>}
                          </div>
                          <div className="text-[10px] text-gray-600 mt-0.5">{model.provider} &middot; {model.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-1 rounded border uppercase tracking-wider font-bold ${
                        model.via === 'Direct' ? 'bg-[#ff6b4a]/10 text-[#ff6b4a] border-[#ff6b4a]/20' :
                        model.via === 'OpenRouter' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        model.via === 'Fireworks' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>{model.via}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-300 font-medium">{model.context}</td>
                    <td className="py-3.5 px-4 text-right text-white">
                      {model.isFree ? <span className="text-[#00ff88]">Free</span> : `$${model.promptPrice.toFixed(2)}`}
                    </td>
                    <td className="py-3.5 px-4 text-right text-white">
                      {model.isFree ? <span className="text-[#00ff88]">Free</span> : model.completionPrice > 0 ? `$${model.completionPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center text-gray-400">{model.latency}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {model.features.map(f => (
                          <span key={f} className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                            f === 'Reasoning' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                            f === 'Vision' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                            f === 'Code' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            f === 'Image Gen' || f === 'Video Gen' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                            f === 'Fast' ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' :
                            f === 'Tools' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                            'bg-gray-800 text-gray-400 border-gray-700'
                          }`}>{f}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link 
                        href={`/playground?model=${encodeURIComponent(model.id)}`} 
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:text-[#ff6b4a] transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Play size={10} /> Test
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredModels.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No models found matching your filters.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-gray-600">
          Prices shown in USD per 1M tokens. Free models have zero cost on ReadyPI free tier.
          All models accessible via unified OpenAI-compatible API.
        </div>
      </main>
    </div>
  )
}
