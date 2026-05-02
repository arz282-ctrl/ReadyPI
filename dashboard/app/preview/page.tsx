'use client'

import AnalyticsView from '@/components/dashboard/AnalyticsView'
import MetricsBar, { useMockMetrics } from '@/components/dashboard/MetricsBar'
import Link from 'next/link'

export default function PreviewPage() {
  const { data, loading } = useMockMetrics()

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Preview banner */}
      <div className="bg-[#ff6b4a]/10 border-b border-[#ff6b4a]/20 px-6 py-2 flex items-center justify-between">
        <span className="text-xs font-mono text-[#ff6b4a] uppercase tracking-widest">
          ⚡ UI Preview — not authenticated
        </span>
        <div className="flex gap-4 text-[10px] font-mono text-[#6b6b76] uppercase tracking-widest">
          <Link href="/" className="hover:text-white transition-colors">← Home</Link>
          <Link href="/login" className="hover:text-[#ff6b4a] transition-colors">Login →</Link>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-14">

        {/* Section 1: MetricsBar standalone */}
        <section>
          <div className="mb-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#5a5a66] font-mono">Component — MetricsBar</h2>
            <p className="text-[11px] text-[#3a3a46] font-mono mt-0.5">Horizontal metrics strip — with data / loading states</p>
          </div>
          <div className="space-y-3">
            <MetricsBar data={data} loading={loading} />
            <MetricsBar loading={true} />
          </div>
        </section>

        {/* Section 2: AnalyticsView with data */}
        <section>
          <div className="mb-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#5a5a66] font-mono">Component — AnalyticsView (hasData=true)</h2>
            <p className="text-[11px] text-[#3a3a46] font-mono mt-0.5">Full dashboard analytics — mock data populated</p>
          </div>
          <AnalyticsView hasData={true} />
        </section>

        {/* Section 3: AnalyticsView empty state */}
        <section>
          <div className="mb-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#5a5a66] font-mono">Component — AnalyticsView (hasData=false)</h2>
            <p className="text-[11px] text-[#3a3a46] font-mono mt-0.5">Empty state — actionable CTAs for new users</p>
          </div>
          <AnalyticsView hasData={false} />
        </section>

      </div>
    </div>
  )
}
