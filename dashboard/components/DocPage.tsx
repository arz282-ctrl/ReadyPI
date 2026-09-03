import Link from 'next/link';
import PiMark from './PiMark';

export interface DocSection {
  heading: string;
  body: React.ReactNode;
}

export default function DocPage({
  eyebrow,
  title,
  intro,
  sections,
  updated,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: DocSection[];
  updated?: string;
}) {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-300 flex flex-col">
      <header className="px-8 py-6 border-b border-gray-900 sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" aria-label="ReadyPi home" className="inline-flex">
            <PiMark variant="logo" withWordmark />
          </Link>
          <nav className="flex items-center gap-3 sm:gap-6 font-mono text-[11px] uppercase tracking-widest text-gray-400">
            <Link href="/docs" className="hidden md:inline hover:text-white transition-colors">Docs</Link>
            <Link href="/pricing" className="hidden md:inline hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="hidden sm:inline hover:text-white transition-colors">Login</Link>
            <Link href="/signup" className="bg-[#ff6b4a] text-white px-3 py-2 rounded hover:shadow-[0_0_20px_rgba(255,107,74,0.4)] transition-all whitespace-nowrap">Get Started</Link>
          </nav>
        </div>
      </header>

      <article className="flex-1 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="font-mono text-[10px] uppercase tracking-[4px] text-[#ff6b4a] mb-4">
            {eyebrow}
          </div>
          <h1 className="text-4xl md:text-5xl font-fraunces font-black text-white mb-6 leading-tight">
            {title}
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed mb-12 border-l-2 border-[#ff6b4a]/40 pl-5">
            {intro}
          </p>

          <div className="space-y-12">
            {sections.map((s, i) => (
              <section key={i}>
                <h2 className="text-2xl font-fraunces font-bold text-white mb-4">
                  {s.heading}
                </h2>
                <div className="text-gray-400 leading-relaxed space-y-4">
                  {s.body}
                </div>
              </section>
            ))}
          </div>

          {updated && (
            <div className="mt-16 pt-6 border-t border-gray-900 font-mono text-[10px] uppercase tracking-widest text-gray-600">
              Last updated · {updated}
            </div>
          )}
        </div>
      </article>

      <footer className="px-8 py-6 border-t border-gray-900 text-center font-mono text-[10px] uppercase tracking-wider text-gray-600">
        © 2026 ReadyPi · Mumbai, India
      </footer>
    </main>
  );
}
