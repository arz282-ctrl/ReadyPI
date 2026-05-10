'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Terminal, Settings, SlidersHorizontal, Activity, ChevronLeft, Send, Zap, Database, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { chatAPI } from '@/lib/api'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens?: number
  cost?: number
  latency?: number
}

function PlaygroundContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant connected via ReadyPi.')
  const [chatInput, setChatInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [model, setModel] = useState('google/gemini-2.5-flash:free')
  const [temp, setTemp] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1024)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'user', content: 'Explain the benefits of using an API gateway.' },
    {
      role: 'assistant',
      content: 'An API gateway acts as a single entry point for all clients, abstracting the complexity of multiple backend microservices. It provides centralized routing, security (like rate limiting and authentication), and standardized logging. For AI specifically, a gateway like ReadyPi allows you to seamlessly fallback between providers (e.g., Anthropic to OpenAI) with zero code changes, while billing everything unified in your local currency.',
      tokens: 78,
      cost: 0.0468,
      latency: 0.4
    }
  ])

  useEffect(() => {
    const modelParam = searchParams.get('model')
    if (modelParam) {
      setModel(modelParam)
    }
  }, [searchParams])

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isSending) return
    
    const newUserMessage: Message = { role: 'user', content: chatInput }
    setMessages(prev => [...prev, newUserMessage])
    setChatInput('')
    setIsSending(true)

    try {
      const payload = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
          newUserMessage
        ],
        temperature: temp,
        max_tokens: maxTokens
      }

      const { data } = await chatAPI.playground(payload)
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.content,
        tokens: data.usage.total_tokens,
        cost: data.usage.cost_bdt,
        latency: data.latency_ms / 1000
      }])
    } catch (err) {
      console.error('Playground chat failed', err)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ ERROR: Failed to reach the AI gateway. Please ensure you have sufficient credits.' 
      }])
    } finally {
      setIsSending(false)
    }
  }, [chatInput, isSending, model, messages, systemPrompt, temp, maxTokens])

  return (
    <div className="min-h-screen bg-[#050508] text-gray-300 font-mono flex flex-col">
      {/* Top Nav */}
      <nav className="h-14 bg-[#0a0a0f] border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:text-white transition-colors">
            <ChevronLeft size={16} /> Back
          </Link>
          <div className="h-4 w-[1px] bg-gray-800"></div>
          <div className="flex items-center gap-2 text-white font-semibold font-technical">
            <Terminal size={16} className="text-[#FF4500]" /> Chat Playground
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-technical">
          <span className="text-gray-500">Balance: <span className="text-white font-bold">৳{user?.credits?.balance?.toLocaleString() || '0'}.00</span></span>
          <Link href="/billing" className="bg-[#FF4500]/10 text-[#FF4500] border border-[#FF4500]/30 px-3 py-1.5 rounded hover:bg-[#FF4500]/20 transition-all uppercase tracking-wider font-semibold">
            Top Up
          </Link>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative bg-[#0a0a0f]">
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded bg-[#0d1117] border border-gray-800 flex items-center justify-center shrink-0">
                    <span className="text-lg font-fraunces font-black text-[#FF4500]">π</span>
                  </div>
                )}
                <div className={`max-w-[80%] flex flex-col gap-2`}>
                  <div className={`p-4 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#1c1c24] text-white rounded-xl rounded-tr-sm border border-gray-800' : 'text-gray-300'}`}>
                    {msg.content}
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-4 text-[10px] text-gray-600 uppercase tracking-wider pl-2 font-technical">
                      <span className="flex items-center gap-1"><Zap size={10} /> {msg.tokens} tokens</span>
                      <span className="flex items-center gap-1"><Database size={10} /> Cost: ৳{msg.cost?.toFixed(4)}</span>
                      <span className="flex items-center gap-1"><Activity size={10} /> {msg.latency?.toFixed(1)}s</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-6 bg-[#0a0a0f] border-t border-gray-800">
            <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
              <textarea 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Message the model..."
                className="w-full bg-[#0d1117] border border-gray-800 rounded-xl pl-4 pr-14 py-4 text-sm text-white focus:outline-none focus:border-[#FF4500]/50 transition-colors resize-none min-h-[60px]"
                rows={1}
              />
              <button 
                type="submit" 
                disabled={isSending}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#FF4500]/10 text-[#FF4500] rounded hover:bg-[#FF4500]/20 transition-all disabled:opacity-50"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>
        </div>

        {/* Right Sidebar - Parameters */}
        <div className="w-80 bg-[#0d1117] border-l border-gray-800 flex flex-col overflow-y-auto">
          <div className="p-5 border-b border-gray-800 flex items-center gap-2 text-white font-semibold font-technical">
            <Settings size={16} /> Configuration
          </div>
          
          <div className="p-5 space-y-6">
            {/* Model Selector */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold flex items-center justify-between font-technical">
                Model
                <Link href="/models" className="text-[#FF4500] hover:underline normal-case tracking-normal">View all</Link>
              </label>
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-[#050508] border border-gray-800 rounded p-2 text-sm text-white focus:outline-none focus:border-[#FF4500]/50"
              >
                <optgroup label="★ Free Models (OpenRouter) — No Credits">
                  <option value="google/gemini-2.5-flash:free">Gemini 2.5 Flash</option>
                  <option value="google/gemini-2.5-flash-preview-05-20:free">Gemini 2.5 Flash Preview</option>
                  <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B</option>
                  <option value="meta-llama/llama-4-maverick:free">Llama 4 Maverick</option>
                  <option value="meta-llama/llama-4-scout:free">Llama 4 Scout</option>
                  <option value="meta-llama/llama-3.2-3b-instruct:free">Llama 3.2 3B</option>
                  <option value="meta-llama/llama-3.2-1b-instruct:free">Llama 3.2 1B</option>
                  <option value="deepseek/deepseek-r1:free">DeepSeek R1</option>
                  <option value="deepseek/deepseek-chat-v3-0324:free">DeepSeek V3 0324</option>
                  <option value="deepseek/deepseek-r1-0528:free">DeepSeek R1 0528</option>
                  <option value="qwen/qwen-2.5-72b-instruct:free">Qwen 2.5 72B</option>
                  <option value="qwen/qwen3-235b-a22b:free">Qwen 3 235B</option>
                  <option value="qwen/qwen3-32b:free">Qwen 3 32B</option>
                  <option value="qwen/qwen3-30b-a3b:free">Qwen 3 30B A3B</option>
                  <option value="qwen/qwen3-14b:free">Qwen 3 14B</option>
                  <option value="qwen/qwen3-4b:free">Qwen 3 4B</option>
                  <option value="qwen/qwen-2.5-vl-72b-instruct:free">Qwen 2.5 VL 72B</option>
                  <option value="qwen/qwen-2.5-coder-32b-instruct:free">Qwen 2.5 Coder 32B</option>
                  <option value="mistralai/mistral-nemo:free">Mistral Nemo</option>
                  <option value="mistralai/mistral-small-3.1-24b-instruct:free">Mistral Small 3.1 24B</option>
                  <option value="microsoft/phi-3-mini-128k-instruct:free">Phi-3 Mini 128K</option>
                  <option value="microsoft/phi-4-reasoning-plus:free">Phi-4 Reasoning Plus</option>
                  <option value="microsoft/phi-4:free">Phi-4</option>
                  <option value="microsoft/mai-ds-r1:free">MAI DS R1</option>
                  <option value="nvidia/llama-3.1-nemotron-70b-instruct:free">Nemotron 70B</option>
                  <option value="nvidia/llama-3.3-nemotron-super-49b-v1:free">Nemotron Super 49B</option>
                  <option value="google/gemma-3-27b-it:free">Gemma 3 27B</option>
                  <option value="google/gemma-3-12b-it:free">Gemma 3 12B</option>
                  <option value="google/gemma-3-4b-it:free">Gemma 3 4B</option>
                  <option value="google/gemma-3-1b-it:free">Gemma 3 1B</option>
                  <option value="rekaai/reka-flash-3:free">Reka Flash 3</option>
                  <option value="moonshotai/kimi-vl-a3b-thinking:free">Kimi VL A3B Thinking</option>
                  <option value="bytedance-research/ui-tars-72b:free">UI-TARS 72B</option>
                  <option value="open-r1/olympicarena-7b:free">OlympicArena 7B</option>
                  <option value="tngtech/deepseek-r1t-chimera:free">DeepSeek R1T Chimera</option>
                  <option value="allenai/olmo-2-0325-32b-instruct:free">OLMo 2 32B</option>
                  <option value="featherless/qwerky-72b:free">Qwerky 72B</option>
                  <option value="shisa-ai/shisa-v2-llama-3.3-70b:free">Shisa V2 70B</option>
                  <option value="thedrummer/rocinante-12b:free">Rocinante 12B</option>
                  <option value="cognitivecomputations/dolphin-3.0-r1-mistral-24b:free">Dolphin 3.0 R1 24B</option>
                  <option value="cognitivecomputations/dolphin-3.0-mistral-24b:free">Dolphin 3.0 24B</option>
                  <option value="sophosympatheia/rogue-rose-103b-v0.2:free">Rogue Rose 103B</option>
                  <option value="mancer/mythomist-7b:free">MythoMist 7B</option>
                  <option value="huggingface/meta-llama/llama-3.2-11b-vision-instruct:free">Llama 3.2 11B Vision</option>
                  <option value="all-hands/openhands-lm-32b-v0.1:free">OpenHands LM 32B</option>
                </optgroup>
                <optgroup label="OpenAI (Direct) — Uses Credits">
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo — ৳143/1M</option>
                  <option value="gpt-3.5-turbo-instruct">GPT-3.5 Turbo Instruct — ৳250/1M</option>
                  <option value="gpt-4">GPT-4 — ৳6,435/1M</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo — ৳2,860/1M</option>
                  <option value="gpt-4.1">GPT-4.1 — ৳715/1M</option>
                  <option value="gpt-4.1-mini">GPT-4.1 Mini — ৳143/1M</option>
                  <option value="gpt-4.1-nano">GPT-4.1 Nano — ৳36/1M</option>
                  <option value="gpt-4o">GPT-4o — ৳1,430/1M</option>
                  <option value="gpt-4o-mini">GPT-4o Mini — ৳54/1M</option>
                  <option value="gpt-4o-search-preview">GPT-4o Search — ৳894/1M</option>
                  <option value="gpt-4o-mini-search-preview">GPT-4o Mini Search — ৳54/1M</option>
                  <option value="gpt-5">GPT-5 — ৳5,363/1M</option>
                  <option value="gpt-5-mini">GPT-5 Mini — ৳1,073/1M</option>
                  <option value="gpt-5-nano">GPT-5 Nano — ৳358/1M</option>
                  <option value="gpt-5-pro">GPT-5 Pro — ৳8,580/1M</option>
                  <option value="gpt-5-codex">GPT-5 Codex — ৳5,363/1M</option>
                  <option value="gpt-5.1">GPT-5.1 — ৳5,363/1M</option>
                  <option value="gpt-5.1-codex">GPT-5.1 Codex — ৳5,363/1M</option>
                  <option value="gpt-5.1-codex-mini">GPT-5.1 Codex Mini — ৳1,073/1M</option>
                  <option value="gpt-5.2">GPT-5.2 — ৳5,363/1M</option>
                  <option value="gpt-5.4">GPT-5.4 — ৳5,363/1M</option>
                  <option value="gpt-5.4-mini">GPT-5.4 Mini — ৳1,073/1M</option>
                  <option value="gpt-5.4-nano">GPT-5.4 Nano — ৳179/1M</option>
                  <option value="gpt-5.5">GPT-5.5 — ৳5,363/1M</option>
                  <option value="o1">OpenAI o1 — ৳5,363/1M</option>
                  <option value="o1-pro">OpenAI o1 Pro — ৳53,625/1M</option>
                  <option value="o3">OpenAI o3 — ৳715/1M</option>
                  <option value="o3-mini">OpenAI o3 Mini — ৳393/1M</option>
                  <option value="o4-mini">OpenAI o4 Mini — ৳393/1M</option>
                  <option value="dall-e-3">DALL-E 3 — ৳286/1M</option>
                  <option value="dall-e-2">DALL-E 2 — ৳143/1M</option>
                  <option value="gpt-image">GPT Image — ৳215/1M</option>
                  <option value="whisper-1">Whisper-1 STT — ৳0.43/1M</option>
                  <option value="tts-1">TTS-1 — ৳1,073/1M</option>
                  <option value="tts-1-hd">TTS-1 HD — ৳2,145/1M</option>
                  <option value="gpt-4o-mini-tts">GPT-4o Mini TTS — ৳43/1M</option>
                </optgroup>
                <optgroup label="Google (Direct) — Uses Credits">
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash — ৳32/1M</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro — ৳447/1M</option>
                </optgroup>
                <optgroup label="Anthropic (Direct) — Uses Credits">
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet — ৳1,287/1M</option>
                  <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku — ৳343/1M</option>
                </optgroup>
                <optgroup label="DeepSeek (Direct) — Uses Credits">
                  <option value="deepseek-chat">DeepSeek Chat V3 — ৳43/1M</option>
                </optgroup>
                <optgroup label="Mistral (Direct) — Uses Credits">
                  <option value="mistral-small-latest">Mistral Small — ৳57/1M</option>
                </optgroup>
                <optgroup label="OpenAI via OpenRouter — Uses Credits">
                  <option value="openai/gpt-4.1">GPT-4.1 — ৳715/1M</option>
                  <option value="openai/gpt-4.1-mini">GPT-4.1 Mini — ৳143/1M</option>
                  <option value="openai/gpt-4.1-nano">GPT-4.1 Nano — ৳36/1M</option>
                  <option value="openai/o3">OpenAI o3 — ৳715/1M</option>
                  <option value="openai/o4-mini">OpenAI o4 Mini — ৳393/1M</option>
                  <option value="openai/o3-mini">OpenAI o3 Mini — ৳393/1M</option>
                  <option value="openai/o1">OpenAI o1 — ৳5,363/1M</option>
                  <option value="openai/o1-mini">OpenAI o1 Mini — ৳1,073/1M</option>
                  <option value="openai/chatgpt-4o-latest">ChatGPT-4o Latest — ৳1,430/1M</option>
                </optgroup>
                <optgroup label="Anthropic via OpenRouter — Uses Credits">
                  <option value="anthropic/claude-sonnet-4">Claude Sonnet 4 — ৳1,287/1M</option>
                  <option value="anthropic/claude-opus-4">Claude Opus 4 — ৳6,435/1M</option>
                  <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet v2 — ৳1,287/1M</option>
                  <option value="anthropic/claude-3-haiku">Claude 3 Haiku — ৳107/1M</option>
                  <option value="anthropic/claude-3-opus">Claude 3 Opus — ৳6,435/1M</option>
                </optgroup>
                <optgroup label="Google via OpenRouter — Uses Credits">
                  <option value="google/gemini-2.5-pro-preview-03-25">Gemini 2.5 Pro — ৳804/1M</option>
                  <option value="google/gemini-2.0-flash-001">Gemini 2.0 Flash — ৳36/1M</option>
                  <option value="google/gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash 05-20 — ৳54/1M</option>
                  <option value="google/gemini-2.0-flash-lite-001">Gemini 2.0 Flash Lite — ৳14/1M</option>
                </optgroup>
                <optgroup label="DeepSeek via OpenRouter — Uses Credits">
                  <option value="deepseek/deepseek-chat">DeepSeek V3 — ৳84/1M</option>
                  <option value="deepseek/deepseek-r1">DeepSeek R1 (Premium) — ৳214/1M</option>
                  <option value="deepseek/deepseek-prover-v2">DeepSeek Prover V2 — ৳214/1M</option>
                </optgroup>
                <optgroup label="Qwen via OpenRouter — Uses Credits">
                  <option value="qwen/qwen-2.5-72b-instruct">Qwen 2.5 72B (Premium) — ৳43/1M</option>
                  <option value="qwen/qwen3-235b-a22b">Qwen 3 235B (Premium) — ৳107/1M</option>
                  <option value="qwen/qwq-32b">QwQ 32B — ৳57/1M</option>
                  <option value="qwen/qwen3-8b">Qwen 3 8B — ৳9/1M</option>
                </optgroup>
                <optgroup label="Mistral via OpenRouter — Uses Credits">
                  <option value="mistralai/mistral-large">Mistral Large — ৳572/1M</option>
                  <option value="mistralai/mistral-medium-3">Mistral Medium 3 — ৳172/1M</option>
                  <option value="mistralai/codestral-2501">Codestral — ৳86/1M</option>
                  <option value="mistralai/pixtral-large-2411">Pixtral Large — ৳572/1M</option>
                </optgroup>
                <optgroup label="xAI via OpenRouter — Uses Credits">
                  <option value="x-ai/grok-3-mini-beta">Grok 3 Mini — ৳57/1M</option>
                  <option value="x-ai/grok-3-beta">Grok 3 — ৳1,287/1M</option>
                  <option value="x-ai/grok-2-vision-1212">Grok 2 Vision — ৳858/1M</option>
                </optgroup>
                <optgroup label="Meta Llama via OpenRouter — Uses Credits">
                  <option value="meta-llama/llama-3.1-405b-instruct">Llama 3.1 405B — ৳114/1M</option>
                  <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B — ৳57/1M</option>
                  <option value="meta-llama/llama-3.1-8b-instruct">Llama 3.1 8B — ৳7/1M</option>
                  <option value="meta-llama/llama-4-maverick">Llama 4 Maverick (Premium) — ৳57/1M</option>
                  <option value="meta-llama/llama-4-scout">Llama 4 Scout (Premium) — ৳39/1M</option>
                </optgroup>
                <optgroup label="NVIDIA via OpenRouter — Uses Credits">
                  <option value="nvidia/llama-3.1-nemotron-ultra-253b-v1">Nemotron Ultra 253B — ৳400/1M</option>
                  <option value="nvidia/llama-3.3-nemotron-super-49b-v1">Nemotron Super 49B (Premium) — ৳29/1M</option>
                </optgroup>
                <optgroup label="Cohere via OpenRouter — Uses Credits">
                  <option value="cohere/command-r-plus-08-2024">Command R+ — ৳894/1M</option>
                  <option value="cohere/command-r-08-2024">Command R — ৳54/1M</option>
                  <option value="cohere/command-a">Command A — ৳894/1M</option>
                </optgroup>
                <optgroup label="Amazon via OpenRouter — Uses Credits">
                  <option value="amazon/nova-pro-v1">Amazon Nova Pro — ৳286/1M</option>
                  <option value="amazon/nova-lite-v1">Amazon Nova Lite — ৳21/1M</option>
                  <option value="amazon/nova-micro-v1">Amazon Nova Micro — ৳13/1M</option>
                </optgroup>
                <optgroup label="Perplexity via OpenRouter — Uses Credits">
                  <option value="perplexity/sonar-pro">Sonar Pro — ৳1,287/1M</option>
                  <option value="perplexity/sonar">Sonar — ৳143/1M</option>
                  <option value="perplexity/sonar-reasoning-pro">Sonar Reasoning Pro — ৳715/1M</option>
                </optgroup>
                <optgroup label="Other via OpenRouter — Uses Credits">
                  <option value="moonshotai/moonlight-16b-a3b-instruct">Moonlight 16B — ৳14/1M</option>
                  <option value="moonshotai/kimi-vl-a3b-thinking">Kimi VL Thinking — ৳57/1M</option>
                  <option value="minimax/minimax-m1">MiniMax M1 — ৳107/1M</option>
                  <option value="minimax/minimax-m1-40k">MiniMax M1 40K — ৳107/1M</option>
                  <option value="ai21/jamba-1.6-large">Jamba 1.6 Large — ৳715/1M</option>
                  <option value="ai21/jamba-1.6-mini">Jamba 1.6 Mini — ৳43/1M</option>
                  <option value="together/deepseek-r1-turbo">DeepSeek R1 Turbo — ৳196/1M</option>
                  <option value="inflection/inflection-3.5">Inflection 3.5 — ৳286/1M</option>
                  <option value="microsoft/wizardlm-2-8x22b">WizardLM 2 8x22B — ৳93/1M</option>
                  <option value="nousresearch/hermes-3-llama-3.1-405b">Hermes 3 405B — ৳114/1M</option>
                  <option value="huggingface/eva-qwen2.5-72b">EVA Qwen 2.5 72B — ৳57/1M</option>
                </optgroup>
                <optgroup label="Embeddings via OpenRouter — Uses Credits">
                  <option value="openai/text-embedding-3-large">Text Embedding 3 Large — ৳9/1M</option>
                  <option value="openai/text-embedding-3-small">Text Embedding 3 Small — ৳1.4/1M</option>
                  <option value="cohere/embed-multilingual-v3.0">Embed Multilingual V3 — ৳7/1M</option>
                </optgroup>
                <optgroup label="Image/Video Gen via OpenRouter — Uses Credits">
                  <option value="black-forest-labs/flux-1.1-pro">FLUX 1.1 Pro — ৳286/1M</option>
                  <option value="black-forest-labs/flux-pro-1.1-ultra">FLUX Pro Ultra — ৳429/1M</option>
                  <option value="black-forest-labs/flux-schnell">FLUX Schnell — ৳21/1M</option>
                  <option value="seedance/seedance-1.0-turbo">Seedance 1.0 Turbo — ৳286/1M</option>
                  <option value="kling-ai/kling-video-v2">Kling Video V2 — ৳358/1M</option>
                  <option value="kling-ai/kling-video-v2-master">Kling Video V2 Master — ৳715/1M</option>
                  <option value="ideogram/ideogram-v3">Ideogram V3 — ৳286/1M</option>
                  <option value="recraft/recraft-v3">Recraft V3 — ৳286/1M</option>
                  <option value="stability/stable-diffusion-xl">SDXL — ৳72/1M</option>
                  <option value="stability/sd3.5-large">SD 3.5 Large — ৳465/1M</option>
                </optgroup>
                <optgroup label="Fireworks — Uses Credits">
                  <option value="accounts/fireworks/models/llama-v3p3-70b-instruct">Llama 3.3 70B — ৳29/1M</option>
                  <option value="accounts/fireworks/models/llama-v3p1-405b-instruct">Llama 3.1 405B — ৳429/1M</option>
                  <option value="accounts/fireworks/models/llama-v3p1-8b-instruct">Llama 3.1 8B — ৳14/1M</option>
                  <option value="accounts/fireworks/models/llama4-scout-instruct-basic">Llama 4 Scout — ৳54/1M</option>
                  <option value="accounts/fireworks/models/llama4-maverick-instruct-basic">Llama 4 Maverick — ৳79/1M</option>
                  <option value="accounts/fireworks/models/deepseek-v3">DeepSeek V3 — ৳57/1M</option>
                  <option value="accounts/fireworks/models/deepseek-r1">DeepSeek R1 — ৳229/1M</option>
                  <option value="accounts/fireworks/models/qwen3-235b-a22b">Qwen 3 235B — ৳107/1M</option>
                  <option value="accounts/fireworks/models/qwen3-30b-a3b">Qwen 3 30B — ৳29/1M</option>
                  <option value="accounts/fireworks/models/qwen2.5-72b-instruct">Qwen 2.5 72B — ৳72/1M</option>
                  <option value="accounts/fireworks/models/gemma3-27b-it">Gemma 3 27B — ৳21/1M</option>
                  <option value="accounts/fireworks/models/phi-4">Phi-4 — ৳14/1M</option>
                  <option value="accounts/fireworks/models/mistral-small-24b-instruct-2501">Mistral Small 24B — ৳29/1M</option>
                  <option value="accounts/fireworks/models/llama-v3p2-11b-vision-instruct">Llama 3.2 11B Vision — ৳14/1M</option>
                  <option value="accounts/fireworks/models/qwen2-vl-72b-instruct">Qwen 2 VL 72B — ৳72/1M</option>
                </optgroup>
                <optgroup label="ReadyPI Branded (Fireworks) — Uses Credits">
                  <option value="readypi/llama-3.3-70b">Llama 3.3 70B — ৳79/1M</option>
                  <option value="readypi/deepseek-v4-pro">DeepSeek V4 Pro — ৳114/1M</option>
                  <option value="readypi/kimi-k2">Kimi K2 — ৳86/1M</option>
                </optgroup>
                <optgroup label="Modal — Uses Credits">
                  <option value="zai-org/GLM-5.1-FP8">GLM 5.1 — ৳57/1M</option>
                </optgroup>
              </select>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold font-technical">System Prompt</label>
              <textarea 
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                className="w-full h-24 bg-[#050508] border border-gray-800 rounded p-3 text-xs text-gray-300 focus:outline-none focus:border-[#FF4500]/50 resize-none leading-relaxed"
              />
            </div>

            {/* Parameters */}
            <div className="space-y-6 pt-4 border-t border-gray-800">
              <div className="flex items-center gap-2 text-white font-semibold mb-2 font-technical">
                <SlidersHorizontal size={16} /> Parameters
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400 font-technical">
                  <span>Temperature</span>
                  <span className="text-white">{temp.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max="2" step="0.01" 
                  value={temp} onChange={e => setTemp(parseFloat(e.target.value))}
                  className="w-full accent-[#FF4500]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400 font-technical">
                  <span>Max Tokens</span>
                  <span className="text-white">{maxTokens}</span>
                </div>
                <input 
                  type="range" min="1" max="8192" step="1" 
                  value={maxTokens} onChange={e => setMaxTokens(parseInt(e.target.value))}
                  className="w-full accent-[#FF4500]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF4500]" size={32} />
      </div>
    }>
      <PlaygroundContent />
    </Suspense>
  )
}
