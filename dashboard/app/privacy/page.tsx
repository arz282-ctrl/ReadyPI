import DocPage from '@/components/DocPage';

export const metadata = { title: 'Privacy Policy — ReadyPi' };

export default function PrivacyPage() {
  return (
    <DocPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="We log only what we need to bill, debug, and prevent abuse. Your prompts and completions are never used to train models. This page is the full account of what we collect, why, and how to control it."
      updated="April 2026"
      sections={[
        {
          heading: 'What we collect',
          body: (
            <>
              <p><strong className="text-white">Account data</strong> — email, optional name, hashed passphrase or OAuth identity, plan tier, country.</p>
              <p><strong className="text-white">Request metadata</strong> — timestamp, model selected, request size, response size, latency, status, billed credits. Used to render usage charts and apply rate limits.</p>
              <p><strong className="text-white">Prompts and completions</strong> — stored for 30 days encrypted at rest, then purged automatically. Used only to investigate abuse reports and debug issues you raise with support.</p>
              <p><strong className="text-white">Payment metadata</strong> — UPI reference / UTR / Razorpay transaction ID, amount, status. We never see your bank credentials or card PIN; payment processors handle that.</p>
            </>
          ),
        },
        {
          heading: 'How we use it',
          body: (
            <>
              <p>To run the service: authenticate you, route requests, bill credits, show usage charts, prevent abuse, comply with the law. That is all.</p>
              <p>We do not sell or share data with advertisers. We do not train any model on your content. We do not give upstream providers access to your account — they only see the request payload at the moment of routing.</p>
            </>
          ),
        },
        {
          heading: 'Retention',
          body: (
            <ul className="list-disc list-outside pl-5 space-y-1">
              <li>Account data — kept while your account is open, deleted within 30 days of closure.</li>
              <li>Request metadata (no prompt content) — 12 months.</li>
              <li>Prompts and completions — 30 days, then purged.</li>
              <li>Payment records — 7 years (Indian tax law).</li>
            </ul>
          ),
        },
        {
          heading: 'Security',
          body: (
            <>
              <p>API keys are hashed with bcrypt before storage; we never store the plaintext key after the moment of creation. Database is encrypted at rest. All transport is TLS 1.2+. Production access is restricted, audited, and uses hardware security keys.</p>
              <p>Suspected vulnerability? Please email <a href="mailto:security@readypi.site" className="text-[#ff6b4a] underline">security@readypi.site</a> rather than filing a public issue.</p>
            </>
          ),
        },
        {
          heading: 'Your rights',
          body: (
            <>
              <p>You can access, export, or delete your data at any time from the dashboard. For requests we can't self-serve, email <a href="mailto:privacy@readypi.site" className="text-[#ff6b4a] underline">privacy@readypi.site</a> and we'll respond within 30 days.</p>
            </>
          ),
        },
        {
          heading: 'Cookies',
          body: (
            <>
              <p>We use a single first-party session cookie to keep you logged in. No advertising, analytics, or third-party tracking cookies. No fingerprinting.</p>
            </>
          ),
        },
        {
          heading: 'Changes',
          body: (
            <p>If we materially change this policy, we will email all account holders and announce the change on the homepage at least 30 days before it takes effect.</p>
          ),
        },
      ]}
    />
  );
}
