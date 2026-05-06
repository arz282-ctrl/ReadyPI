'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { creditsAPI } from '@/lib/api'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, token, loading: authLoading } = useAuth()
  const [selectedPack, setSelectedPack] = useState('small')
  const [paymentMethod, setPaymentMethod] = useState('bkash')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ transaction_id?: string; payment_url?: string; payment_instructions?: string } | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  const packs = [
    { id: 'micro', name: 'Micro', price: '৳199', credits: '1,000' },
    { id: 'small', name: 'Small', price: '৳499', credits: '3,000' },
    { id: 'medium', name: 'Medium', price: '৳999', credits: '7,000' },
    { id: 'large', name: 'Large', price: '৳1,999', credits: '18,000' },
    { id: 'xl', name: 'XL', price: '৳4,999', credits: '50,000' },
  ]

  const methods = [
    { id: 'bkash', name: 'bKash', icon: '📱' },
    { id: 'nagad', name: 'Nagad', icon: '📲' },
    { id: 'rocket', name: 'Rocket', icon: '🚀' },
    { id: 'card', name: 'Card', icon: '💳' },
    { id: 'usdt', name: 'USDT', icon: '🪙' },
    { id: 'btc', name: 'BTC', icon: '₿' },
  ]

  const handleCheckout = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data } = await creditsAPI.createPayment(selectedPack, paymentMethod)
      setResult(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [selectedPack, paymentMethod])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-mono text-sm">Checking authentication...</p>
        </motion.div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!user || !token) {
    return null
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-fraunces font-black text-[#00ff88]">π</span>
            <span className="text-lg font-fraunces font-bold text-white">ReadyPi</span>
          </Link>
          <Link 
            href="/dashboard" 
            className="flex items-center gap-1 text-xs font-mono text-gray-500 hover:text-[#00ff88] transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl sm:text-4xl font-fraunces font-black text-white mb-2 uppercase tracking-tighter">
            Secure <span className="text-[#00ff88]">Checkout</span>
          </h1>
          <p className="text-xs sm:text-sm font-mono text-gray-500 mb-6 sm:mb-10">
            Credits never expire · Instant delivery to your account
          </p>
        </motion.div>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-mono">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-xs text-red-500 hover:text-red-400 mt-1 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {result ? (
            // Success State
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0d1117] border border-[#00ff88]/30 rounded-2xl p-6 sm:p-10 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-[#00ff88]/10 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-8 h-8 text-[#00ff88]" />
              </motion.div>
              
              <h2 className="text-xl sm:text-2xl font-fraunces font-bold text-white mb-2">
                Order Initialized
              </h2>
              
              <p className="text-xs sm:text-sm text-gray-400 font-mono mb-4">
                Transaction ID: <span className="text-[#00ff88]">{result.transaction_id}</span>
              </p>

              {result.payment_instructions && (
                <div className="bg-[#0a0a0f] rounded-lg p-4 mb-6 text-left">
                  <p className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                    {result.payment_instructions}
                  </p>
                </div>
              )}

              <Link 
                href="/dashboard" 
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 bg-[#00ff88] text-[#0a0a0f] font-mono text-xs sm:text-sm font-bold uppercase rounded-lg hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] transition-all"
              >
                Go to Dashboard
              </Link>
            </motion.div>
          ) : (
            // Checkout Form
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 sm:space-y-10"
            >
              {/* Credit Packs */}
              <div>
                <label className="block text-[10px] font-mono text-[#00ff88] uppercase tracking-[3px] mb-3 sm:mb-4">
                  Select Credit Package
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                  {packs.map((p, i) => (
                    <motion.button
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedPack(p.id)}
                      className={`p-3 sm:p-4 rounded-xl text-center transition-all ${
                        selectedPack === p.id 
                          ? 'bg-[#00ff88]/10 border-2 border-[#00ff88]' 
                          : 'bg-[#0d1117] border border-gray-800 hover:border-gray-700'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="text-[9px] sm:text-[10px] font-mono text-gray-500 mb-1 uppercase">{p.name}</div>
                      <div className={`text-base sm:text-lg font-fraunces font-black ${
                        selectedPack === p.id ? 'text-[#00ff88]' : 'text-white'
                      }`}>
                        {p.price}
                      </div>
                      <div className="text-[8px] sm:text-[9px] font-mono text-gray-600 uppercase mt-1">
                        {p.credits} units
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-[10px] font-mono text-[#00ff88] uppercase tracking-[3px] mb-3 sm:mb-4">
                  Choose Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                  {methods.map((m, i) => (
                    <motion.button
                      key={m.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-4 sm:p-6 rounded-xl text-center transition-all flex flex-col items-center gap-1.5 sm:gap-2 ${
                        paymentMethod === m.id 
                          ? 'bg-[#00ff88]/10 border-2 border-[#00ff88]' 
                          : 'bg-[#0d1117] border border-gray-800 hover:border-gray-700'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="text-xl sm:text-2xl">{m.icon}</div>
                      <div className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase ${
                        paymentMethod === m.id ? 'text-[#00ff88]' : 'text-gray-500'
                      }`}>
                        {m.name}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Checkout Button */}
              <motion.button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-4 sm:py-5 bg-[#00ff88] text-[#0a0a0f] font-mono font-bold text-xs sm:text-sm uppercase tracking-[2px] rounded-xl hover:shadow-[0_0_40px_rgba(0,255,136,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Transaction...
                  </>
                ) : (
                  `Complete Payment of ${packs.find(p => p.id === selectedPack)?.price}`
                )}
              </motion.button>
              
              <p className="text-center text-[9px] sm:text-[10px] font-mono text-gray-600 px-4">
                By clicking complete, you agree to our Terms of Service. Secure encrypted transaction.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}