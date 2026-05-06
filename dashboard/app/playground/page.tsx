'use client'

import { useState, useCallback, useEffect } from 'react'
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

export default function PlaygroundPage() {
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

  // Read model from URL query parameter on mount
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
                <optgroup label="Free Models — No Credits Required">
                  <option value="google/gemini-2.5-flash:free">Gemini 2.5 Flash (Free)</option>
                  <option value="google/gemini-2.5-flash-preview-05-20:free">Gemini 2.5 Flash Preview (Free)</option>
                  <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B (Free)</option>
                  <option value="deepseek/deepseek-r1:free">DeepSeek R1 (Free)</option>
                  <option value="mistralai/mistral-nemo:free">Mistral Nemo (Free)</option>
                  <option value="qwen/qwen-2.5-72b-instruct:free">Qwen 2.5 72B (Free)</option>
                  <option value="microsoft/phi-3-mini-128k-instruct:free">Phi-3 Mini (Free)</option>
                </optgroup>
                <optgroup label="DeepSeek">
                  <option value="deepseek/deepseek-chat">DeepSeek V3</option>
                  <option value="deepseek/deepseek-reasoner">DeepSeek R1 (Full)</option>
                </optgroup>
                <optgroup label="Groq">
                  <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B (Fastest)</option>
                  <option value="mixtral-8x7b">Mixtral 8x7B</option>
                </optgroup>
                <optgroup label="Google">
                  <option value="google/gemini-1.5-flash">Gemini 1.5 Flash (1M Context)</option>
                  <option value="google/gemini-1.5-pro">Gemini 1.5 Pro</option>
                </optgroup>
                <optgroup label="Anthropic">
                  <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                </optgroup>
                <optgroup label="AWS Bedrock — Amazon">
                  <option value="bedrock/nova-micro">Nova Micro (Fastest)</option>
                  <option value="bedrock/nova-lite">Nova Lite</option>
                  <option value="bedrock/nova-pro">Nova Pro</option>
                  <option value="bedrock/titan">Titan Express</option>
                </optgroup>
                <optgroup label="AWS Bedrock — Anthropic">
                  <option value="bedrock/claude-haiku-3">Claude 3 Haiku</option>
                  <option value="bedrock/claude-haiku">Claude 3.5 Haiku</option>
                  <option value="bedrock/claude-sonnet">Claude 3.5 Sonnet</option>
                </optgroup>
                <optgroup label="AWS Bedrock — Meta">
                  <option value="bedrock/llama-8b">Llama 3.1 8B</option>
                  <option value="bedrock/llama-70b">Llama 3.1 70B</option>
                </optgroup>
                <optgroup label="AWS Bedrock — Mistral">
                  <option value="bedrock/mistral-7b">Mistral 7B</option>
                  <option value="bedrock/mixtral">Mixtral 8x7B</option>
                </optgroup>
                <optgroup label="AWS Bedrock — Moonshot">
                  <option value="readypi/bedrock-moonshot.kimi-k2-thinking">Kimi K2 Thinking</option>
                </optgroup>
                <optgroup label="AWS Bedrock — MiniMax">
                  <option value="readypi/bedrock-minimax.m2">MiniMax M2</option>
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
