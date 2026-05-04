'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { X, Menu, ChevronDown, LayoutDashboard, User, Key, CreditCard, LogOut, Zap } from 'lucide-react'
import PiMark from './PiMark'
import { useAuth } from '@/lib/auth-context'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMenuOpen(false)
    setDropdownOpen(false)
  }, [pathname])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const links = [
    { href: '/docs', label: 'Docs' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/playground', label: 'Playground' },
    { href: '/models', label: 'Models' },
  ]

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?'

  const dropdownItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { href: '/profile', label: 'Profile', icon: <User size={15} /> },
    { href: '/dashboard?tab=keys', label: 'API Keys', icon: <Key size={15} /> },
    { href: '/pricing', label: 'Billing', icon: <CreditCard size={15} /> },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1f1f23] bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group flex-shrink-0" aria-label="ReadyPi home">
          <PiMark variant="logo" withWordmark className="group-hover:drop-shadow-[0_0_12px_rgba(255,107,74,0.8)] transition-all" />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={`font-mono text-xs uppercase tracking-wider transition-colors ${pathname === l.href ? 'text-[#ff6b4a]' : 'text-gray-400 hover:text-white'}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Auth Section (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-[#1f1f23] animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {/* Credits pill */}
              <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff6b4a]/10 border border-[#ff6b4a]/20 hover:border-[#ff6b4a]/40 transition-all">
                <Zap size={12} className="text-[#ff6b4a]" />
                <span className="font-mono text-xs text-[#ff6b4a] font-semibold">
                  {(user.credits?.balance ?? 0).toLocaleString()}
                </span>
              </Link>

              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6b4a] to-[#c8381a] flex items-center justify-center text-white text-xs font-bold">
                    {userInitials}
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#111118] border border-[#1f1f23] rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-[#1f1f23]">
                      <div className="text-sm text-white font-semibold truncate">{user.full_name || 'User'}</div>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md bg-[#ff6b4a]/10 border border-[#ff6b4a]/20">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#ff6b4a] font-semibold">{user.plan_tier}</span>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      {dropdownItems.map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-[#1f1f23] py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors w-full text-left"
                      >
                        <LogOut size={15} />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link href="/login" className="font-mono text-xs uppercase tracking-wider text-gray-400 hover:text-white transition-colors px-4 py-2">
                Login
              </Link>
              <Link href="/signup" className="font-mono text-xs uppercase tracking-wider bg-[#ff6b4a] text-white px-5 py-2 rounded-lg hover:shadow-[0_0_20px_rgba(255,107,74,0.4)] transition-all">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-400 hover:text-white p-2 -mr-2 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-[#0a0a0f] border-t border-[#1f1f23]">
          <div className="flex flex-col p-6 gap-1 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`font-mono text-sm uppercase tracking-wider py-3 px-4 rounded-xl transition-colors ${
                  pathname === l.href
                    ? 'text-[#ff6b4a] bg-[#ff6b4a]/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {l.label}
              </Link>
            ))}

            <div className="border-t border-[#1f1f23] mt-4 pt-4 flex flex-col gap-1">
              {user ? (
                <>
                  {/* Mobile user info */}
                  <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b4a] to-[#c8381a] flex items-center justify-center text-white text-sm font-bold">
                      {userInitials}
                    </div>
                    <div>
                      <div className="text-sm text-white font-semibold">{user.full_name || 'User'}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  {dropdownItems.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 font-mono text-sm uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 py-3 px-4 rounded-xl transition-colors"
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 font-mono text-sm uppercase tracking-wider text-gray-400 hover:text-red-400 hover:bg-white/5 py-3 px-4 rounded-xl transition-colors text-left"
                  >
                    <LogOut size={15} />
                    Log Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/login" className="font-mono text-sm uppercase tracking-wider text-gray-400 hover:text-white py-3 px-4 rounded-xl transition-colors text-center">
                    Login
                  </Link>
                  <Link href="/signup" className="font-mono text-sm uppercase tracking-wider bg-[#ff6b4a] text-white py-3 px-4 rounded-xl text-center font-semibold">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
