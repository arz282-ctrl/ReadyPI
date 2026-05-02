'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { X, Menu } from 'lucide-react'
import PiMark from './PiMark'

export default function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const links = [
    { href: '/docs', label: 'Docs' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/playground', label: 'Playground' },
    { href: '/models', label: 'Models' },
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

        {/* Auth Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="font-mono text-xs uppercase tracking-wider text-gray-400 hover:text-white transition-colors px-4 py-2">
            Login
          </Link>
          <Link href="/signup" className="font-mono text-xs uppercase tracking-wider bg-[#ff6b4a] text-white px-5 py-2 rounded-lg hover:shadow-[0_0_20px_rgba(255,107,74,0.4)] transition-all">
            Get Started
          </Link>
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

      {/* Mobile Menu — Full-screen overlay to prevent viewport breakage */}
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

            <div className="border-t border-[#1f1f23] mt-4 pt-4 flex flex-col gap-3">
              <Link href="/login" className="font-mono text-sm uppercase tracking-wider text-gray-400 hover:text-white py-3 px-4 rounded-xl transition-colors text-center">
                Login
              </Link>
              <Link href="/signup" className="font-mono text-sm uppercase tracking-wider bg-[#ff6b4a] text-white py-3 px-4 rounded-xl text-center font-semibold">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
