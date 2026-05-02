'use client'

import { useState, useEffect } from 'react'
import { Activity, Zap, Clock, CheckCircle2, LayoutGrid } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MetricsData {
  totalRequests: number
  totalRequestsDelta: number   // % change vs previous period
  creditsRemaining: number
  creditsTotal: number
  avgLatencyMs: number
  successRate: number          // 0–100
  activeModels: number
}

interface MetricsBarProps {
  data?: MetricsData
  loading?: boolean
}

// ─── Mock hook (replace with SWR/TanStack Query at integration time) ─────────

const MOCK_DATA: MetricsData = {
  totalRequests:     24_817,
  totalRequestsDelta: 12.4,
  creditsRemaining:   8_420,
  creditsTotal:      10_000,
  avgLatencyMs:        187,
  successRate:         99.2,
  activeModels:           6,
}

export function useMockMetrics(): { data: MetricsData; loading: boolean } {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  return { data: MOCK_DATA, loading }
}

// ─── Skeleton cell ───────────────────────────────────────────────────────────

function SkeletonCell() {
  return (
    <div className="flex-1 min-w-[120px] px-5 py-4 flex flex-col gap-2">
      <div className="h-2.5 w-20 bg-[#1f1f23] rounded animate-pulse" />
      <div className="h-7 w-28 bg-[#1f1f23] rounded animate-pulse" />
      <div className="h-2 w-16 bg-[#1f1f23] rounded animate-pulse opacity-50" />
    </div>
  )
}

// ─── Single metric cell ───────────────────────────────────────────────────────

interface CellProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  accentColor?: string
}

function MetricCell({ icon, label, value, sub, accentColor = '#ff6b4a' }: CellProps) {
  return (
    <div className="group flex-1 min-w-[140px] px-5 py-4 flex flex-col gap-0.5 transition-colors hover:bg-white/[0.015]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span style={{ color: accentColor }} className="opacity-70 group-hover:opacity-100 transition-opacity">
          {icon}
        </span>
        <span className="text-[9px] uppercase tracking-[0.18em] text-[#5a5a66] font-medium">
          {label}
        </span>
      </div>

      <div className="text-[22px] font-bold text-white font-mono tabular-nums leading-none">
        {value}
      </div>

      {sub && (
        <div className="text-[10px] text-[#5a5a66] font-mono mt-1 leading-none">
          {sub}
        </div>
      )}
    </div>
  )
}

// ─── Credits mini-bar ─────────────────────────────────────────────────────────

function CreditsCell({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? Math.min((remaining / total) * 100, 100) : 0
  const color = pct > 40 ? '#00ff88' : pct > 15 ? '#f59e0b' : '#ef4444'

  return (
    <div className="group flex-1 min-w-[160px] px-5 py-4 flex flex-col gap-0.5 transition-colors hover:bg-white/[0.015]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Zap size={12} style={{ color }} className="opacity-70 group-hover:opacity-100 transition-opacity" />
        <span className="text-[9px] uppercase tracking-[0.18em] text-[#5a5a66] font-medium">
          Credits Remaining
        </span>
      </div>

      <div className="text-[22px] font-bold text-white font-mono tabular-nums leading-none">
        {remaining.toLocaleString()}
      </div>

      <div className="mt-2 h-1 w-full rounded-full bg-[#1f1f23] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>

      <div className="text-[10px] text-[#5a5a66] font-mono mt-1 leading-none">
        {pct.toFixed(0)}% of {total.toLocaleString()} total
      </div>
    </div>
  )
}

// ─── Delta badge ──────────────────────────────────────────────────────────────

function Delta({ value }: { value: number }) {
  const positive = value >= 0
  return (
    <span
      className="text-[10px] font-mono font-medium"
      style={{ color: positive ? '#00ff88' : '#ef4444' }}
    >
      {positive ? '↑' : '↓'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

// ─── Latency quality label ────────────────────────────────────────────────────

function latencyColor(ms: number) {
  if (ms < 250) return '#00ff88'
  if (ms < 600) return '#f59e0b'
  return '#ef4444'
}

function latencyLabel(ms: number) {
  if (ms < 250) return 'Excellent'
  if (ms < 600) return 'Good'
  return 'Degraded'
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="hidden sm:block w-px self-stretch my-3 bg-[#1f1f23]" />
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MetricsBar({ data, loading = false }: MetricsBarProps) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#0d0d14] border border-[#1f1f23]">
      {/* Orange gradient top-border accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[1.5px]"
        style={{ background: 'linear-gradient(90deg, transparent 0%, #ff6b4a 30%, #c8381a 70%, transparent 100%)' }}
      />

      {/* Live pulse indicator */}
      <div className="absolute top-3.5 right-4 flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00ff88]" />
        </span>
        <span className="text-[9px] uppercase tracking-[0.15em] text-[#5a5a66]">Live</span>
      </div>

      {/* Cells */}
      <div className="flex flex-wrap items-stretch divide-y sm:divide-y-0 divide-[#1f1f23]">
        {loading ? (
          <>
            <SkeletonCell />
            <Divider />
            <SkeletonCell />
            <Divider />
            <SkeletonCell />
            <Divider />
            <SkeletonCell />
            <Divider />
            <SkeletonCell />
          </>
        ) : data ? (
          <>
            {/* API Calls */}
            <MetricCell
              icon={<Activity size={12} />}
              label="API Calls (30d)"
              value={data.totalRequests.toLocaleString()}
              sub={<Delta value={data.totalRequestsDelta} />}
              accentColor="#ff6b4a"
            />

            <Divider />

            {/* Credits */}
            <CreditsCell remaining={data.creditsRemaining} total={data.creditsTotal} />

            <Divider />

            {/* Latency */}
            <MetricCell
              icon={<Clock size={12} />}
              label="Avg Latency"
              value={
                <span style={{ color: latencyColor(data.avgLatencyMs) }}>
                  {data.avgLatencyMs}ms
                </span>
              }
              sub={
                <span style={{ color: latencyColor(data.avgLatencyMs) }}>
                  {latencyLabel(data.avgLatencyMs)}
                </span>
              }
              accentColor={latencyColor(data.avgLatencyMs)}
            />

            <Divider />

            {/* Success Rate */}
            <MetricCell
              icon={<CheckCircle2 size={12} />}
              label="Success Rate"
              value={
                <span style={{ color: data.successRate >= 99 ? '#00ff88' : '#f59e0b' }}>
                  {data.successRate.toFixed(1)}%
                </span>
              }
              sub="Last 30 days"
              accentColor="#00ff88"
            />

            <Divider />

            {/* Active Models */}
            <MetricCell
              icon={<LayoutGrid size={12} />}
              label="Active Models"
              value={data.activeModels}
              sub="Routing targets"
              accentColor="#a78bfa"
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
