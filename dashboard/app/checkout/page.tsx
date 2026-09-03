'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { creditsAPI } from '@/lib/api'

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlAmount = searchParams?.get('amount')
  const { user, token, loading: authLoading } = useAuth()
  
  const [selectedPack, setSelectedPack] = useState('small')
  const [customAmountInput, setCustomAmountInput] = useState<string>(urlAmount || '')
  const [isCustomMode, setIsCustomMode] = useState<boolean>(Boolean(urlAmount))
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ transaction_id?: string; payment_url?: string; payment_instructions?: string } | null>(null)
  const [utr, setUtr] = useState('')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  const packs = [
    { id: 'micro', name: 'Micro', price: '₹99', credits: '1,000' },
    { id: 'small', name: 'Small', price: '₹499', credits: '5,500' },
    { id: 'medium', name: 'Medium', price: '₹1,499', credits: '18,000' },
    { id: 'large', name: 'Large', price: '₹4,999', credits: '65,000' },
    { id: 'xl', name: 'XL', price: '₹14,999', credits: '200,000' },
  ]

  const methods = [
    { id: 'upi', name: 'UPI (PhonePe/GPay/Paytm)', icon: '⚡' },
    { id: 'razorpay', name: 'Razorpay / Cards', icon: '💳' },
    { id: 'netbanking', name: 'Net Banking', icon: '🏦' },
    { id: 'usdt', name: 'USDT Crypto', icon: '🪙' },
    { id: 'card', name: 'International Card', icon: '🌐' },
  ]

  // UPI Config
  const UPI_ID = 'readypi@upi'
  const UPI_PAYEE = 'ReadyPI India AI'
  const packPricesINR: Record<string, number> = { micro: 99, small: 499, medium: 1499, large: 4999, xl: 14999 }
  
  const selectedInr = isCustomMode
    ? (parseFloat(customAmountInput) || 500)
    : (packPricesINR[selectedPack] || 499)

  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false)
      if ((window as any).Razorpay) return resolve(true)
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })

  const handleCheckout = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (paymentMethod === 'upi') {
        if (!utr.trim()) {
          setError('Pay via UPI first, then enter the 12-digit UTR from your UPI app.')
          setLoading(false)
          return
        }
        const { default: api } = await import('@/lib/api')
        const { data } = await api.post('/payment/upi/submit', {
          amount_inr: selectedInr,
          utr: utr.trim(),
        })
        setResult({
          transaction_id: data.id,
          payment_instructions: `₹${selectedInr} UPI payment submitted (UTR: ${utr.trim()}).\n${data.credits_pending || Math.round(selectedInr * 12)} credits will be added after verification — usually within a few minutes.`,
        })
      } else {
        const { default: api } = await import('@/lib/api')
        const payload = isCustomMode
          ? { custom_amount: selectedInr, payment_method: paymentMethod }
          : { package_id: selectedPack, payment_method: paymentMethod }

        const { data } = await api.post('/payment/create', payload)

        if (data.payment_url) {
          // Hosted checkout page (NOWPayments crypto invoice, or SSLCommerz fallback) — redirect there
          window.location.href = data.payment_url
          return
        }

        if (data.order_id && data.key_id) {
          // Razorpay (UPI/cards/net banking) — open the Checkout.js widget
          const scriptLoaded = await loadRazorpayScript()
          if (!scriptLoaded) {
            setError('Could not load the payment gateway. Check your connection and try again.')
            setLoading(false)
            return
          }

          const rzp = new (window as any).Razorpay({
            key: data.key_id,
            amount: data.amount,
            currency: data.currency || 'INR',
            name: 'ReadyPI',
            description: 'ReadyPI credits top-up',
            order_id: data.order_id,
            prefill: { email: user?.email, name: user?.full_name },
            theme: { color: '#00ff88' },
            handler: async (response: {
              razorpay_order_id: string
              razorpay_payment_id: string
              razorpay_signature: string
            }) => {
              try {
                await api.post('/payment/razorpay/verify', {
                  transaction_id: data.transaction_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                })
                setResult({
                  transaction_id: data.transaction_id,
                  payment_instructions: `Payment successful — ${Number(data.credits || 0).toLocaleString('en-IN')} credits added to your account.`,
                })
              } catch {
                setError(`Payment received but verification failed. Contact support with transaction ID ${data.transaction_id}.`)
              } finally {
                setLoading(false)
              }
            },
            modal: {
              ondismiss: () => setLoading(false),
            },
          })
          rzp.on('payment.failed', () => {
            setError('Payment failed or was cancelled. Please try again.')
            setLoading(false)
          })
          rzp.open()
          return
        }

        setResult(data)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [selectedPack, paymentMethod, utr, selectedInr, isCustomMode, user])

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
              {/* Select Package or Custom Amount */}
              <div>
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <label className="block text-[10px] font-mono text-[#00ff88] uppercase tracking-[3px]">
                    Select Package or Custom Amount
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCustomMode(false)}
                      className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase transition-all ${
                        !isCustomMode ? 'bg-[#00ff88] text-[#0a0a0f] font-bold' : 'bg-[#141218] border border-gray-800 text-gray-400'
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCustomMode(true)}
                      className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase transition-all ${
                        isCustomMode ? 'bg-[#00ff88] text-[#0a0a0f] font-bold' : 'bg-[#141218] border border-gray-800 text-gray-400'
                      }`}
                    >
                      Custom Top-up
                    </button>
                  </div>
                </div>

                {isCustomMode ? (
                  <div className="bg-[#0d1117] border border-[#00ff88]/30 rounded-xl p-4 sm:p-6">
                    <label className="block text-xs font-mono text-gray-400 mb-2">Recharge Custom Amount (INR ₹)</label>
                    <div className="relative mb-3">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#00ff88]">₹</span>
                      <input
                        type="number"
                        min="10"
                        value={customAmountInput}
                        onChange={(e) => setCustomAmountInput(e.target.value)}
                        placeholder="Enter amount (e.g. 750)"
                        className="w-full bg-[#141218] border border-gray-700 focus:border-[#00ff88] rounded-xl py-3 pl-9 pr-4 font-mono text-white text-lg outline-none transition-colors"
                      />
                    </div>
                    <div className="flex justify-between text-xs font-mono text-gray-400">
                      <span>Credits earned: <strong className="text-[#00ff88]">{Math.round(selectedInr * 12).toLocaleString('en-IN')}</strong></span>
                      <span>Est. Tokens: <strong className="text-[#ff6b4a]">~{((selectedInr * 12) / 1000).toFixed(1)}M</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                    {packs.map((p, i) => (
                      <motion.button
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => { setSelectedPack(p.id); setIsCustomMode(false); }}
                        className={`p-3 sm:p-4 rounded-xl text-center transition-all ${
                          !isCustomMode && selectedPack === p.id 
                            ? 'bg-[#00ff88]/10 border-2 border-[#00ff88]' 
                            : 'bg-[#0d1117] border border-gray-800 hover:border-gray-700'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="text-[9px] sm:text-[10px] font-mono text-gray-500 mb-1 uppercase">{p.name}</div>
                        <div className={`text-base sm:text-lg font-fraunces font-black ${
                          !isCustomMode && selectedPack === p.id ? 'text-[#00ff88]' : 'text-white'
                        }`}>
                          {p.price}
                        </div>
                        <div className="text-[8px] sm:text-[9px] font-mono text-gray-600 uppercase mt-1">
                          {p.credits} units
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
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

              {/* UPI Payment Panel */}
              <AnimatePresence>
                {paymentMethod === 'upi' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#0d1117] border border-[#00ff88]/30 rounded-2xl p-5 sm:p-6">
                      <div className="text-[10px] font-mono text-[#00ff88] uppercase tracking-[3px] mb-4">
                        Pay ₹{selectedInr} via any UPI app
                      </div>
                      <div className="flex flex-col sm:flex-row gap-5 items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/payments/upi-qr.png"
                          alt="UPI QR code"
                          className="w-40 h-40 rounded-xl bg-white p-2 shrink-0"
                        />
                        <div className="flex-1 space-y-3 text-center sm:text-left">
                          <div>
                            <div className="text-[9px] font-mono text-gray-500 uppercase mb-1">UPI ID</div>
                            <div className="text-sm font-mono text-white select-all">{UPI_ID}</div>
                            <div className="text-[10px] font-mono text-gray-500">{UPI_PAYEE}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-mono text-gray-500 uppercase mb-1">
                              After paying, enter the UTR / transaction reference
                            </div>
                            <input
                              value={utr}
                              onChange={(e) => setUtr(e.target.value)}
                              placeholder="e.g. 415223456789"
                              className="w-full bg-[#0a0a0f] border border-gray-800 rounded-lg px-4 py-2.5 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff88] transition-colors"
                            />
                            <div className="text-[9px] font-mono text-gray-600 mt-1.5">
                              Find it in your UPI app under payment details (12-digit number).
                              Credits are added after verification.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                  `Complete Payment of ${paymentMethod === 'upi' ? `₹${selectedInr}` : packs.find(p => p.id === selectedPack)?.price}`
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-gray-400">
        <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin mx-auto mb-2" />
        <span>Loading Checkout...</span>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}