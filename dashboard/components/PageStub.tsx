import Link from 'next/link';
import PiMark from './PiMark';

export default function PageStub({
  eyebrow,
  title,
  body,
  cta,
}: {
  eyebrow: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-300 flex flex-col">
      <header className="px-8 py-6 border-b border-gray-900">
        <Link href="/" aria-label="ReadyPi home" className="inline-flex">
          <PiMark variant="logo" withWordmark />
        </Link>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl text-center">
          <div className="flex justify-center mb-10">
            <PiMark variant="hero" size={280} />
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[4px] text-[#ff6b4a] mb-4">
            {eyebrow}
          </div>
          <h1 className="text-4xl md:text-5xl font-fraunces font-black text-white mb-6 leading-tight">
            {title}
          </h1>
          <p className="text-gray-400 leading-relaxed mb-8">{body}</p>
          {cta && (
            <Link
              href={cta.href}
              className="inline-flex items-center gap-2 bg-[#ff6b4a] text-white px-6 py-3 rounded-lg font-mono text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(255,107,74,0.4)] transition-all"
            >
              {cta.label}
            </Link>
          )}
        </div>
      </section>

      <footer className="px-8 py-6 border-t border-gray-900 text-center font-mono text-[10px] uppercase tracking-wider text-gray-600">
        © 2026 ReadyPi · Mumbai, India
      </footer>
    </main>
  );
}
