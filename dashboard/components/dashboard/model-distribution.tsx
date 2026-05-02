'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ModelBreakdown {
  model: string
  requests: number
  tokens: number
  credits: number
}

interface ModelDistributionProps {
  data: ModelBreakdown[]
  totalRequests: number
  loading?: boolean
}

// ─── Color palette for models ───────────────────────────────────────────────

const MODEL_COLORS: Record<string, string> = {
  'readypi/deepseek':     '#6366f1',
  'readypi/deepseek-r1':  '#818cf8',
  'readypi/llama':        '#f97316',
  'readypi/gemini-flash': '#4285f4',
  'readypi/gemini-pro':   '#34a853',
  'readypi/gpt4o-mini':   '#10a37f',
  'readypi/gpt4o':        '#10a37f',
  'readypi/claude-sonnet': '#d4a574',
  'readypi/claude-haiku': '#c8956e',
  'readypi/mistral':      '#ff6b4a',
  'readypi/glm-5.1':      '#22d3ee',
}

function getModelColor(model: string, index: number): string {
  if (MODEL_COLORS[model]) return MODEL_COLORS[model]
  const fallback = ['#ff6b4a', '#a78bfa', '#4285f4', '#f59e0b', '#00ff88', '#f472b6', '#22d3ee', '#ef4444']
  return fallback[index % fallback.length]
}

function getModelShortName(model: string): string {
  return model.replace('readypi/', '').replace('bedrock-', 'bk:')
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

function DistTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload

  return (
    <div className="bg-[#1a1a22] border border-[#2a2a35] rounded-xl p-3 shadow-xl text-xs min-w-[160px]">
      <div className="text-white font-bold mb-1.5">{getModelShortName(d.model)}</div>
      <div className="space-y-1 text-[#9b9ba8]">
        <div className="flex justify-between"><span>Requests</span><span className="text-white font-mono">{d.requests.toLocaleString()}</span></div>
        <div className="flex justify-between"><span>Tokens</span><span className="text-white font-mono">{d.tokens?.toLocaleString()}</span></div>
        <div className="flex justify-between"><span>Credits</span><span className="text-white font-mono">{d.credits?.toLocaleString()}</span></div>
        <div className="flex justify-between"><span>Share</span><span className="text-[#ff6b4a] font-mono">{d.pct}%</span></div>
      </div>
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ModelDistribution({ data, totalRequests, loading }: ModelDistributionProps) {
  if (loading) {
    return (
      <div className="bg-[#111118] border border-[#1f1f23] rounded-2xl p-6">
        <div className="h-8 w-40 bg-[#1f1f23] rounded animate-pulse mb-6" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-[#1f1f23] rounded animate-pulse" style={{ opacity: 1 - i * 0.2 }} />
          ))}
        </div>
      </div>
    )
  }

  const chartData = data.map((m, i) => ({
    ...m,
    pct: totalRequests > 0 ? ((m.requests / totalRequests) * 100).toFixed(1) : '0',
    color: getModelColor(m.model, i),
    shortName: getModelShortName(m.model),
  }))

  return (
    <div className="bg-[#111118] border border-[#1f1f23] rounded-2xl overflow-hidden">
      <div className="p-5 pb-0">
        <h3 className="text-white font-bold text-sm">Model Distribution</h3>
        <p className="text-[11px] text-[#6b6b76] mt-0.5">Usage breakdown by model — last 30 days</p>
      </div>

      {chartData.length === 0 ? (
        <div className="p-5 py-12 text-center text-[#6b6b76] text-sm">
          No model usage data yet
        </div>
      ) : (
        <>
          {/* Horizontal Bar Chart */}
          <div className="p-5 pt-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    axisLine={false}
                    tickLine={false}
                    width={100}
                    tick={{ fill: '#9b9ba8', fontSize: 11, fontFamily: 'monospace' }}
                  />
                  <Tooltip content={<DistTooltip />} cursor={{ fill: '#ffffff08' }} />
                  <Bar dataKey="requests" radius={[0, 6, 6, 0]} barSize={20}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend pills */}
          <div className="px-5 pb-5 flex flex-wrap gap-2">
            {chartData.slice(0, 6).map((m, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0a0a0f] border border-[#1f1f23] rounded-full">
                <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                <span className="text-[10px] font-mono text-[#9b9ba8]">{m.shortName}</span>
                <span className="text-[10px] font-mono text-[#6b6b76]">{m.pct}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
