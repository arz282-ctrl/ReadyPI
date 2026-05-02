'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Key, ArrowRight, Terminal, Zap } from 'lucide-react'

import MetricsBar, { useMockMetrics } from './MetricsBar'
import StatsCards from './stats-cards'
import UsageChart from './usage-chart'
import ModelDistribution from './model-distribution'
import LogsTable from './logs-table'

// ─── Mock data (swap for SWR/TanStack Query calls at integration time) ────────

const MOCK_DAILY: { date: string; requests: number; tokens: number; credits: number }[] = (() => {
  const days = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({
      date: d.toISOString().split('T')[0],
      requests: Math.floor(500 + Math.random() * 1500),
      tokens:   Math.floor(80_000 + Math.random() * 200_000),
      credits:  Math.floor(40 + Math.random() * 120),
    })
  }
  return days
})()

const MOCK_MODEL_BREAKDOWN = [
  { model: 'readypi/deepseek-r1',   requests: 9_812, tokens: 1_420_000, credits: 2_840 },
  { model: 'readypi/gemini-flash',  requests: 6_034, tokens:   890_000, credits: 1_780 },
  { model: 'readypi/claude-haiku',  requests: 4_211, tokens:   610_000, credits: 1_222 },
  { model: 'readypi/llama',         requests: 2_890, tokens:   410_000, credits:   820 },
  { model: 'readypi/mistral',       requests: 1_420, tokens:   198_000, credits:   396 },
  { model: 'readypi/glm-5.1',       requests:   450, tokens:    62_000, credits:   124 },
]

