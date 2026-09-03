'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Sparkles, Zap } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { SectionHeading } from '@/components/ui/motion-sections'
import { GlowingOrb, RevealOnScroll } from '@/components/ui/motion-primitives'
import { ElegantShape } from '@/components/ui/shape-landing-hero'
import { useState } from 'react'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { type Currency, CURRENCY_SYMBOLS, convertCurrency } from '@/lib/currency'

export default function PricingPage() {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [currency, setCurrency] = useState<Currency>('INR')
  const [customAmount, setCustomAmount] = useState<number | string>(500)

  const plans = [
    { name: 'Free', monthly: 0, annual: 0, tokens: '50K', features: ['Free & Indic models', '10 req/min', 'Community support'], popular: false },
    { name: 'Starter', monthly: 499, annual: 374, tokens: '10M', features: ['All 150+ models including Sarvam', '60 req/min', 'Email support 48h', 'Usage analytics'], popular: true },
    { name: 'Pro', monthly: 4999, annual: 3749, tokens: '65M', features: ['Priority routing', '500 req/min', 'Email support 24h', 'Team (5 seats)'], popular: false },
    { name: 'Team', monthly: 18999, annual: 14249, tokens: '260M', features: ['Dedicated routing', '2000 req/min', 'WhatsApp & Priority support', '20 seats + admin'], popular: false },
  ]

  const creditPacks = [
    { name: 'Micro', priceINR: 99, credits: '1,000', tokens: '1M' },
    { name: 'Small', priceINR: 499, credits: '5,500', tokens: '5.5M' },
    { name: 'Medium', priceINR: 1499, credits: '18,000', tokens: '18M' },
    { name: 'Large', priceINR: 4999, credits: '65,000', tokens: '65M' },
    { name: 'XL', priceINR: 14999, credits: '200,000', tokens: '200M' },
  ]

  const numericCustomAmount = typeof customAmount === 'number' ? customAmount : parseFloat(customAmount) || 0
  const estimatedCredits = Math.round(numericCustomAmount * 12)
  const estimatedTokensM = ((numericCustomAmount * 12) / 1000).toFixed(1)

  // Payment methods shown per selected currency
  const PAYMENT_METHODS: Record<Currency, string[]> = {
    BDT: ['bKash', 'Nagad', 'Rocket', 'USDT (TRC20)', 'Bitcoin', 'Visa/Mastercard'],
    INR: ['UPI', 'PhonePe', 'Google Pay', 'Paytm', 'Net Banking', 'RuPay / Visa / Mastercard', 'USDT (TRC20)'],
    USD: ['Visa/Mastercard', 'Stripe', 'USDT (TRC20)', 'Bitcoin'],
    PKR: ['JazzCash', 'Easypaisa', 'Bank Transfer', 'USDT (TRC20)', 'Visa/Mastercard'],
  }

  const PAYMENT_SUBTITLE: Record<Currency, string> = {
    BDT: 'Pay in BDT via bKash, Nagad or Rocket. No international card required.',
    INR: 'Pay in INR via UPI, PhonePe, Google Pay or Paytm. No international card required.',
    USD: 'Pay in USD via card, Stripe or crypto — accepted worldwide.',
    PKR: 'Pay in PKR via JazzCash or Easypaisa. No international card required.',
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-24 overflow-hidden">
        <GlowingOrb className="-top-20 left-1/4" color="#ff6b4a" size={500} />
        <ElegantShape delay={0.3} width={400} height={100} rotate={12} gradient="from-[#ff6b4a]/[0.08]" className="left-[-5%] top-[20%]" />
        <ElegantShape delay={0.5} width={300} height={80} rotate={-15} gradient="from-[#00ff88]/[0.06]" className="right-[0%] bottom-[10%]" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <SectionHeading badge="Elite Infrastructure" title={<>Scale with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff8a6a] to-[#ff6b4a] italic">Confidence</span></>} subtitle={PAYMENT_SUBTITLE[currency]} />

          {/* Currency & Period Toggle */}
          <div className="flex justify-center items-center gap-6 mb-14">
            <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="bg-[#141218] border border-gray-800 rounded-full px-6 py-2.5 text-sm font-mono uppercase tracking-wider text-white focus:outline-none focus:border-[#ff6b4a] transition-colors">
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="BDT">BDT (৳)</option>
              <option value="PKR">PKR (₨)</option>
            </select>
            <div className="relative bg-[#141218] border border-gray-800 rounded-full p-1 flex items-center">
              <button className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-mono uppercase tracking-wider transition-colors duration-300 ${period === 'monthly' ? 'text-[#0a0a0f]' : 'text-gray-400'}`} onClick={() => setPeriod('monthly')}>Monthly</button>
              <button className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-mono uppercase tracking-wider transition-colors duration-300 ${period === 'annual' ? 'text-[#0a0a0f]' : 'text-gray-400'}`} onClick={() => setPeriod('annual')}>
                Annual <span className="ml-1 text-[10px] text-[#00ff88] font-bold">-25%</span>
              </button>
              <motion.div className="absolute top-1 bottom-1 rounded-full bg-[#ff6b4a]" layout transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ left: period === 'monthly' ? '4px' : '50%', width: 'calc(50% - 4px)' }} />
            </div>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-4 gap-4 mb-24">
            {plans.map((plan, i) => {
              const basePriceINR = period === 'monthly' ? plan.monthly : plan.annual
              const price = convertCurrency(basePriceINR, currency)
              const symbol = CURRENCY_SYMBOLS[currency]
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: i * 0.1 }} viewport={{ once: true }} whileHover={{ y: -8, transition: { duration: 0.3 } }} className={`relative bg-[#0d1117] border rounded-2xl p-8 transition-all group ${plan.popular ? 'border-[#ff6b4a] shadow-[0_0_60px_rgba(255,107,74,0.15)] scale-[1.02] z-10' : 'border-gray-800 hover:border-[#ff6b4a]/40'}`}>
                  {plan.popular && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.5 }} className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1 bg-gradient-to-r from-[#ff6b4a] to-[#c8381a] text-white text-[10px] font-mono uppercase tracking-wider rounded-full font-bold shadow-[0_0_20px_rgba(255,107,74,0.4)]">
                      <Sparkles size={10} /> Most Popular
                    </motion.div>
                  )}
                  <div className="text-center">
                    <div className="font-fraunces text-lg font-bold text-white mb-4 uppercase tracking-tighter">{plan.name}</div>
                    <div className="mb-1 flex items-baseline justify-center gap-1">
                      <span className="text-gray-400 text-sm">{symbol}</span>
                      <AnimatedCounter value={price} className={`text-4xl font-fraunces font-black ${plan.popular ? 'text-[#ff6b4a]' : 'text-white'}`} decimals={0} />
                    </div>
                    <div className="text-xs font-mono text-gray-500 mb-2">/{period === 'monthly' ? 'month' : 'mo, billed annually'}</div>
                    <div className="text-sm text-[#ff6b4a] font-mono mb-6 bg-[#ff6b4a]/5 py-1.5 rounded-full border border-[#ff6b4a]/10"><Zap size={12} className="inline mr-1" />{plan.tokens} tokens</div>
                    <ul className="space-y-3 mb-8 text-left">
                      {plan.features.map((f, j) => (
                        <motion.li key={j} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + j * 0.05 }} viewport={{ once: true }} className="text-xs text-gray-400 font-mono flex items-start gap-2">
                          <Check size={14} className="text-[#ff6b4a] mt-0.5 shrink-0" />{f}
                        </motion.li>
                      ))}
                    </ul>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link href={`/checkout?plan=${plan.name.toLowerCase()}`} className={`block w-full py-3.5 rounded-xl font-mono text-xs uppercase tracking-wider transition-all font-bold ${plan.popular ? 'bg-gradient-to-r from-[#ff6b4a] to-[#c8381a] text-white hover:shadow-[0_0_30px_rgba(255,107,74,0.5)]' : 'border border-gray-700 text-gray-400 hover:border-[#ff6b4a] hover:text-[#ff6b4a]'}`}>Get Started</Link>
                    </motion.div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Pay As You Go — Redesigned Custom Amount Recharge */}
          <SectionHeading badge="Pay As You Go" title="Flexible Custom Recharge" subtitle="Recharge any custom amount you want. Credits never expire and work on all 150+ models." />

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto bg-[#0d1117] border border-[#ff6b4a]/30 rounded-3xl p-8 mb-16 shadow-[0_0_50px_rgba(255,107,74,0.08)] relative overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-mono text-[#ff6b4a] uppercase tracking-wider font-semibold block mb-2">Custom Top-up</span>
                <h3 className="text-2xl font-fraunces font-bold text-white mb-2">Recharge Desired Amount</h3>
                <p className="text-xs text-gray-400 mb-6 font-mono">Enter any custom amount in {currency} or tap a quick preset. Instant automated credit allocation.</p>

                {/* Amount Input */}
                <div className="relative mb-6">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[#ff6b4a]">
                    {CURRENCY_SYMBOLS[currency]}
                  </span>
                  <input
                    type="number"
                    min="10"
                    max="1000000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount (e.g. 500)"
                    className="w-full bg-[#141218] border border-gray-700 focus:border-[#ff6b4a] rounded-xl py-3.5 pl-10 pr-4 text-xl font-mono text-white outline-none transition-colors"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {[100, 500, 1000, 2500, 5000, 10000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomAmount(preset)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                        Number(customAmount) === preset
                          ? 'bg-[#ff6b4a] text-white font-bold shadow-[0_0_15px_rgba(255,107,74,0.4)]'
                          : 'bg-[#141218] border border-gray-800 text-gray-400 hover:border-gray-600 hover:text-white'
                      }`}
                    >
                      {CURRENCY_SYMBOLS[currency]}{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Calculation Card */}
              <div className="bg-[#141218] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-4">Recharge Summary</div>
                  
                  <div className="flex justify-between items-center mb-3 border-b border-gray-800/80 pb-3">
                    <span className="text-xs font-mono text-gray-400">Total Amount</span>
                    <span className="text-lg font-mono font-bold text-white">
                      {CURRENCY_SYMBOLS[currency]}{numericCustomAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-3 border-b border-gray-800/80 pb-3">
                    <span className="text-xs font-mono text-gray-400">Credits Earned</span>
                    <span className="text-lg font-mono font-bold text-[#00ff88]">
                      {estimatedCredits.toLocaleString('en-IN')} credits
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-mono text-gray-400">Est. Tokens</span>
                    <span className="text-xs font-mono font-bold text-[#ff6b4a]">
                      ~{estimatedTokensM}M Tokens
                    </span>
                  </div>
                </div>

                <Link
                  href={`/checkout?amount=${numericCustomAmount}`}
                  className="w-full py-4 bg-gradient-to-r from-[#ff6b4a] to-[#c8381a] text-white text-center rounded-xl font-mono text-xs uppercase tracking-wider font-bold hover:shadow-[0_0_30px_rgba(255,107,74,0.5)] transition-all"
                >
                  Recharge {CURRENCY_SYMBOLS[currency]}{numericCustomAmount.toLocaleString('en-IN')} Now
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Quick Credit Pack Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-20">
            {creditPacks.map((p, i) => {
              const price = convertCurrency(p.priceINR, currency)
              const symbol = CURRENCY_SYMBOLS[currency]
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }} whileHover={{ y: -6, transition: { duration: 0.2 } }} onClick={() => setCustomAmount(price)} className="bg-[#0d1117] border border-gray-800 rounded-2xl p-6 text-center hover:border-[#ff6b4a]/40 transition-all group cursor-pointer">
                  <div className="text-xs font-mono text-gray-500 mb-2 group-hover:text-white transition-colors uppercase">{p.name}</div>
                  <div className="text-2xl font-fraunces font-black text-[#ff6b4a] mb-1">{symbol}{price}</div>
                  <div className="text-[10px] font-mono text-gray-600">{p.credits} credits</div>
                </motion.div>
              )
            })}
          </div>

          {/* Payment */}
          <RevealOnScroll>
            <div className="p-8 border border-gray-800 rounded-2xl bg-[#0d1117]/50 backdrop-blur-sm text-center relative overflow-hidden">
              <GlowingOrb className="top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" color="#ff6b4a" size={300} />
              <div className="relative z-10">
                <div className="font-mono text-[10px] uppercase tracking-[3px] text-gray-500 mb-6">Secured Global & Local Payment Gateways</div>
                <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-xs font-mono text-gray-400">
                  {PAYMENT_METHODS[currency].map((m, i) => (
                    <motion.span key={`${currency}-${i}`} whileHover={{ scale: 1.1, color: '#ff6b4a' }} className="cursor-default transition-colors">{m}</motion.span>
                  ))}
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </main>
  )
}
