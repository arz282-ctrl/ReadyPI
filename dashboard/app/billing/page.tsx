'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, CreditCard, ChevronLeft, ChevronRight, BellRing, Download, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function BillingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [topupAmount, setTopupAmount] = useState('500')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRecharge, setAutoRecharge] = useState(true)

  // Hand off to /checkout, which has the full UPI/Razorpay flow wired up
  const handleCheckout = useCallback(() => {
    setLoading(true)
    setError(null)
    router.push(`/checkout?amount=${encodeURIComponent(topupAmount)}`)
  }, [topupAmount, router])

  const transactions = [
    { id: 'TRX-8921A', date: '2026-04-24', amount: '₹1,499.00', method: 'UPI (PhonePe)', status: 'Completed' },
    { id: 'TRX-7742B', date: '2026-04-10', amount: '₹499.00', method: 'Razorpay', status: 'Completed' },
    { id: 'TRX-6190C', date: '2026-03-28', amount: '₹4,999.00', method: 'Net Banking', status: 'Completed' }
  ]

  return (
    <div className="min-h-screen bg-[#050508] text-gray-300 font-mono">
      {/* Navigation */}
      <nav className="h-16 bg-[#0a0a0f] border-b border-gray-800 flex items-center px-4 sm:px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 hover:text-white transition-colors text-xs sm:text-sm">
            <ChevronLeft size={16} /> Back
          </Link>
          <div className="h-4 w-[1px] bg-gray-800"></div>
          <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm">
            <Wallet size={18} className="text-[#00ff9d]" /> Billing & Wallet
          </div>
        </div>
      </nav>

      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 sm:gap-8">
          
          {/* Left Column: Wallet Stats & Top-up */}
          <div className="md:col-span-3 space-y-6 sm:space-y-8">
            
            {/* Balance Card */}
            <div className="bg-[#0a0a0f] border border-gray-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-[#00ff9d] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
              <div className="relative z-10">
                <div className="text-gray-500 text-[10px] sm:text-xs uppercase tracking-widest font-semibold mb-2">
                  Available Credit Balance
                </div>
                <div className="text-4xl sm:text-5xl md:text-6xl font-fraunces font-black text-white mb-4 sm:mb-6">
                  ₹{user?.credits?.balance?.toLocaleString() || '0'}<span className="text-gray-500 text-2xl sm:text-3xl">.00</span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-800 pt-4 sm:pt-6 gap-3 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setAutoRecharge(!autoRecharge)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${autoRecharge ? 'bg-[#00ff9d]' : 'bg-gray-700'}`}
                    >
                      <div className={`w-3 h-3 bg-black rounded-full absolute top-1 transition-transform ${autoRecharge ? 'translate-x-6' : 'translate-x-1'}`}></div>
                    </button>
                    <div className="text-[10px] sm:text-xs text-gray-400">
                      <strong className="text-white">Auto-Alerts On</strong> (Low balance warnings)
                    </div>
                  </div>
                  <BellRing size={16} className={autoRecharge ? 'text-[#00ff9d]' : 'text-gray-600'} />
                </div>
              </div>
            </div>

            {/* Top-up Interface */}
            <div className="bg-[#0a0a0f] border border-gray-800 rounded-2xl p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-fraunces font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                <CreditCard size={20} className="text-[#00ff9d]" /> Add Credits
              </h2>
              
              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4"
                  >
                    <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-red-400 font-mono">{error}</p>
                        <button
                          onClick={() => setError(null)}
                          className="text-[10px] text-red-500 hover:text-red-400 mt-1 underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-4 sm:mb-6">
                <label className="block text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 sm:mb-3">
                  Select Amount (INR)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {['500', '1000', '2500', '5000'].map(amt => (
                    <motion.button 
                      key={amt}
                      onClick={() => setTopupAmount(amt)}
                      className={`py-2.5 sm:py-3 rounded font-bold transition-colors border text-xs sm:text-sm ${
                        topupAmount === amt 
                          ? 'bg-[#00ff9d]/10 text-[#00ff9d] border-[#00ff9d]/30' 
                          : 'bg-black text-gray-400 border-gray-800 hover:border-gray-600'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      ₹{amt}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="mb-6 sm:mb-8">
                <label className="block text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 sm:mb-3">
                  Or Enter Custom Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
                  <input 
                    type="number" 
                    value={topupAmount}
                    onChange={e => setTopupAmount(e.target.value)}
                    className="w-full bg-black border border-gray-800 rounded pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-white font-bold focus:outline-none focus:border-[#00ff9d]/50 transition-colors text-sm"
                  />
                </div>
              </div>

              <motion.button 
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-[#00ff9d] text-[#050508] py-3 sm:py-4 rounded font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <><Loader2 className="animate-spin" size={16} /> INITIALIZING GATEWAY...</>
                ) : (
                  <>
                    Proceed to Checkout <ChevronRight size={14} />
                  </>
                )}
              </motion.button>
              
              <div className="mt-3 sm:mt-4 flex justify-center gap-2 sm:gap-4 opacity-50 grayscale">
                <span className="text-[10px] border border-gray-700 px-2 py-1 rounded">UPI</span>
                <span className="text-[10px] border border-gray-700 px-2 py-1 rounded">Razorpay</span>
                <span className="text-[10px] border border-gray-700 px-2 py-1 rounded">VISA / MC</span>
              </div>
            </div>
          </div>

          {/* Right Column: Invoicing */}
          <div className="md:col-span-2">
            <div className="bg-[#0a0a0f] border border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-800">
                <h3 className="font-fraunces font-bold text-white text-sm sm:text-base">Billing History</h3>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Past receipts & invoices.</p>
              </div>
              <div className="divide-y divide-gray-800">
                {transactions.map(trx => (
                  <div key={trx.id} className="p-3 sm:p-6 hover:bg-[#12161e] transition-colors flex justify-between items-center group">
                    <div>
                      <div className="text-white font-bold mb-0.5 text-xs sm:text-sm">{trx.amount}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 font-mono">{trx.date} • {trx.method}</div>
                    </div>
                    <button className="text-gray-600 group-hover:text-[#00ff9d] transition-colors p-1.5 sm:p-2" title="Download PDF">
                      <Download size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-3 sm:p-4 bg-[#0d1117] text-center border-t border-gray-800">
                <button className="text-[10px] sm:text-xs text-[#00ff9d] uppercase tracking-wider font-semibold hover:underline">
                  View All Records
                </button>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 border border-[#00ff9d]/20 bg-[#00ff9d]/5 rounded-xl">
              <h4 className="text-[#00ff9d] text-[10px] sm:text-xs font-bold flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="sm:w-4 sm:h-4" /> No Hidden Fees
              </h4>
              <p className="text-[10px] sm:text-xs text-gray-400 leading-relaxed">
                You only pay for exactly the tokens you use. Credits never expire. Read our full{' '}
                <Link href="/terms" className="underline hover:text-white">pricing policy</Link>.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}