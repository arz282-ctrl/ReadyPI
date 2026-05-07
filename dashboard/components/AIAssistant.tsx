'use client'

/**
 * ReadyPI Native AI Assistant
 *
 * A floating chat widget powered by GPT-4o-mini via the /assistant/chat SSE endpoint.
 * Features:
 * - Real-time streaming (token-by-token)
 * - Markdown rendering (code blocks, bold, inline code)
 * - Suggested quick-prompt chips
 * - Auto-scroll to latest message
 * - Auth-aware (hidden when not logged in)
 * - Responsive: full-width on mobile, 400px on desktop
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Send, Minimize2, Maximize2, Sparkles,
  ChevronRight, RotateCcw, Loader2
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

// ─── Markdown Renderer ───────────────────────────────────────────────────────
// Lightweight inline markdown: code blocks, inline code, bold, newlines

function renderMarkdown(text: string) {
  const parts: React.ReactNode[] = []
  let remaining = text

  // Split on ```code blocks``` first
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(remaining)) !== null) {
    // Text before this block
    if (match.index > lastIndex) {
      parts.push(renderInline(remaining.slice(lastIndex, match.index), `pre-${lastIndex}`))
    }

    const lang = match[1] || 'text'
    const code = match[2].trim()
    parts.push(
      <div key={`code-${match.index}`} className="my-2 rounded-lg overflow-hidden border border-gray-700/60">
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d1117] border-b border-gray-700/60">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono">{lang}</span>
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="text-[10px] text-gray-500 hover:text-[#00ff88] transition-colors font-mono"
          >
            copy
          </button>
        </div>
        <pre className="p-3 bg-[#0a0a0f] text-[11px] font-mono text-[#e6edf3] overflow-x-auto leading-relaxed whitespace-pre-wrap">
          <code>{code}</code>
        </pre>
      </div>
    )
    lastIndex = match.index + match[0].length
  }

  // Remaining text after last code block
  if (lastIndex < remaining.length) {
    parts.push(renderInline(remaining.slice(lastIndex), `post-${lastIndex}`))
  }

  return parts.length ? parts : renderInline(text, 'all')
}

function renderInline(text: string, key: string): React.ReactNode {
  const lines = text.split('\n')
  return (
    <span key={key}>
      {lines.map((line, li) => {
        // Bold **text** and inline `code`
        const segments = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
        const rendered = segments.map((seg, si) => {
          if (seg.startsWith('`') && seg.endsWith('`')) {
            return (
              <code
                key={si}
                className="bg-[#161b22] border border-gray-700/50 rounded px-1.5 py-0.5 font-mono text-[11px] text-[#ff6b4a]"
              >
                {seg.slice(1, -1)}
              </code>
            )
          }
          if (seg.startsWith('**') && seg.endsWith('**')) {
            return <strong key={si} className="text-white font-semibold">{seg.slice(2, -2)}</strong>
          }
          return seg
        })
        return (
          <span key={li}>
            {rendered}
            {li < lines.length - 1 && <br />}
          </span>
        )
      })}
    </span>
  )
}

// ─── Suggested Prompts ───────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  'How do I get my first API key?',
  'Show me a Python quickstart example',
  'What free models are available?',
  'How do I top up with bKash?',
  'What\'s the difference between plans?',
  'How do I switch models in my code?',
]

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AIAssistant() {
  const { user, token } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi${user?.full_name ? ` ${user.full_name.split(' ')[0]}` : ''}! I'm the ReadyPI Assistant, powered by GPT-4o-mini.\n\nI know everything about the platform — API keys, models, pricing, code examples, and troubleshooting. What can I help you with?`
    }
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Auto-scroll on new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  // Greet with name when user loads
  useEffect(() => {
    if (user?.full_name) {
      setMessages([{
        role: 'assistant',
        content: `Hi ${user.full_name.split(' ')[0]}! I'm the ReadyPI Assistant, powered by GPT-4o-mini.\n\nI know everything about the platform — API keys, models, pricing, code examples, and troubleshooting. What can I help you with?`
      }])
    }
  }, [user?.full_name])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    const userMessage: Message = { role: 'user', content: text.trim() }
    const history = [...messages, userMessage]

    setMessages(prev => [
      ...prev,
      userMessage,
      { role: 'assistant', content: '', streaming: true }
    ])
    setInput('')
    setIsStreaming(true)

    abortRef.current = new AbortController()

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

      const response = await fetch(`${apiBase}/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.content }))
        }),
        signal: abortRef.current.signal
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || `Error ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          if (trimmed === 'data: [DONE]') {
            setMessages(prev => {
              const updated = [...prev]
              const last = updated[updated.length - 1]
              if (last?.streaming) {
                updated[updated.length - 1] = { ...last, streaming: false }
              }
              return updated
            })
            break
          }

          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6))
              if (json.error) throw new Error(json.error)

              if (json.delta) {
                accumulated += json.delta
                const snap = accumulated
                setMessages(prev => {
                  const updated = [...prev]
                  const last = updated[updated.length - 1]
                  if (last?.streaming) {
                    updated[updated.length - 1] = { ...last, content: snap }
                  }
                  return updated
                })
              }
            } catch {
              // Ignore chunk parse errors
            }
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        // User cancelled — leave message as-is
      } else {
        const msg = err instanceof Error ? err.message : 'Something went wrong.'
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last?.streaming) {
            updated[updated.length - 1] = {
              role: 'assistant',
              content: `⚠️ ${msg}\n\nPlease try again or contact support@readypi.io`,
              streaming: false
            }
          }
          return updated
        })
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
      inputRef.current?.focus()
    }
  }, [messages, isStreaming, token])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleReset = () => {
    if (isStreaming) {
      abortRef.current?.abort()
    }
    setMessages([{
      role: 'assistant',
      content: `Hi${user?.full_name ? ` ${user.full_name.split(' ')[0]}` : ''}! Fresh conversation started. How can I help you?`
    }])
    setInput('')
    setIsStreaming(false)
  }

  const handleStop = () => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setMessages(prev => {
      const updated = [...prev]
      const last = updated[updated.length - 1]
      if (last?.streaming) {
        updated[updated.length - 1] = { ...last, streaming: false }
      }
      return updated
    })
  }

  // Don't render if user is not logged in
  if (!user) return null

  const chatHeight = isExpanded ? 'h-[600px]' : 'h-[480px]'
  const chatWidth = isExpanded ? 'w-[480px]' : 'w-[380px]'

  return (
    <>
      {/* ── Floating Trigger Button ─────────────────────────────────────── */}
      <motion.button
        id="readypi-assistant-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[200] group"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open ReadyPI Assistant"
      >
        <div className="relative w-14 h-14">
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-[#ff6b4a]/30 animate-ping" />
          {/* Button */}
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#ff6b4a] to-[#c8381a] flex items-center justify-center shadow-[0_0_24px_rgba(255,107,74,0.5)]">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X size={20} className="text-white" />
                </motion.div>
              ) : (
                <motion.span key="pi" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }}
                  className="text-2xl font-black text-white leading-none" style={{ fontFamily: 'serif' }}>
                  π
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {/* Unread dot — shown when closed */}
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#00ff88] border-2 border-[#0a0a0f]" />
          )}
        </div>
      </motion.button>

      {/* ── Chat Window ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="readypi-assistant-panel"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={`fixed bottom-24 right-6 z-[200] ${chatWidth} ${chatHeight} flex flex-col rounded-2xl overflow-hidden border border-[#2a2a35] shadow-[0_24px_80px_rgba(0,0,0,0.6)] bg-[#0d1117]`}
            style={{ maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100vh - 120px)' }}
          >
            {/* ── Header ── */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#111118] to-[#0d1117] border-b border-[#1f1f2e]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6b4a] to-[#c8381a] flex items-center justify-center shadow-[0_0_12px_rgba(255,107,74,0.4)]">
                  <span className="text-sm font-black text-white" style={{ fontFamily: 'serif' }}>π</span>
                </div>
                <div>
                  <div className="text-white text-sm font-semibold leading-none">ReadyPI Assistant</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
                    <span className="text-[10px] text-gray-500 font-mono">GPT-4.1-mini · Live</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleReset}
                  title="New conversation"
                  className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Compact' : 'Expand'}
                  className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                >
                  {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a2a35 transparent' }}
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {/* Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff6b4a] to-[#c8381a] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_8px_rgba(255,107,74,0.3)]">
                      <span className="text-[10px] font-black text-white" style={{ fontFamily: 'serif' }}>π</span>
                    </div>
                  )}

                  <div className={`max-w-[88%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#ff6b4a]/15 border border-[#ff6b4a]/25 text-white rounded-tr-sm'
                          : 'bg-[#161b22] border border-[#2a2a35] text-gray-300 rounded-tl-sm'
                      }`}
                    >
                      {msg.content ? renderMarkdown(msg.content) : null}
                      {msg.streaming && (
                        <span className="inline-block w-0.5 h-3.5 bg-[#ff6b4a] animate-pulse ml-0.5 align-middle" />
                      )}
                    </div>
                  </div>

                  {/* User avatar */}
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] text-white font-bold">
                      {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── Suggested Prompts (shown when only the greeting is present) ── */}
            {messages.length === 1 && !isStreaming && (
              <div className="flex-shrink-0 px-4 pb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={10} className="text-[#ff6b4a]" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Quick questions</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(prompt)}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white bg-[#161b22] hover:bg-[#1f2937] border border-[#2a2a35] hover:border-[#ff6b4a]/30 rounded-full px-2.5 py-1 transition-all"
                    >
                      <ChevronRight size={9} className="text-[#ff6b4a]" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Input ── */}
            <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-[#1f1f2e] bg-[#0d1117]">
              <div className="flex items-end gap-2 bg-[#161b22] border border-[#2a2a35] rounded-xl px-3 py-2 focus-within:border-[#ff6b4a]/40 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about ReadyPI… (Enter to send)"
                  rows={1}
                  disabled={isStreaming}
                  className="flex-1 bg-transparent text-[12.5px] text-white placeholder-gray-600 outline-none resize-none font-mono leading-relaxed disabled:opacity-50"
                  style={{ maxHeight: '80px', overflowY: 'auto' }}
                />
                {isStreaming ? (
                  <button
                    onClick={handleStop}
                    className="flex-shrink-0 p-1.5 text-[#ff6b4a] hover:text-red-400 transition-colors"
                    title="Stop generation"
                  >
                    <Loader2 size={16} className="animate-spin" />
                  </button>
                ) : (
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim()}
                    className="flex-shrink-0 p-1.5 text-[#ff6b4a] hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={15} />
                  </button>
                )}
              </div>
              <div className="text-center mt-1.5 text-[9px] text-gray-600 font-mono">
                Powered by GPT-4.1-mini · ReadyPI Support
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