const MOCK_LOGS = [
  { model: 'readypi/deepseek-r1',  provider: 'bedrock', tokens: 2_841, credits_used: 5,  cost_bdt: 0.0142, status: 'success', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
  { model: 'readypi/gemini-flash', provider: 'google',  tokens: 1_203, credits_used: 2,  cost_bdt: 0.0060, status: 'success', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { model: 'readypi/claude-haiku', provider: 'bedrock', tokens: 4_512, credits_used: 9,  cost_bdt: 0.0225, status: 'success', timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString() },
  { model: 'readypi/llama',        provider: 'bedrock', tokens:   892, credits_used: 1,  cost_bdt: 0.0044, status: 'error',   timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString() },
  { model: 'readypi/mistral',      provider: 'bedrock', tokens: 3_210, credits_used: 6,  cost_bdt: 0.0160, status: 'success', timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
  { model: 'readypi/deepseek-r1',  provider: 'bedrock', tokens: 1_890, credits_used: 4,  cost_bdt: 0.0095, status: 'success', timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString() },
  { model: 'readypi/gemini-flash', provider: 'google',  tokens:   780, credits_used: 1,  cost_bdt: 0.0039, status: 'success', timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString() },
  { model: 'readypi/glm-5.1',      provider: 'bedrock', tokens: 2_100, credits_used: 4,  cost_bdt: 0.0105, status: 'success', timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString() },
]

// ─── Aggregate helpers ────────────────────────────────────────────────────────

function sumDailyField(arr: typeof MOCK_DAILY, field: 'requests' | 'tokens' | 'credits') {
  return arr.reduce((acc, d) => acc + d[field], 0)
}

// ─── Empty-state CTA ──────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Terminal icon with orange glow */}
      <div className="relative mb-6">
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-30"
          style={{ background: 'radial-gradient(circle, #ff6b4a 0%, transparent 70%)' }}
        />
        <div
          className="relative w-16 h-16 rounded-2xl flex items-center justify-center border border-[#ff6b4a]/20"
          style={{ background: 'linear-gradient(135deg, #ff6b4a12, #c8381a08)' }}
        >
          <Terminal size={28} style={{ color: '#ff6b4a' }} />
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-2">No traffic detected yet</h3>
      <p className="text-sm text-[#6b6b76] max-w-sm mb-8 leading-relaxed">
        Your analytics dashboard is ready. Generate an API key and make your first request to start seeing data flow in real-time.
      </p>

      {/* Steps */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-8 text-xs font-mono text-[#5a5a66]">
        <Step n={1} label="Generate an API Key" />
        <div className="hidden sm:block text-[#2a2a35]">—</div>
        <Step n={2} label="Point your app to ReadyPI" />
        <div className="hidden sm:block text-[#2a2a35]">—</div>
        <Step n={3} label="Watch your metrics appear" />
      </div>

      {/* Code hint */}
      <div className="mb-8 text-left w-full max-w-md bg-[#0d0d14] border border-[#1f1f23] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1f1f23] bg-[#111118]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#00ff88]/40" />
          <span className="ml-2 text-[10px] uppercase tracking-wider text-[#3a3a46]">bash</span>
        </div>
        <pre className="p-4 text-[11px] font-mono leading-relaxed overflow-x-auto text-[#9b9ba8]">
          <span className="text-[#5a5a66]"># Drop-in replacement for OpenAI</span>{'\n'}
          <span className="text-[#ff6b4a]">curl</span> https://api.readypi.com/v1/chat/completions \{'\n'}
          {'  '}<span className="text-[#a78bfa]">-H</span> <span className="text-[#00ff88]">"Authorization: Bearer <span className="opacity-50">YOUR_KEY</span>"</span> \{'\n'}
          {'  '}<span className="text-[#a78bfa]">-d</span> <span className="text-[#00ff88]">'&#123;"model":"readypi/deepseek-r1"&#125;'</span>
        </pre>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/api-keys"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #ff6b4a, #c8381a)' }}
        >
          <Key size={15} />
          Generate your first API Key
          <ArrowRight size={14} />
        </Link>
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-[#9b9ba8] border border-[#1f1f23] hover:border-[#ff6b4a]/30 hover:text-white transition-all"
        >
          Read the docs
        </Link>
      </div>
    </div>
  )
}

function Step({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{ background: 'linear-gradient(135deg, #ff6b4a22, #c8381a22)', color: '#ff6b4a', border: '1px solid #ff6b4a33' }}
      >
        {n}
      </span>
      <span>{label}</span>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-white font-bold text-sm">{title}</h2>
        {sub && <p className="text-[11px] text-[#6b6b76] mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AnalyticsViewProps {
  /** Pass false to force the empty state (no data scenario). Defaults to true for mock. */
  hasData?: boolean
}

export default function AnalyticsView({ hasData = true }: AnalyticsViewProps) {
  const { data: metricsData, loading: metricsLoading } = useMockMetrics()

  // Simulate chart/table loading slightly longer
  const [chartsLoading, setChartsLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setChartsLoading(false), 1100)
    return () => clearTimeout(t)
  }, [])

  const totalRequests = sumDailyField(MOCK_DAILY, 'requests')
  const totalTokens   = sumDailyField(MOCK_DAILY, 'tokens')
  const totalCredits  = sumDailyField(MOCK_DAILY, 'credits')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Metrics strip ─────────────────────────────────────────────────── */}
      <MetricsBar data={metricsData} loading={metricsLoading} />

      {/* ── Empty state or full analytics ─────────────────────────────────── */}
      {!hasData ? (
        <div className="bg-[#0d0d14] border border-[#1f1f23] rounded-2xl">
          <EmptyState />
        </div>
      ) : (
        <>
          {/* ── Stats cards ─────────────────────────────────────────────── */}
          <section>
            <SectionHeader
              title="Last 30 Days"
              sub="Aggregate usage across all API keys"
            />
            <StatsCards
              totalRequests={totalRequests}
              totalTokens={totalTokens}
              avgLatency={metricsData?.avgLatencyMs ?? 0}
              totalCostBdt={totalCredits * 0.005}
              dailyUsage={MOCK_DAILY}
            />
          </section>

          {/* ── Usage chart ─────────────────────────────────────────────── */}
          <section>
            <SectionHeader
              title="Usage Over Time"
              sub="Daily token & request volume"
            />
            <UsageChart dailyUsage={MOCK_DAILY} loading={chartsLoading} />
          </section>

          {/* ── Model distribution + credits CTA row ────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SectionHeader
                title="Model Distribution"
                sub="Request share by model — 30 days"
              />
              <ModelDistribution
                data={MOCK_MODEL_BREAKDOWN}
                totalRequests={totalRequests}
                loading={chartsLoading}
              />
            </div>

            {/* Credits top-up card */}
            <div className="flex flex-col">
              <SectionHeader title="Balance" sub="Current credit status" />
              <div className="flex-1 bg-[#0d0d14] border border-[#1f1f23] rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[#5a5a66] mb-1">Remaining Credits</div>
                  <div
                    className="text-4xl font-bold font-mono tabular-nums"
                    style={{ background: 'linear-gradient(135deg, #ff6b4a, #c8381a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    {metricsData?.creditsRemaining.toLocaleString() ?? '—'}
                  </div>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-[#1f1f23] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${metricsData ? (metricsData.creditsRemaining / metricsData.creditsTotal) * 100 : 0}%`,
                        background: 'linear-gradient(90deg, #00ff88, #00cc6a)',
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-[#5a5a66] mt-1.5 font-mono">
                    of {metricsData?.creditsTotal.toLocaleString() ?? '—'} total
                  </div>
                </div>

                <Link
                  href="/billing"
                  className="mt-6 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-white border border-[#ff6b4a]/30 hover:border-[#ff6b4a]/60 hover:bg-[#ff6b4a]/5 transition-all"
                >
                  <Zap size={13} style={{ color: '#ff6b4a' }} />
                  Top up credits
                </Link>
              </div>
            </div>
          </div>

          {/* ── Request logs ────────────────────────────────────────────── */}
          <section>
            <SectionHeader
              title="Recent Requests"
              sub="Live traffic log — last 50 entries"
            />
            <LogsTable
              logs={chartsLoading ? [] : MOCK_LOGS}
              loading={chartsLoading}
              total={MOCK_LOGS.length}
              limit={50}
              offset={0}
              onPageChange={() => {}}
            />
          </section>
        </>
      )}
    </div>
  )
}
