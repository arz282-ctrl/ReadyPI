import DocPage from '@/components/DocPage';

export const metadata = { title: 'Terms of Service — ReadyPi' };

export default function TermsPage() {
  return (
    <DocPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="By creating a ReadyPi account or using our API, you agree to these terms. Read them carefully — they govern how you use the service, what we promise, and how we handle disputes."
      updated="April 2026"
      sections={[
        {
          heading: '1. The Service',
          body: (
            <>
              <p>ReadyPi is an AI API gateway that proxies requests to third-party AI model providers (Sarvam AI, Krutrim, OpenAI, Anthropic, Google, Groq, Meta, DeepSeek, Mistral, and others). You bring a ReadyPi API key; we route the request, bill credits in Indian Rupees (INR / ₹), and return the provider's response.</p>
              <p>We do not own or operate the underlying models. Output quality, availability, and content policies are governed by the upstream provider for the model you select.</p>
            </>
          ),
        },
        {
          heading: '2. Account & API Keys',
          body: (
            <>
              <p>You are responsible for keeping your account credentials and API keys secret. Treat keys like passwords. We will never ask for your key over email or chat.</p>
              <p>Any usage that originates from your key is billed to your account. If a key is compromised, revoke it from the dashboard immediately and rotate to a new one.</p>
            </>
          ),
        },
        {
          heading: '3. Acceptable Use',
          body: (
            <>
              <p>You may not use ReadyPi to generate content that is illegal under Indian or applicable jurisdictional law, that targets or harasses individuals, that infringes copyright, or that attempts to defeat the safety guardrails of upstream providers. We honor the acceptable-use policies of every provider we integrate with — abuse on one provider can suspend your access to all of them.</p>
              <p>Automated abuse, scraping that violates a provider's terms, and reselling raw API access without an integration are prohibited.</p>
            </>
          ),
        },
        {
          heading: '4. Billing & Credits',
          body: (
            <>
              <p>ReadyPi runs on a prepaid credit model denominated in Indian Rupees (INR / ₹). You top up credits via PhonePe, Google Pay, Paytm, UPI, Razorpay, NetBanking, Cards, or USDT, and each request deducts credits at the published INR-per-million-token rate for the model used.</p>
              <p>Pricing per model is shown on the Models page and may change with 30 days' notice. Credits do not expire and are not refundable in cash, but unused balances can be applied to any future request on any model.</p>
            </>
          ),
        },
        {
          heading: '5. Service Availability',
          body: (
            <>
              <p>We target 99.9% gateway uptime but cannot guarantee the availability of any individual upstream provider. When a provider is degraded, ReadyPi's fallback routing will attempt an equivalent model on a healthy provider unless you have explicitly disabled fallbacks.</p>
              <p>Scheduled maintenance is announced in advance on the status page.</p>
            </>
          ),
        },
        {
          heading: '6. Data & Privacy',
          body: (
            <>
              <p>Prompts and completions transit our gateway and are logged for billing, abuse prevention, and debugging. They are not used to train models. See the Privacy Policy for full details on retention, encryption, and your rights as a data subject.</p>
            </>
          ),
        },
        {
          heading: '7. Limitation of Liability',
          body: (
            <>
              <p>The service is provided "as is". To the maximum extent permitted by law, ReadyPi's aggregate liability is capped at the credits you spent in the 30 days preceding the claim. We are not liable for upstream provider outages, model output quality, or any indirect damages.</p>
            </>
          ),
        },
        {
          heading: '8. Termination',
          body: (
            <>
              <p>You may close your account at any time from the dashboard. We may suspend accounts that violate these terms, with notice except in cases of clear abuse. On termination, unused credits are forfeited unless local law requires otherwise.</p>
            </>
          ),
        },
        {
          heading: '9. Contact',
          body: (
            <p>Questions about these terms: <a href="mailto:legal@readypi.site" className="text-[#ff6b4a] underline">legal@readypi.site</a>.</p>
          ),
        },
      ]}
    />
  );
}
