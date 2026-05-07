'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { keysAPI, creditsAPI } from '@/lib/api'
import {
  Key, Plus, Trash2, Copy, Check, TerminalSquare, ChevronLeft,
  Loader2, LogOut, Rocket, ArrowRight, RefreshCw, Shield,
  ChevronDown, User, CreditCard, LayoutDashboard, Zap,
} from 'lucide-react'

// Dashboard components
import StatsCards from '@/components/dashboard/stats-cards'
import UsageChart from '@/components/dashboard/usage-chart'
import ModelDistribution from '@/components/dashboard/model-distribution'
import LogsTable from '@/components/dashboard/logs-table'

// ─── Types ──────────────────────────────────────────────────────────────────

interface APIKey {
  id: string
  name: string
  key_prefix: string
  created_at: string
  is_active: boolean
}

// ─── Empty State CTA ────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="bg-[#111118] border border-[#1f1f23] rounded-2xl p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#ff6b4a]/10 flex items-center justify-center mx-auto mb-6">
        <Rocket size={28} className="text-[#ff6b4a]" />
      </div>
      <h3 className="text-white text-xl font-bold mb-2">Start Integrating</h3>
      <p className="text-[#6b6b76] text-sm max-w-md mx-auto mb-6 leading-relaxed">
        Generate your first API key and make a request to see analytics, logs, and usage data here.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 bg-[#ff6b4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:shadow-[0_0_25px_rgba(255,107,74,0.3)] transition-all"
        >
          Read the Quickstart <ArrowRight size={16} />
        </Link>
        <Link
          href="/playground"
          className="inline-flex items-center gap-2 border border-[#1f1f23] text-white px-6 py-3 rounded-xl text-sm font-medium hover:border-[#ff6b4a]/30 transition-all"
        >
          <TerminalSquare size={16} /> Try the Playground
        </Link>
      </div>
      {/* Code example */}
      <div className="mt-8 max-w-lg mx-auto">
        <pre className="bg-[#0a0a0f] border border-[#1f1f23] rounded-xl p-4 text-left text-xs font-mono text-[#9b9ba8] overflow-x-auto">
          <code>{`curl https://api.readypi.io/v1/chat/completions \\
  -H "Authorization: Bearer rpi_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"model": "readypi/gemini-flash",
       "messages": [{"role":"user","content":"Hello!"}]}'`}</code>
        </pre>
      </div>
    </div>
  )
}

// ─── Key Modal ──────────────────────────────────────────────────────────────

