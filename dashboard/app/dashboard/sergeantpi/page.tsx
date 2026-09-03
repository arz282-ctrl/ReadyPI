'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Bot, Activity, Package, Cloud, RefreshCw, Loader2,
  ChevronLeft, AlertTriangle, CheckCircle2, XCircle,
  Cpu, Mail, Database, HardDrive, Zap, TrendingUp,
  ArrowRight, Terminal, BarChart3, Boxes,
} from 'lucide-react'
import { analyticsAPI, healthAPI, orchestrateAPI } from '@/lib/sergeantpi'

// ─── Types ──────────────────────────────────────────────────────────────────

interface AgentStat {
  calls: number
  totalTokens: number
  totalCost: number
  avgLatency: number
  errors: number
  lastUsed: string
}

interface Pipeline {
  id: string
  task: string
  trigger: string
  agents: string[]
  totalCost: number
  totalTokens: number
  status: 'success' | 'error'
  createdAt: string
}

interface InventoryItem {
  sku: string
  name: string
  quantity: number
  price: number
  supplier: string
  lastChecked: string
}

interface OverviewData {
  summary: {
    totalPipelines: number
    totalTokens: number
    totalCost: number
    totalErrors: number
    successRate: number
    activeAgents: number
  }
  agents: Record<string, AgentStat>
  dailyUsage: Array<{ date: string; pipelines: number; tokens: number; cost: number }>
  modelDistribution: Array<{ model: string; tokens: number; percentage: number }>
  recentPipelines: Pipeline[]
  inventory: {
    totalItems: number
    totalValue: number
    lowStockCount: number
    items: InventoryItem[]
  }
  aws: {
    region: string
    s3Bucket: string
    dynamoPrefix: string
    configured: boolean
  }
}

// ─── Agent metadata ─────────────────────────────────────────────────────────

const AGENT_META: Record<string, { color: string; icon: string; model: string }> = {
  hermes:   { color: '#ff6b4a', icon: '🧠', model: 'hermes-405b' },
  sentinel: { color: '#3b82f6', icon: '🛡️', model: 'claude-haiku' },
  herald:   { color: '#a855f7', icon: '📢', model: 'gemini-flash' },
  cortex:   { color: '#06b6d4', icon: '🔬', model: 'deepseek' },
  forge:    { color: '#22c55e', icon: '⚒️', model: 'llama-70b' },
  bedrock:  { color: '#f59e0b', icon: '☁️', model: 'aws-bedrock' },
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#111118] border border-[#1f1f23] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-[#6b6b76] font-medium">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-[#ff6b4a]/10 flex items-center justify-center text-[#ff6b4a]">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-[#6b6b76] mt-1">{sub}</div>}
    </div>
  )
}

// ─── Agent Card ─────────────────────────────────────────────────────────────

