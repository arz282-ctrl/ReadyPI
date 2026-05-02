'use client'

import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────────────────────

interface DailyDataPoint {
  date: string
  requests: number
  tokens: number
  credits: number
}

interface UsageChartProps {
  dailyUsage: DailyDataPoint[]
  loading?: boolean
}

type TimeRange = '7d' | '30d'
type Metric = 'tokens' | 'requests' | 'credits'

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-[#1a1a22] border border-[#2a2a35] rounded-xl p-3 shadow-xl text-xs">
      <div className="text-[#6b6b76] font-mono mb-2">
        {new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-[#9b9ba8] capitalize">{entry.dataKey}:</span>
          <span className="text-white font-bold font-mono tabular-nums">
            {entry.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Chart Component ────────────────────────────────────────────────────────

export default function UsageChart({ dailyUsage, loading }: UsageChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [metric, setMetric] = useState<Metric>('tokens')

  // Filter data by time range
  const cutoff = timeRange === '7d' ? 7 : 30
  const chartData = dailyUsage
    .slice(0, cutoff)
    .reverse()
    .map(d => ({
      ...d,
      dateLabel: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))

  const metricColors: Record<Metric, string> = {
    tokens:   '#ff6b4a',
    requests: '#a78bfa',
    credits:  '#00ff88',
  }

  const color = metricColors[metric]

  if (loading) {
    return (
      <div className="bg-[#111118] border border-[#1f1f23] rounded-2xl p-6">
        <div className="h-[320px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#ff6b4a] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#111118] border border-[#1f1f23] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-white font-bold text-sm">Usage Over Time</h3>
          <p className="text-[11px] text-[#6b6b76] mt-0.5">Track your API consumption trends</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Metric selector */}
          <div className="flex bg-[#0a0a0f] border border-[#1f1f23] rounded-lg p-0.5">
            {(['tokens', 'requests', 'credits'] as Metric[]).map(m => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium rounded-md transition-all ${
                  metric === m
                    ? 'bg-[#1f1f23] text-white'
                    : 'text-[#6b6b76] hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Time range */}
          <div className="flex bg-[#0a0a0f] border border-[#1f1f23] rounded-lg p-0.5">
            {(['7d', '30d'] as TimeRange[]).map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium rounded-md transition-all ${
                  timeRange === t
                    ? 'bg-[#1f1f23] text-white'
                    : 'text-[#6b6b76] hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-5 pt-4">
        {chartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-[#6b6b76] text-sm">
            No usage data for this period
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b6b76', fontSize: 10, fontFamily: 'monospace' }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b6b76', fontSize: 10, fontFamily: 'monospace' }}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke={color}
                  strokeWidth={2}
                  fill="url(#chartGradient)"
                  dot={false}
                  activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: '#111118' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
