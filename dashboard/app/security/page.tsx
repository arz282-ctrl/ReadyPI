import DocPage from '@/components/DocPage';

export const metadata = { title: 'Security — ReadyPi' };

export default function SecurityPage() {
  return (
    <DocPage
      eyebrow="Security"
      title="How we protect your keys."
      intro="Security is a system, not a feature. Here is how the gateway is built, how API keys are handled, and how to report a vulnerability if you find one."
      updated="April 2026"
      sections={[
        {
          heading: 'API key handling',
          body: (
            <>
              <p>Keys are generated server-side using a cryptographically secure random source, prefixed <code className="text-[#ff6b4a] font-mono text-sm">rpi_live_</code> for production and <code className="text-[#ff6b4a] font-mono text-sm">rpi_test_</code> for sandbox. The plaintext is shown to you exactly once at creation; the database stores only a bcrypt hash with cost factor 12.</p>
              <p>Each key is scoped to a single workspace and can carry an optional monthly INR (₹) spend cap. Revocation is instant — within milliseconds the key is invalidated across every gateway node.</p>
            </>
          ),
        },
        {
          heading: 'Transport',
          body: (
            <>
              <p>All endpoints are TLS 1.2+ only with HSTS preload. Plain-HTTP requests are rejected, not redirected, to avoid downgrade attacks. Certificates are issued by Let's Encrypt and rotated automatically.</p>
            </>
          ),
        },
        {
          heading: 'Storage',
          body: (
            <>
              <p>The PostgreSQL database is encrypted at rest with AES-256 (managed by AWS RDS). Backups are encrypted and retained for 14 days. Production credentials live only in the runtime environment of the API container — never in the repository, never in client-side code.</p>
            </>
          ),
        },
        {
          heading: 'Authentication',
          body: (
            <>
              <p>End-user authentication supports email/passphrase (bcrypt, cost 12) and OAuth via Google, GitHub, and Apple (Supabase Auth bridge). JWTs are short-lived; refresh tokens are rotated on every use.</p>
              <p>The OAuth bridge exchanges a Supabase token for a ReadyPi session token in a single signed call — passwords from your Google, GitHub, or Apple account never reach our servers.</p>
            </>
          ),
        },
        {
          heading: 'Abuse and rate limiting',
          body: (
            <>
              <p>Per-key and per-account rate limits scale with your plan tier. Requests above the limit return HTTP 429 with a <code className="text-[#ff6b4a] font-mono text-sm">Retry-After</code> header. Repeated 4xx-class abuse triggers automatic temporary suspensions reviewable from the dashboard.</p>
            </>
          ),
        },
        {
          heading: 'Disclosure',
          body: (
            <>
              <p>If you believe you have found a vulnerability, please <strong className="text-white">do not file a public issue</strong>. Email <a href="mailto:security@readypi.site" className="text-[#ff6b4a] underline">security@readypi.site</a> with reproduction steps. We aim to acknowledge within 24 hours and to ship a fix or mitigation within 7 days for high-severity issues.</p>
              <p>We do not currently offer a paid bug bounty, but we credit reporters publicly (with permission) and offer service credits for material findings.</p>
            </>
          ),
        },
      ]}
    />
  );
}