function KeyModal({
  show, onClose, onSubmit, creating, newKey, newKeyName, setNewKeyName, onCopy, copied,
}: {
  show: boolean; onClose: () => void; onSubmit: (e: React.FormEvent) => void;
  creating: boolean; newKey: string | null; newKeyName: string;
  setNewKeyName: (v: string) => void; onCopy: () => void; copied: boolean;
}) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111118] border border-[#1f1f23] rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-[#1f1f23]">
          <h3 className="text-white font-bold text-lg">Generate API Key</h3>
          <p className="text-[11px] text-[#6b6b76] mt-1">Create a new key for API access</p>
        </div>

        {newKey ? (
          <div className="p-6 space-y-4">
            <div className="bg-[#ff6b4a]/10 border border-[#ff6b4a]/20 text-[#ff6b4a] p-4 rounded-xl text-sm flex items-start gap-2">
              <Shield size={16} className="mt-0.5 flex-shrink-0" />
              <span>Store this key securely. It will not be shown again.</span>
            </div>
            <div className="flex items-center gap-2 bg-[#0a0a0f] border border-[#1f1f23] p-3 rounded-xl">
              <code className="text-white flex-1 overflow-x-auto whitespace-nowrap text-xs font-mono">{newKey}</code>
              <button onClick={onCopy} className="p-2 text-[#6b6b76] hover:text-white bg-[#1f1f23] rounded-lg transition-colors flex-shrink-0">
                {copied ? <Check size={14} className="text-[#00ff88]" /> : <Copy size={14} />}
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-[#1f1f23] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#2a2a35] transition-colors"
            >
              I&apos;ve saved the key
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="p-6 space-y-5">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#6b6b76] block mb-2 font-medium">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="e.g. Production Backend"
                className="w-full bg-[#0a0a0f] border border-[#1f1f23] text-white py-3 px-4 rounded-xl outline-none focus:border-[#ff6b4a] text-sm font-mono transition-colors placeholder:text-[#4a4a56]"
                required
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 border border-[#1f1f23] text-[#9b9ba8] py-3 rounded-xl text-sm font-medium hover:text-white transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={creating || !newKeyName.trim()} className="flex-1 bg-[#ff6b4a] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#e55a3a] disabled:opacity-50 flex justify-center items-center gap-2 transition-colors">
                {creating ? <Loader2 size={14} className="animate-spin" /> : 'Generate'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export default function UserDashboard() {
  const router = useRouter()
  const { user, loading: authLoading, logout, refreshProfile } = useAuth()

  // Tab state
  const [tab, setTab] = useState<'overview' | 'keys' | 'logs'>('overview')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Key management
  const [keys, setKeys] = useState<APIKey[]>([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [creatingKey, setCreatingKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Analytics
  const [stats, setStats] = useState<any>(null)
  const [usage, setUsage] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingUsage, setLoadingUsage] = useState(true)
  const [usageTotal, setUsageTotal] = useState(0)
  const [usageOffset, setUsageOffset] = useState(0)
  const usageLimit = 25

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch data on mount
  useEffect(() => {
    if (user) {
      fetchKeys()
      fetchStats()
      fetchUsage(0)
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStats = async () => {
    try {
      setLoadingStats(true)
      const { data } = await creditsAPI.stats()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchUsage = async (offset: number) => {
    try {
      setLoadingUsage(true)
      const { data } = await creditsAPI.usage({ limit: usageLimit, offset })
      setUsage(data.usage || [])
      setUsageTotal(data.pagination?.total || 0)
      setUsageOffset(offset)
    } catch (err) {
      console.error('Failed to fetch usage', err)
    } finally {
      setLoadingUsage(false)
    }
  }

  const fetchKeys = async () => {
    try {
      setLoadingKeys(true)
      const { data } = await keysAPI.list()
      setKeys(data.keys || [])
    } catch (err) {
      console.error('Failed to fetch keys', err)
    } finally {
      setLoadingKeys(false)
    }
  }

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) return
    try {
      setCreatingKey(true)
      const { data } = await keysAPI.create(newKeyName.trim())
      setNewlyCreatedKey(data.key)
      setNewKeyName('')
      await fetchKeys()
      refreshProfile()
    } catch (err) {
      console.error('Failed to create key', err)
    } finally {
      setCreatingKey(false)
    }
  }

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Revoke this key? Applications using it will immediately fail.')) return
    try {
      await keysAPI.revoke(id)
      await fetchKeys()
      refreshProfile()
    } catch (err) {
      console.error('Failed to revoke key', err)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  // ─── Loading state ─────────────────────────────────────────────────────

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#ff6b4a]" size={36} />
      </div>
    )
  }

  // ─── Derived data ──────────────────────────────────────────────────────

  const hasData = stats?.last_30_days?.total_requests > 0
  const totalRequests = stats?.last_30_days?.total_requests || 0
  const totalTokens = stats?.last_30_days?.total_tokens || 0
  const avgLatency = stats?.last_30_days?.avg_latency_ms || 0
  const totalCostBdt = stats?.last_30_days?.total_cost_bdt || 0
  const modelBreakdown = stats?.model_breakdown || []
  const dailyUsage = stats?.daily_usage || []

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: <TerminalSquare size={14} /> },
    { id: 'keys' as const, label: 'API Keys', icon: <Key size={14} /> },
    { id: 'logs' as const, label: 'Logs', icon: <RefreshCw size={14} /> },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-300">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#1f1f23]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-[#6b6b76] hover:text-[#ff6b4a] text-xs transition-colors">
              <ChevronLeft size={14} /> Home
            </Link>
            <div className="h-4 w-px bg-[#1f1f23]" />
            <div className="flex items-center gap-2 text-white text-sm font-semibold">
              <TerminalSquare size={16} className="text-[#ff6b4a]" />
              Dashboard
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Credits pill */}
            <Link href="/billing" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff6b4a]/10 border border-[#ff6b4a]/20 hover:border-[#ff6b4a]/40 transition-all">
              <Zap size={12} className="text-[#ff6b4a]" />
              <span className="font-mono text-xs text-[#ff6b4a] font-semibold">{user.credits?.balance?.toLocaleString() || 0}</span>
            </Link>

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6b4a] to-[#c8381a] flex items-center justify-center text-white text-xs font-bold">
                  {user.full_name ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : user.email?.[0]?.toUpperCase() || '?'}
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#111118] border border-[#1f1f23] rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#1f1f23]">
                    <div className="text-sm text-white font-semibold truncate">{user.full_name || 'User'}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md bg-[#ff6b4a]/10 border border-[#ff6b4a]/20">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#ff6b4a] font-semibold">{user.plan_tier}</span>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                      <User size={15} /> Profile
                    </Link>
                    <Link href="/dashboard?tab=keys" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                      <Key size={15} /> API Keys
                    </Link>
                    <Link href="/pricing" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                      <CreditCard size={15} /> Billing
                    </Link>
                  </div>
                  <div className="border-t border-[#1f1f23] py-1">
                    <button
                      onClick={() => logout()}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors w-full text-left"
                    >
                      <LogOut size={15} /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Tabs ── */}
      <div className="border-b border-[#1f1f23] bg-[#0a0a0f]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex gap-1 -mb-px overflow-x-auto no-scrollbar">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? 'border-[#ff6b4a] text-[#ff6b4a]'
                    : 'border-transparent text-[#6b6b76] hover:text-white'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ═══ OVERVIEW TAB ═══ */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {!hasData && !loadingStats && (
              <div className="bg-[#111118] border border-[#1f1f23] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#ff6b4a]/10 flex items-center justify-center flex-shrink-0">
                    <Rocket size={18} className="text-[#ff6b4a]" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Get started</p>
                    <p className="text-[#6b6b76] text-xs">Generate an API key and make your first request to see live data.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href="/docs" className="inline-flex items-center gap-1.5 bg-[#ff6b4a] text-white px-4 py-2 rounded-lg text-xs font-bold hover:shadow-[0_0_20px_rgba(255,107,74,0.3)] transition-all">
                    Quickstart <ArrowRight size={12} />
                  </Link>
                  <Link href="/playground" className="inline-flex items-center gap-1.5 border border-[#1f1f23] text-white px-4 py-2 rounded-lg text-xs font-medium hover:border-[#ff6b4a]/30 transition-all">
                    <TerminalSquare size={12} /> Playground
                  </Link>
                </div>
              </div>
            )}

            <StatsCards
              totalRequests={totalRequests}
              totalTokens={totalTokens}
              avgLatency={avgLatency}
              totalCostBdt={totalCostBdt}
              dailyUsage={dailyUsage}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <UsageChart dailyUsage={dailyUsage} loading={loadingStats} />
              </div>
              <div>
                <ModelDistribution data={modelBreakdown} totalRequests={totalRequests} loading={loadingStats} />
              </div>
            </div>

            <LogsTable
              logs={usage}
              loading={loadingUsage}
              total={usageTotal}
              limit={usageLimit}
              offset={usageOffset}
              onPageChange={(newOffset) => fetchUsage(newOffset)}
            />
          </div>
        )}

        {/* ═══ API KEYS TAB ═══ */}
        {tab === 'keys' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-white text-lg font-bold">API Keys</h2>
                <p className="text-[#6b6b76] text-xs mt-0.5">Manage your gateway credentials</p>
              </div>
              <button
                onClick={() => { setNewlyCreatedKey(null); setShowKeyModal(true) }}
                className="inline-flex items-center gap-2 bg-[#ff6b4a] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#e55a3a] transition-colors"
              >
                <Plus size={16} /> Generate Key
              </button>
            </div>

            <KeyModal
              show={showKeyModal}
              onClose={() => { setShowKeyModal(false); setNewlyCreatedKey(null) }}
              onSubmit={handleCreateKey}
              creating={creatingKey}
              newKey={newlyCreatedKey}
              newKeyName={newKeyName}
              setNewKeyName={setNewKeyName}
              onCopy={() => newlyCreatedKey && handleCopy(newlyCreatedKey, 'newkey')}
              copied={copied === 'newkey'}
            />

            <div className="bg-[#111118] border border-[#1f1f23] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[#1f1f23] text-[10px] uppercase tracking-wider text-[#6b6b76]">
                      <th className="py-3 px-5 font-medium">Name</th>
                      <th className="py-3 px-5 font-medium">Key Prefix</th>
                      <th className="py-3 px-5 font-medium">Created</th>
                      <th className="py-3 px-5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {loadingKeys ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i} className="border-b border-[#1f1f23]">
                          {[...Array(4)].map((_, j) => (
                            <td key={j} className="py-4 px-5">
                              <div className="h-4 bg-[#1f1f23] rounded animate-pulse" style={{ width: `${40 + Math.random() * 40}%` }} />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : keys.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-[#6b6b76] text-sm">
                          No API keys yet. Generate one to get started.
                        </td>
                      </tr>
                    ) : (
                      keys.map(k => (
                        <tr key={k.id} className="border-b border-[#1f1f23]/60 hover:bg-[#ffffff04] transition-colors">
                          <td className="py-4 px-5 font-medium text-white">{k.name}</td>
                          <td className="py-4 px-5">
                            <div className="inline-flex items-center gap-2 bg-[#0a0a0f] border border-[#1f1f23] px-3 py-1.5 rounded-lg">
                              <code className="text-[#9b9ba8] text-xs font-mono">{k.key_prefix}••••••••</code>
                              <button onClick={() => handleCopy(k.key_prefix, k.id)} className="text-[#4a4a56] hover:text-[#ff6b4a] transition-colors">
                                {copied === k.id ? <Check size={12} className="text-[#00ff88]" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-[#6b6b76] text-xs font-mono">{new Date(k.created_at).toLocaleDateString()}</td>
                          <td className="py-4 px-5 text-right">
                            <button onClick={() => handleRevokeKey(k.id)} className="text-red-500/60 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors" title="Revoke">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ LOGS TAB ═══ */}
        {tab === 'logs' && (
          <LogsTable
            logs={usage}
            loading={loadingUsage}
            total={usageTotal}
            limit={usageLimit}
            offset={usageOffset}
            onPageChange={(newOffset) => fetchUsage(newOffset)}
          />
        )}
      </main>
    </div>
  )
}