function AgentCard({ name, stat }: { name: string; stat: AgentStat }) {
  const meta = AGENT_META[name] || { color: '#888', icon: '🤖', model: 'unknown' }
  const successRate = stat.calls > 0 ? ((stat.calls - stat.errors) / stat.calls * 100).toFixed(0) : '100'

  return (
    <div className="bg-[#111118] border border-[#1f1f23] rounded-xl p-4 hover:border-[#2a2a35] transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-xl">{meta.icon}</div>
        <div>
          <div className="text-white font-semibold text-sm capitalize">{name}</div>
          <div className="text-[10px] text-[#6b6b76] font-mono">{meta.model}</div>
        </div>
        <div className="ml-auto">
          {stat.errors > 0 ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              {stat.errors} errors
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              healthy
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-white font-bold text-sm">{stat.calls}</div>
          <div className="text-[9px] text-[#6b6b76]">Calls</div>
        </div>
        <div>
          <div className="text-white font-bold text-sm">{(stat.totalTokens / 1000).toFixed(1)}k</div>
          <div className="text-[9px] text-[#6b6b76]">Tokens</div>
        </div>
        <div>
          <div className="text-white font-bold text-sm">{successRate}%</div>
          <div className="text-[9px] text-[#6b6b76]">Success</div>
        </div>
      </div>
    </div>
  )
}

// ─── Mini bar chart (pure CSS) ──────────────────────────────────────────────

function MiniBarChart({ data, valueKey }: { data: Array<Record<string, any>>; valueKey: string }) {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1)
  return (
    <div className="flex items-end gap-[2px] h-16">
      {data.map((d, i) => {
        const h = Math.max(((d[valueKey] || 0) / max) * 100, 2)
        return (
          <div
            key={i}
            className="flex-1 rounded-t bg-[#ff6b4a]/60 hover:bg-[#ff6b4a] transition-colors min-w-[3px]"
            style={{ height: `${h}%` }}
            title={`${d.date}: ${d[valueKey]}`}
          />
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function SergeantPIDashboard() {
  const [tab, setTab] = useState<'overview' | 'agents' | 'inventory' | 'pipelines'>('overview')
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(false)

  // Quick-run state
  const [taskInput, setTaskInput] = useState('')
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Health check
      const healthRes = await healthAPI.check()
      setOnline(healthRes.data.status === 'ok')

      // Analytics
      const { data: overview } = await analyticsAPI.overview()
      setData(overview)
    } catch (err: any) {
      setOnline(false)
      setError(err.message?.includes('ECONNREFUSED')
        ? 'SergeantPI is not running. Start it with: npm start'
        : err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleQuickRun = async () => {
    if (!taskInput.trim()) return
    setRunning(true)
    setRunResult(null)
    try {
      const { data: result } = await orchestrateAPI.run(taskInput)
      setRunResult(`Pipeline complete — ${result.results?.length || 0} agents, ${result.totalTokens} tokens`)
      fetchData() // Refresh analytics
    } catch (err: any) {
      setRunResult(`Error: ${err.response?.data?.error || err.message}`)
    } finally {
      setRunning(false)
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#ff6b4a] mx-auto mb-3" size={32} />
          <p className="text-[#6b6b76] text-sm">Connecting to SergeantPI...</p>
        </div>
      </div>
    )
  }

  // ─── Offline ──────────────────────────────────────────────────────────────

  if (!online || error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-[#111118] border border-[#1f1f23] rounded-2xl p-8 text-center max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="text-red-400" size={28} />
          </div>
          <h2 className="text-white text-lg font-bold mb-2">SergeantPI Offline</h2>
          <p className="text-[#6b6b76] text-sm mb-4">{error || 'Cannot reach SergeantPI server.'}</p>
          <pre className="bg-[#0a0a0f] border border-[#1f1f23] rounded-xl p-3 text-left text-xs font-mono text-[#9b9ba8] mb-4">
            cd sergeantpi{'\n'}npm start
          </pre>
          <button onClick={fetchData} className="inline-flex items-center gap-2 bg-[#ff6b4a] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#e55a3a] transition-colors">
            <RefreshCw size={14} /> Retry Connection
          </button>
        </div>
      </div>
    )
  }

  const d = data!
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: <BarChart3 size={14} /> },
    { id: 'agents' as const, label: 'Agents', icon: <Bot size={14} /> },
    { id: 'inventory' as const, label: 'Inventory', icon: <Boxes size={14} /> },
    { id: 'pipelines' as const, label: 'Pipelines', icon: <Activity size={14} /> },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-300">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#1f1f23]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-[#6b6b76] hover:text-[#ff6b4a] text-xs transition-colors">
              <ChevronLeft size={14} /> Dashboard
            </Link>
            <div className="h-4 w-px bg-[#1f1f23]" />
            <div className="flex items-center gap-2 text-white text-sm font-semibold">
              <Bot size={16} className="text-[#ff6b4a]" />
              SergeantPI
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
              online
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {online ? 'Online' : 'Offline'}
            </span>
          </div>

          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 text-[#6b6b76] hover:text-[#ff6b4a] text-xs transition-colors"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </nav>

      {/* ── Tabs ── */}
      <div className="border-b border-[#1f1f23]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex gap-1 -mb-px">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
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
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ═══ OVERVIEW ═══ */}
        {tab === 'overview' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Pipelines" value={d.summary.totalPipelines} icon={<Activity size={16} />} />
              <StatCard label="Total Tokens" value={d.summary.totalTokens > 1000 ? `${(d.summary.totalTokens / 1000).toFixed(1)}k` : d.summary.totalTokens} icon={<Zap size={16} />} />
              <StatCard label="Success Rate" value={`${d.summary.successRate}%`} sub={`${d.summary.totalErrors} errors`} icon={<CheckCircle2 size={16} />} />
              <StatCard label="Active Agents" value={d.summary.activeAgents} sub="of 6 available" icon={<Bot size={16} />} />
            </div>

            {/* Usage chart + Model distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-[#111118] border border-[#1f1f23] rounded-xl p-5">
                <h3 className="text-white font-semibold text-sm mb-4">Daily Pipeline Activity</h3>
                {d.dailyUsage.length > 0 ? (
                  <MiniBarChart data={d.dailyUsage} valueKey="pipelines" />
                ) : (
                  <div className="h-16 flex items-center justify-center text-[#6b6b76] text-xs">No data yet — run a pipeline to see activity</div>
                )}
              </div>

              <div className="bg-[#111118] border border-[#1f1f23] rounded-xl p-5">
                <h3 className="text-white font-semibold text-sm mb-3">Model Distribution</h3>
                <div className="space-y-2">
                  {d.modelDistribution.length > 0 ? d.modelDistribution.slice(0, 6).map(m => (
                    <div key={m.model} className="flex items-center gap-2">
                      <div className="flex-1 bg-[#1f1f23] rounded-full h-2 overflow-hidden">
                        <div className="bg-[#ff6b4a] h-full rounded-full transition-all" style={{ width: `${m.percentage}%` }} />
                      </div>
                      <span className="text-[10px] text-[#6b6b76] font-mono w-24 text-right truncate">{m.model.replace('readypi/', '')}</span>
                      <span className="text-[10px] text-white font-mono w-10 text-right">{m.percentage}%</span>
                    </div>
                  )) : (
                    <div className="text-[#6b6b76] text-xs">No model usage yet</div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick run */}
            <div className="bg-[#111118] border border-[#1f1f23] rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <Terminal size={14} className="text-[#ff6b4a]" /> Quick Run
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={taskInput}
                  onChange={e => setTaskInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleQuickRun()}
                  placeholder="e.g. Find trending earbuds under $15 and draft a product listing"
                  className="flex-1 bg-[#0a0a0f] border border-[#1f1f23] text-white py-3 px-4 rounded-xl text-sm font-mono outline-none focus:border-[#ff6b4a] transition-colors placeholder:text-[#4a4a56]"
                />
                <button
                  onClick={handleQuickRun}
                  disabled={running || !taskInput.trim()}
                  className="bg-[#ff6b4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#e55a3a] disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {running ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  {running ? 'Running...' : 'Execute'}
                </button>
              </div>
              {runResult && (
                <div className={`mt-3 p-3 rounded-lg text-xs font-mono ${
                  runResult.startsWith('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                }`}>
                  {runResult}
                </div>
              )}
            </div>

            {/* AWS Status */}
            <div className="bg-[#111118] border border-[#1f1f23] rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <Cloud size={14} className="text-[#f59e0b]" /> AWS Services
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { name: 'Bedrock', icon: <Cpu size={14} />, desc: `Region: ${d.aws.region}` },
                  { name: 'S3', icon: <HardDrive size={14} />, desc: d.aws.s3Bucket },
                  { name: 'SES', icon: <Mail size={14} />, desc: 'Email notifications' },
                  { name: 'DynamoDB', icon: <Database size={14} />, desc: `Prefix: ${d.aws.dynamoPrefix}` },
                ].map(svc => (
                  <div key={svc.name} className="bg-[#0a0a0f] border border-[#1f1f23] rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#f59e0b]">{svc.icon}</span>
                      <span className="text-white text-xs font-semibold">{svc.name}</span>
                      <span className={`ml-auto w-2 h-2 rounded-full ${d.aws.configured ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    </div>
                    <div className="text-[10px] text-[#6b6b76] font-mono truncate">{svc.desc}</div>
                  </div>
                ))}
              </div>
              {!d.aws.configured && (
                <div className="mt-3 flex items-center gap-2 text-yellow-400 text-xs">
                  <AlertTriangle size={12} /> AWS credentials not configured — set AWS_ACCESS_KEY_ID in .env
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ AGENTS ═══ */}
        {tab === 'agents' && (
          <>
            <h2 className="text-white text-lg font-bold">Agent Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(AGENT_META).map(([name]) => {
                const stat = d.agents[name] || { calls: 0, totalTokens: 0, totalCost: 0, avgLatency: 0, errors: 0, lastUsed: '' }
                return <AgentCard key={name} name={name} stat={stat} />
              })}
            </div>
          </>
        )}

        {/* ═══ INVENTORY ═══ */}
        {tab === 'inventory' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Total Items" value={d.inventory.totalItems} icon={<Package size={16} />} />
              <StatCard label="Total Value" value={`$${d.inventory.totalValue.toFixed(2)}`} icon={<TrendingUp size={16} />} />
              <StatCard
                label="Low Stock"
                value={d.inventory.lowStockCount}
                sub={d.inventory.lowStockCount > 0 ? 'Items below 10 units' : 'All good'}
                icon={<AlertTriangle size={16} />}
              />
            </div>

            <div className="bg-[#111118] border border-[#1f1f23] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1f1f23] flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">Inventory (DynamoDB Cache)</h3>
                {!d.aws.configured && (
                  <span className="text-[10px] text-yellow-400 flex items-center gap-1">
                    <AlertTriangle size={10} /> AWS not configured
                  </span>
                )}
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1f1f23] text-[10px] uppercase tracking-wider text-[#6b6b76]">
                    <th className="py-3 px-5 font-medium">SKU</th>
                    <th className="py-3 px-5 font-medium">Product</th>
                    <th className="py-3 px-5 font-medium">Qty</th>
                    <th className="py-3 px-5 font-medium">Price</th>
                    <th className="py-3 px-5 font-medium">Supplier</th>
                    <th className="py-3 px-5 font-medium">Last Checked</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {d.inventory.items.length > 0 ? d.inventory.items.map(item => (
                    <tr key={item.sku} className="border-b border-[#1f1f23]/60 hover:bg-[#ffffff04] transition-colors">
                      <td className="py-3 px-5 font-mono text-xs text-[#9b9ba8]">{item.sku}</td>
                      <td className="py-3 px-5 text-white">{item.name}</td>
                      <td className="py-3 px-5">
                        <span className={`font-mono ${item.quantity < 10 ? 'text-red-400' : 'text-white'}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-white font-mono">${item.price.toFixed(2)}</td>
                      <td className="py-3 px-5 text-[#6b6b76]">{item.supplier}</td>
                      <td className="py-3 px-5 text-[#6b6b76] text-xs font-mono">
                        {item.lastChecked ? new Date(item.lastChecked).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#6b6b76] text-sm">
                        {d.aws.configured ? 'No inventory cached yet.' : 'Connect AWS credentials to view inventory.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ═══ PIPELINES ═══ */}
        {tab === 'pipelines' && (
          <>
            <h2 className="text-white text-lg font-bold">Recent Pipelines</h2>
            <div className="bg-[#111118] border border-[#1f1f23] rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1f1f23] text-[10px] uppercase tracking-wider text-[#6b6b76]">
                    <th className="py-3 px-5 font-medium">Status</th>
                    <th className="py-3 px-5 font-medium">Task</th>
                    <th className="py-3 px-5 font-medium">Agents</th>
                    <th className="py-3 px-5 font-medium">Tokens</th>
                    <th className="py-3 px-5 font-medium">Cost</th>
                    <th className="py-3 px-5 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {d.recentPipelines.length > 0 ? d.recentPipelines.map(p => (
                    <tr key={p.id} className="border-b border-[#1f1f23]/60 hover:bg-[#ffffff04] transition-colors">
                      <td className="py-3 px-5">
                        {p.status === 'success'
                          ? <CheckCircle2 size={14} className="text-green-400" />
                          : <XCircle size={14} className="text-red-400" />
                        }
                      </td>
                      <td className="py-3 px-5 text-white max-w-[300px] truncate">{p.task}</td>
                      <td className="py-3 px-5">
                        <div className="flex gap-1">
                          {p.agents.map((a, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f1f23] text-[#9b9ba8]">
                              {a}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-5 font-mono text-xs text-[#9b9ba8]">{p.totalTokens.toLocaleString()}</td>
                      <td className="py-3 px-5 font-mono text-xs text-[#9b9ba8]">${p.totalCost.toFixed(4)}</td>
                      <td className="py-3 px-5 text-[#6b6b76] text-xs font-mono">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#6b6b76] text-sm">
                        No pipelines executed yet. Use Quick Run or POST /v1/orchestrate.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
