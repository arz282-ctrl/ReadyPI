'use client'

import { useState, useMemo } from 'react'
import { Download, ChevronLeft, ChevronRight, ArrowUpDown, Filter } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface LogEntry {
  model: string
  provider: string
  tokens: number
  credits_used: number
  cost_inr?: number
  cost_bdt: number
  status: string
  timestamp: string
}

interface LogsTableProps {
  logs: LogEntry[]
  loading?: boolean
  total: number
  limit: number
  offset: number
  onPageChange: (newOffset: number) => void
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isSuccess = status === 'success'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
      isSuccess
        ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20'
        : 'bg-red-500/10 text-red-400 border border-red-500/20'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-[#00ff88]' : 'bg-red-400'}`} />
      {status}
    </span>
  )
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function getModelShortName(model: string): string {
  return model.replace('readypi/', '').replace('bedrock-', 'bk:')
}

// ─── CSV Export ─────────────────────────────────────────────────────────────

function exportCSV(logs: LogEntry[]) {
  const header = 'Date,Model,Provider,Tokens,Credits,Cost INR,Status\n'
  const rows = logs.map(l =>
    `${l.timestamp},${l.model},${l.provider},${l.tokens},${l.credits_used},${l.cost_inr || l.cost_bdt},${l.status}`
  ).join('\n')

  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `readypi-logs-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Skeleton rows ──────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <tr key={i} className="border-b border-[#1f1f23]">
          {[...Array(6)].map((_, j) => (
            <td key={j} className="py-3.5 px-4">
              <div className="h-3.5 bg-[#1f1f23] rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%`, opacity: 1 - i * 0.1 }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function LogsTable({ logs, loading, total, limit, offset, onPageChange }: LogsTableProps) {
  const [sortField, setSortField] = useState<'timestamp' | 'tokens' | 'cost_bdt'>('timestamp')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      let aVal: any, bVal: any
      if (sortField === 'timestamp') {
        aVal = new Date(a.timestamp).getTime()
        bVal = new Date(b.timestamp).getTime()
      } else {
        aVal = a[sortField]
        bVal = b[sortField]
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [logs, sortField, sortDir])

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="bg-[#111118] border border-[#1f1f23] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1f1f23]">
        <div>
          <h3 className="text-white font-bold text-sm">Request Logs</h3>
          <p className="text-[11px] text-[#6b6b76] mt-0.5">
            {total.toLocaleString()} total requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0f] border border-[#1f1f23] rounded-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]" />
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#6b6b76] font-medium">Live</span>
          </div>

          <button
            onClick={() => exportCSV(logs)}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium text-[#6b6b76] hover:text-white bg-[#0a0a0f] border border-[#1f1f23] rounded-lg transition-colors disabled:opacity-40"
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="border-b border-[#1f1f23] text-[10px] uppercase tracking-wider text-[#6b6b76]">
              <th className="py-3 px-4 font-medium">
                <button onClick={() => handleSort('timestamp')} className="flex items-center gap-1 hover:text-white transition-colors">
                  Date <ArrowUpDown size={10} />
                </button>
              </th>
              <th className="py-3 px-4 font-medium">Model</th>
              <th className="py-3 px-4 font-medium">Provider</th>
              <th className="py-3 px-4 font-medium">
                <button onClick={() => handleSort('tokens')} className="flex items-center gap-1 hover:text-white transition-colors">
                  Tokens <ArrowUpDown size={10} />
                </button>
              </th>
              <th className="py-3 px-4 font-medium">
                <button onClick={() => handleSort('cost_bdt')} className="flex items-center gap-1 hover:text-white transition-colors">
                  Cost <ArrowUpDown size={10} />
                </button>
              </th>
              <th className="py-3 px-4 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="text-xs font-mono">
            {loading ? (
              <SkeletonRows />
            ) : sortedLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="text-[#6b6b76] mb-2">No requests logged yet</div>
                  <p className="text-[11px] text-[#4a4a56]">Make your first API call to see logs here</p>
                </td>
              </tr>
            ) : (
              sortedLogs.map((log, i) => (
                <tr key={i} className="border-b border-[#1f1f23]/60 hover:bg-[#ffffff04] transition-colors">
                  <td className="py-3 px-4 text-[#9b9ba8]">{formatTimestamp(log.timestamp)}</td>
                  <td className="py-3 px-4 text-white font-medium">{getModelShortName(log.model)}</td>
                  <td className="py-3 px-4 text-[#9b9ba8] capitalize">{log.provider}</td>
                  <td className="py-3 px-4 text-[#9b9ba8] tabular-nums">{log.tokens.toLocaleString()}</td>
                  <td className="py-3 px-4 text-[#00ff88] tabular-nums">₹{log.cost_bdt.toFixed(4)}</td>
                  <td className="py-3 px-4 text-right"><StatusBadge status={log.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-[#1f1f23]">
          <div className="text-[11px] text-[#6b6b76] font-mono">
            Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="p-1.5 rounded-lg border border-[#1f1f23] text-[#6b6b76] hover:text-white hover:border-[#ff6b4a]/30 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 text-[11px] font-mono text-[#9b9ba8]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(offset + limit)}
              disabled={offset + limit >= total}
              className="p-1.5 rounded-lg border border-[#1f1f23] text-[#6b6b76] hover:text-white hover:border-[#ff6b4a]/30 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
