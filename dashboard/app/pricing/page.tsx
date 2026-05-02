'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Sparkles, Zap, CreditCard, ArrowRight } from 'lucide-react'
import PiMark from '@/components/PiMark'
import { SectionHeading } from '@/components/ui/motion-sections'
import { GlowingOrb, RevealOnScroll } from '@/components/ui/motion-primitives'
import { ElegantShape } from '@/components/ui/shape-landing-hero'
import { useState } from 'react'
import { AnimatedCounter } from '@/components/ui/animated-counter'

export default function PricingPage() {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly')

  const plans = [
    { name: 'Free', monthly: 0, annual: 0, tokens: '50K', features: ['3 free models', '10 req/min', 'Community support'], popular: false },
    { name: 'Starter', monthly: 499, annual: 374, tokens: '10M', features: ['All 8+ models', '60 req/min', 'Email support 48h', 'Usage analytics'], popular: true },
    { name: 'Pro', monthly: 999, annual: 749, tokens: '25M', features: ['Priority routing', '200 req/min', 'Email support 24h', 'Team (3 seats)'], popular: false },
    { name: 'Team', monthly: 2999, annual: 2249, tokens: '100M', features: ['Dedicated routing', '1000 req/min', 'WhatsApp support', '10 seats + admin'], popular: false },
  ]

  const creditPacks = [
    { name: 'Micro', price: '৳199', credits: '1,000', tokens: '1M' },
    { name: 'Small', price: '৳499', credits: '3,000', tokens: '3M' },
    { name: 'Medium', price: '৳999', credits: '7,000', tokens: '7M' },
    { name: 'Large', price: '৳1,999', credits: '18,000', tokens: '18M' },
    { name: 'XL', price: '৳4,999', credits: '50,000', tokens: '50M' },
  ]

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2"><PiMark variant="logo" withWordmark /></Link>
          <div className="flex gap-4">
            <Link href="/signup" className="px-5 py-2.5 bg-gradient-to-r from-[#ff6b4a] to-[#c8381a] text-white font-mono text-xs uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,107,74,0.4)] transition-all font-bold">Start Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <GlowingOrb className="-top-20 left-1/4" color="#ff6b4a" size={500} />
        <ElegantShape delay={0.3} width={400} height={100} rotate={12} gradient="from-[#ff6b4a]/[0.08]" className="left-[-5%] top-[20%]" />
        <ElegantShape delay={0.5} width={300} height={80} rotate={-15} gradient="from-[#00ff88]/[0.06]" className="right-[0%] bottom-[10%]" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <SectionHeading badge="Elite Infrastructure" title={<>Scale with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff8a6a] to-[#ff6b4a] italic">Confidence</span></>} subtitle="Pay in BDT via bKash, Nagad or Rocket. No international card required." />

          {/* Period Toggle */}
          <div className="flex justify-center mb-14">
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
              const price = period === 'monthly' ? plan.monthly : plan.annual
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
                      <span className="text-gray-400 text-sm">৳</span>
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
                      <Link href="/signup" className={`block w-full py-3.5 rounded-xl font-mono text-xs uppercase tracking-wider transition-all font-bold ${plan.popular ? 'bg-gradient-to-r from-[#ff6b4a] to-[#c8381a] text-white hover:shadow-[0_0_30px_rgba(255,107,74,0.5)]' : 'border border-gray-700 text-gray-400 hover:border-[#ff6b4a] hover:text-[#ff6b4a]'}`}>Get Started</Link>
                    </motion.div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Credit Packs */}
          <SectionHeading badge="Pay As You Go" title="Credit Packs" subtitle="Credits never expire. Instant top-up via local gateways." />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-20">
            {creditPacks.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }} whileHover={{ y: -6, transition: { duration: 0.2 } }} className="bg-[#0d1117] border border-gray-800 rounded-2xl p-6 text-center hover:border-[#ff6b4a]/40 transition-all group cursor-pointer">
                <div className="text-xs font-mono text-gray-500 mb-2 group-hover:text-white transition-colors uppercase">{p.name}</div>
                <div className="text-2xl font-fraunces font-black text-[#ff6b4a] mb-1">{p.price}</div>
                <div className="text-[10px] font-mono text-gray-600">{p.credits} credits</div>
              </motion.div>
            ))}
          </div>

          {/* Payment */}
          <RevealOnScroll>
            <div className="p-8 border border-gray-800 rounded-2xl bg-[#0d1117]/50 backdrop-blur-sm text-center relative overflow-hidden">
              <GlowingOrb className="top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" color="#ff6b4a" size={300} />
              <div className="relative z-10">
                <div className="font-mono text-[10px] uppercase tracking-[3px] text-gray-500 mb-6">Secured Global & Local Payment Gateways</div>
                <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-xs font-mono text-gray-400">
                  {['bKash', 'Nagad', 'Rocket', 'USDT (TRC20)', 'Bitcoin', 'Visa/Mastercard'].map((m, i) => (
                    <motion.span key={i} whileHover={{ scale: 1.1, color: '#ff6b4a' }} className="cursor-default transition-colors">{m}</motion.span>
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
