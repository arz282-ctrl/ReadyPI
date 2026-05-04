'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { motion } from 'framer-motion'
import {
  User, Mail, Shield, Key, Zap, Calendar, CreditCard,
  ChevronRight, Lock, Eye, EyeOff, Check, AlertCircle, Loader2
} from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'

const tierColors: Record<string, string> = {
  free: '#6b6b76',
  starter: '#ff6b4a',
  pro: '#00ff88',
  team: '#4285f4',
  enterprise: '#d4a574',
}

export default function ProfilePage() {
  const { user, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', new_password: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 size={32} className="text-[#ff6b4a] animate-spin" />
      </div>
    )
  }

  if (!user) {
    router.push('/login?redirect=/profile')
    return null
  }

  const tierColor = tierColors[user.plan_tier] || tierColors.free

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (passwordForm.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }
    if (passwordForm.new_password !== passwordForm.confirm) {
      setPasswordError('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      await api.put('/auth/password', {
        current_password: passwordForm.current,
        new_password: passwordForm.new_password,
      })
      setPasswordSuccess(true)
      setPasswordForm({ current: '', new_password: '', confirm: '' })
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  const infoCards = [
    {
      icon: <Zap size={20} />,
      label: 'Credit Balance',
      value: (user.credits?.balance ?? 0).toLocaleString(),
      sub: `${(user.credits?.total_used ?? 0).toLocaleString()} used lifetime`,
      color: '#ff6b4a',
      href: '/dashboard',
    },
    {
      icon: <Key size={20} />,
      label: 'API Keys',
      value: String(user.api_key_count ?? 0),
      sub: 'Active keys',
      color: '#00ff88',
      href: '/dashboard?tab=keys',
    },
    {
      icon: <CreditCard size={20} />,
      label: 'Plan',
      value: user.plan_tier.charAt(0).toUpperCase() + user.plan_tier.slice(1),
      sub: user.plan_tier === 'free' ? 'Upgrade for more' : 'Active subscription',
      color: tierColor,
      href: '/pricing',
    },
    {
      icon: <Calendar size={20} />,
      label: 'Member Since',
      value: memberSince,
      sub: user.email_verified ? 'Email verified' : 'Email not verified',
      color: '#4285f4',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff6b4a] to-[#c8381a] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-[#ff6b4a]/20">
              {user.full_name
                ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : user.email[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-fraunces font-black text-white">{user.full_name || 'User'}</h1>
              <p className="text-gray-500 text-sm font-mono">{user.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
        >
          {infoCards.map((card, i) => (
            <div key={i} className="relative group">
              {card.href ? (
                <Link href={card.href} className="block">
                  <CardInner card={card} />
                </Link>
              ) : (
                <CardInner card={card} />
              )}
            </div>
          ))}
        </motion.div>

        {/* Account Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111118] border border-[#1f1f23] rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-fraunces font-bold text-white mb-6 flex items-center gap-2">
            <User size={18} className="text-[#ff6b4a]" />
            Account Details
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#1f1f23]">
              <div className="flex items-center gap-3 text-gray-400">
                <Mail size={16} />
                <span className="text-sm">Email</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-mono">{user.email}</span>
                {user.email_verified && (
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#00ff88] bg-[#00ff88]/10 px-2 py-0.5 rounded-md border border-[#00ff88]/20 font-mono font-bold">
                    <Check size={10} /> Verified
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#1f1f23]">
              <div className="flex items-center gap-3 text-gray-400">
                <User size={16} />
                <span className="text-sm">Full Name</span>
              </div>
              <span className="text-sm text-white font-mono">{user.full_name || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#1f1f23]">
              <div className="flex items-center gap-3 text-gray-400">
                <Shield size={16} />
                <span className="text-sm">Plan Tier</span>
              </div>
              <span
                className="text-sm font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-md border"
                style={{ color: tierColor, backgroundColor: `${tierColor}15`, borderColor: `${tierColor}30` }}
              >
                {user.plan_tier}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3 text-gray-400">
                <Calendar size={16} />
                <span className="text-sm">Joined</span>
              </div>
              <span className="text-sm text-white font-mono">{memberSince}</span>
            </div>
          </div>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#111118] border border-[#1f1f23] rounded-2xl p-6"
        >
          <h2 className="text-lg font-fraunces font-bold text-white mb-6 flex items-center gap-2">
            <Lock size={18} className="text-[#ff6b4a]" />
            Change Password
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            {['current', 'new_password', 'confirm'].map((field) => (
              <div key={field}>
                <label className="block text-xs text-gray-500 uppercase tracking-wider font-mono mb-2">
                  {field === 'current' ? 'Current Password' : field === 'new_password' ? 'New Password' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm[field as keyof typeof passwordForm]}
                    onChange={e => setPasswordForm(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full bg-[#0a0a0f] border border-[#1f1f23] rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#ff6b4a]/50 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            {passwordError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                <AlertCircle size={16} />
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="flex items-center gap-2 text-[#00ff88] text-sm bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-xl px-4 py-3">
                <Check size={16} />
                Password changed successfully
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#ff6b4a] text-white px-6 py-3 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold hover:shadow-[0_0_20px_rgba(255,107,74,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              {saving ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  )
}

function CardInner({ card }: { card: { icon: React.ReactNode; label: string; value: string; sub: string; color: string; href?: string } }) {
  return (
    <div className="bg-[#111118] border border-[#1f1f23] rounded-2xl p-5 hover:border-[#ff6b4a]/20 transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-black/20">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
          {card.icon}
        </div>
        {card.href && <ChevronRight size={16} className="text-gray-600 group-hover:text-[#ff6b4a] transition-colors" />}
      </div>
      <div className="text-white font-bold text-lg font-mono">{card.value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
      <div className="text-[10px] text-gray-600 mt-1 font-mono">{card.sub}</div>
    </div>
  )
}
