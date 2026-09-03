'use client'

import { Activity, Coins, Clock, Zap, TrendingUp, TrendingDown } from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer,
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  subValue?: string
  icon: React.ReactNode
  trend?: number          // percentage change
  sparkData?: number[]    // raw values for the sparkline
  accentColor?: string
}

// ─── Sparkline ──────────────────────────────────────────────────────────────

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const points = data.map((v, i) => ({ v, i }))

  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${color.replace('#', '')})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Single Card ────────────────────────────────────────────────────────────

function StatCard({ label, value, subValue, icon, trend, sparkData, accentColor = '#ff6b4a' }: StatCardProps) {
  const trendPositive = trend !== undefined && trend >= 0

  return (
    <div className="group relative bg-[#111118] border border-[#1f1f23] rounded-2xl p-5 transition-all duration-300 hover:border-[#ff6b4a]/30 overflow-hidden">
      {/* Subtle corner glow */}
      <div
        className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl"
        style={{ background: accentColor }}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${accentColor}15`, color: accentColor }}
            >
              {icon}
            </div>
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#6b6b76] font-medium">{label}</span>
          </div>

          <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums leading-none mb-1">
            {value}
          </div>

          {subValue && (
            <div className="text-[11px] text-[#6b6b76] font-mono mt-1.5">{subValue}</div>
          )}

          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-[11px] font-medium ${trendPositive ? 'text-[#00ff88]' : 'text-red-400'}`}>
              {trendPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trendPositive ? '+' : ''}{trend.toFixed(1)}% vs last period
            </div>
          )}
        </div>

        {sparkData && sparkData.length > 1 && (
          <MiniSparkline data={sparkData} color={accentColor} />
        )}
      </div>
    </div>
  )
}

// ─── Metrics Bar (4-col) ────────────────────────────────────────────────────

interface MetricsBarProps {
  totalRequests: number
  totalTokens: number
  avgLatency: number
  totalCostBdt: number
  dailyUsage?: { requests: number; tokens: number; credits: number }[]
}

export default function StatsCards({ totalRequests, totalTokens, avgLatency, totalCostBdt, dailyUsage = [] }: MetricsBarProps) {
  const requestSpark = dailyUsage.map(d => d.requests)
  const tokenSpark   = dailyUsage.map(d => d.tokens)
  const creditSpark  = dailyUsage.map(d => d.credits)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Requests"
        value={totalRequests.toLocaleString()}
        subValue="Last 30 days"
        icon={<Activity size={16} />}
        sparkData={requestSpark}
        accentColor="#ff6b4a"
      />
      <StatCard
        label="Total Tokens"
        value={totalTokens >= 1_000_000
          ? `${(totalTokens / 1_000_000).toFixed(1)}M`
          : totalTokens >= 1_000
            ? `${(totalTokens / 1_000).toFixed(1)}K`
            : totalTokens.toString()}
        subValue={`${totalTokens.toLocaleString()} exact`}
        icon={<Coins size={16} />}
        sparkData={tokenSpark}
        accentColor="#a78bfa"
      />
      <StatCard
        label="Avg Latency"
        value={`${Math.round(avgLatency)}ms`}
        subValue={avgLatency < 200 ? 'Excellent' : avgLatency < 500 ? 'Good' : 'Slow'}
        icon={<Clock size={16} />}
        accentColor={avgLatency < 200 ? '#00ff88' : '#f59e0b'}
      />
      <StatCard
        label="Total Cost"
        value={`₹${totalCostBdt.toFixed(2)}`}
        subValue="Last 30 days"
        icon={<Zap size={16} />}
        sparkData={creditSpark}
        accentColor="#00ff88"
      />
    </div>
  )
}
