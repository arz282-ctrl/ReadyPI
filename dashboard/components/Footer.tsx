import Link from 'next/link'
import PiMark from './PiMark'

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0f] border-t border-gray-900 py-16 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="mb-4">
              <PiMark variant="logo" withWordmark />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">Asia's first AI API gateway. One key. 150+ models. Pay in your local currency.</p>
            <div className="font-mono text-[10px] text-[#ff6b4a]">readypi.io</div>
          </div>
          {[
            { title: 'Platform', links: [{ label: 'Documentation', href: '/docs' }, { label: 'Pricing', href: '/pricing' }, { label: 'Playground', href: '/playground' }, { label: 'Models', href: '/models' }] },
            { title: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Blog', href: '/blog' }, { label: 'Contact', href: '/contact' }, { label: 'Discord', href: '/discord' }] },
            { title: 'Legal', links: [{ label: 'Terms', href: '/terms' }, { label: 'Privacy', href: '/privacy' }, { label: 'Security', href: '/security' }, { label: 'API Keys', href: '/api-keys' }] },
          ].map((col, i) => (
            <div key={i}>
              <div className="font-mono text-[9px] uppercase tracking-[3px] text-[#ff6b4a] mb-4">{col.title}</div>
              <ul className="space-y-2">
                {col.links.map((l, j) => (
                  <li key={j}><Link href={l.href} className="text-sm text-gray-500 hover:text-[#ff6b4a] transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-gray-900 flex flex-wrap justify-between items-center gap-4">
          <div className="font-mono text-[9px] uppercase tracking-wider text-gray-600">© 2026 ReadyPi · Rareware Studio · Sylhet, Bangladesh 🇧🇩</div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-gray-600">Ready + API + π · Infinite Access</div>
        </div>
      </div>
    </footer>
  )
}
