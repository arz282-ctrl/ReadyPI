import DocPage from '@/components/DocPage';

export const metadata = { title: 'About — ReadyPi' };

export default function AboutPage() {
  return (
    <DocPage
      eyebrow="About"
      title="Built in Bangladesh, for the world."
      intro="ReadyPi is a Rareware Studio product, designed and operated from Sylhet. We built one API gateway so developers in Bangladesh — and anywhere local payments matter — can ship AI products without an international card."
      sections={[
        {
          heading: 'The problem we set out to fix',
          body: (
            <>
              <p>Every major AI provider — OpenAI, Anthropic, Google, Mistral — bills in USD on a credit card. For a developer in Dhaka or Sylhet, that's three layers of friction: getting an international card, paying conversion fees, and absorbing exchange-rate risk on every request.</p>
              <p>Meanwhile the actual integration work is identical across providers. Same OpenAI-shaped chat-completions schema. Same streaming protocol. Same headers. So we built one endpoint, one key, one bill — paid in BDT.</p>
            </>
          ),
        },
        {
          heading: 'What ReadyPi does',
          body: (
            <>
              <p>One API key gives you 150+ models across every major provider. We normalize errors, expose a single billing surface, route around outages, and price everything per million tokens at the prevailing rate.</p>
              <p>Top up with bKash, Nagad, Rocket, card, or USDT. Credits never expire. Switch models with a string change.</p>
            </>
          ),
        },
        {
          heading: 'How we make money',
          body: (
            <>
              <p>A small per-request margin on top of the upstream provider's wholesale rate. No subscription tiers, no minimums, no enterprise sales calls required to read pricing.</p>
            </>
          ),
        },
        {
          heading: 'Who we are',
          body: (
            <>
              <p>Rareware Studio. Sylhet, Bangladesh. We build infrastructure for software teams in markets that USD-first companies overlook. ReadyPi is our first public product.</p>
              <p>Reach us: <a href="mailto:hello@readypi.io" className="text-[#ff6b4a] underline">hello@readypi.io</a>.</p>
            </>
          ),
        },
      ]}
    />
  );
}
