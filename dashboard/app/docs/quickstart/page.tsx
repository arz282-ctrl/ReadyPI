import DocPage from '@/components/DocPage';

export const metadata = { title: 'Quickstart — ReadyPi Docs' };

const pyCode = `from openai import OpenAI

client = OpenAI(
    base_url="https://api.readypi.online/v1",
    api_key="rpi_live_xxxxxxxxxxxxxxxxxxxxxxxx",
)

resp = client.chat.completions.create(
    model="anthropic/claude-3.5-sonnet",
    messages=[{"role": "user", "content": "Write a haiku about Mumbai."}],
)

print(resp.choices[0].message.content)`;

const nodeCode = `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.readypi.online/v1",
  apiKey: process.env.READYPI_KEY, // rpi_live_...
});

const resp = await client.chat.completions.create({
  model: "google/gemini-1.5-flash",
  messages: [{ role: "user", content: "Hello, gateway!" }],
});

console.log(resp.choices[0].message.content);`;

const curlCode = `curl https://api.readypi.online/v1/chat/completions \\
  -H "Authorization: Bearer $READYPI_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "meta-llama/llama-3-70b-instruct",
    "messages": [{"role": "user", "content": "ping"}]
  }'`;

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded-lg overflow-hidden my-4">
      <div className="px-4 py-2 border-b border-gray-800 font-mono text-[10px] uppercase tracking-widest text-[#ff6b4a]">
        {label}
      </div>
      <pre className="p-4 text-xs leading-relaxed text-gray-300 overflow-x-auto font-mono">
        {code}
      </pre>
    </div>
  );
}

export default function QuickstartPage() {
  return (
    <DocPage
      eyebrow="Docs · Quickstart"
      title="Make your first request in 60 seconds."
      intro="ReadyPi speaks the OpenAI API format. Drop in the base URL, swap the key, pick any model — Claude, Gemini, GPT-4o, Llama, DeepSeek — and it just works."
      sections={[
        {
          heading: '1. Get a key',
          body: (
            <>
              <p>Sign up, then go to the dashboard and create an API key. Copy it once — we don't store the plaintext after creation.</p>
            </>
          ),
        },
        {
          heading: '2. Point your client at ReadyPi',
          body: (
            <>
              <p>Set the base URL to <code className="text-[#ff6b4a] font-mono text-sm">https://api.readypi.online/v1</code> and use your <code className="text-[#ff6b4a] font-mono text-sm">rpi_live_...</code> key as the bearer token. Any OpenAI-SDK-compatible client works:</p>
              <CodeBlock label="Python" code={pyCode} />
              <CodeBlock label="Node.js" code={nodeCode} />
              <CodeBlock label="cURL" code={curlCode} />
            </>
          ),
        },
        {
          heading: '3. Pick a model',
          body: (
            <>
              <p>Models are addressed as <code className="text-[#ff6b4a] font-mono text-sm">provider/model-name</code>. A few good defaults:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li><code className="text-[#ff6b4a] font-mono text-sm">readypi/auto</code> — we route to the cheapest healthy model that fits your context.</li>
                <li><code className="text-[#ff6b4a] font-mono text-sm">google/gemini-1.5-flash</code> — fastest and largest free-tier context.</li>
                <li><code className="text-[#ff6b4a] font-mono text-sm">anthropic/claude-3.5-sonnet</code> — best reasoning and coding.</li>
                <li><code className="text-[#ff6b4a] font-mono text-sm">openai/gpt-4o-mini</code> — best price-to-quality on the OpenAI family.</li>
              </ul>
              <p>Full catalog with INR (₹) rates: <a href="/models" className="text-[#ff6b4a] underline">/models</a>.</p>
            </>
          ),
        },
        {
          heading: '4. Top up in INR (₹)',
          body: (
            <>
              <p>Add credits via PhonePe, Google Pay, Paytm, UPI, Razorpay, NetBanking, cards, or USDT from the Billing page. Credits never expire and apply to any model.</p>
            </>
          ),
        },
        {
          heading: 'Errors and retries',
          body: (
            <>
              <p>The gateway returns standard HTTP codes. <code className="text-[#ff6b4a] font-mono text-sm">429</code> is rate-limited (retry after the <code className="text-[#ff6b4a] font-mono text-sm">Retry-After</code> header). <code className="text-[#ff6b4a] font-mono text-sm">503</code> is upstream provider down — set fallbacks in your request to auto-route to a healthy peer.</p>
            </>
          ),
        },
      ]}
    />
  );
}
