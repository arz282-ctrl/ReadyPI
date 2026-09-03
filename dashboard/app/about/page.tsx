import DocPage from '@/components/DocPage';

export const metadata = { title: 'About — ReadyPi' };

export default function AboutPage() {
  return (
    <DocPage
      eyebrow="About"
      title="Built in India, for the world."
      intro="ReadyPi is a Rareware Studio product, designed and operated from Mumbai. We built one API gateway so developers in India — and anywhere local payments matter — can ship AI products without an international card."
      sections={[
        {
          heading: 'The problem we set out to fix',
          body: (
            <>
              <p>Every major AI provider — OpenAI, Anthropic, Google, Mistral — bills in USD on international credit cards. For developers and enterprises across India, that's friction: getting forex cards, paying conversion fees, and absorbing exchange-rate risk on every request.</p>
              <p>Meanwhile the actual integration work is identical across providers. Same OpenAI-shaped chat-completions schema. Same streaming protocol. Same headers. So we built one endpoint, one key, one bill — paid in INR (₹).</p>
            </>
          ),
        },
        {
          heading: 'What ReadyPi does',
          body: (
            <>
              <p>One API key gives you 150+ models including Sarvam AI, Krutrim, Gemini 2.5, GPT-4o, and Claude 3.5. We normalize errors, expose a single billing surface, route around outages, and price everything per million tokens at transparent rates.</p>
              <p>Top up with PhonePe, Google Pay, Paytm, UPI, Razorpay, cards, or USDT. Credits never expire. Switch models with a single line change in your code.</p>
            </>
          ),
        },
        {
          heading: 'How we make money',
          body: (
            <>
              <p>A small transparent per-request margin on top of the upstream provider's wholesale rate. No subscription lock-in, no minimums, no enterprise sales calls required to inspect pricing.</p>
            </>
          ),
        },
        {
          heading: 'Who we are',
          body: (
            <>
              <p>ReadyPi India Infrastructure. We build high-performance AI API infrastructure tailored for developers, AI startups, and enterprises in India.</p>
              <p>Reach us: <a href="mailto:support@readypi.site" className="text-[#ff6b4a] underline">support@readypi.site</a>.</p>
            </>
          ),
        },
      ]}
    />
  );
}
