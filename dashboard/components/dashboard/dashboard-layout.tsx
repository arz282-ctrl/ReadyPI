'use client'

import Navbar from '@/components/Navbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-300">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {children}
      </main>
    </div>
  )
}
