'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Copy, Check, ChevronRight, TerminalSquare, Layers, Lock, Code2, Zap } from 'lucide-react'

export default function DocsPage() {
  const [copied, setCopied] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('rpi_live_YOUR_API_KEY_HERE')

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const pythonCode = `import os
from openai import OpenAI

# Drop-in compatibility: Just change the base URL and API key
client = OpenAI(
  base_url="https://api.readypi.online/v1",
  api_key="${apiKey}"
)

# Call ANY model from ANY provider
completion = client.chat.completions.create(
  model="google/gemini-1.5-flash",
  messages=[
    {"role": "user", "content": "Write a highly secure API router in Node.js"}
  ]
)

print(completion.choices[0].message.content)`

  const nodeCode = `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://api.readypi.online/v1',
  apiKey: '${apiKey}'
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: 'meta-llama/llama-3-70b-instruct',
    messages: [
      { role: 'system', content: 'You are an elite developer.' },
      { role: 'user', content: 'Optimize this database query...' }
    ],
  });

  console.log(completion.choices[0].message.content);
}

main();`

  return (
    <div className="min-h-screen bg-[#050508] text-gray-300 font-mono flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#0a0a0f] border-r border-gray-800 md:h-screen sticky top-0 overflow-y-auto shrink-0 hidden md:block">
        <div className="p-6 border-b border-gray-800 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="text-xl font-fraunces font-black text-[#00ff9d]">π</span>
            <span className="font-fraunces font-bold tracking-tight">ReadyPi Docs</span>
          </Link>
        </div>
        
        <div className="p-4 space-y-6">
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3 px-2">Getting Started</h4>
            <ul className="space-y-1">
              <li><Link href="#quickstart" className="block px-2 py-1.5 text-sm text-[#00ff9d] bg-[#00ff9d]/10 rounded font-semibold">Quickstart</Link></li>
              <li><Link href="#authentication" className="block px-2 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Authentication</Link></li>
              <li><Link href="#models" className="block px-2 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Supported Models</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3 px-2">Endpoints</h4>
            <ul className="space-y-1">
              <li><Link href="#chat" className="block px-2 py-1.5 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-between">Chat Completions <span className="text-[9px] bg-green-500/20 text-green-500 px-1 rounded border border-green-500/30">POST</span></Link></li>
              <li><Link href="#balance" className="block px-2 py-1.5 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-between">Check Balance <span className="text-[9px] bg-blue-500/20 text-blue-500 px-1 rounded border border-blue-500/30">GET</span></Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3 px-2">Advanced</h4>
            <ul className="space-y-1">
              <li><Link href="#routing" className="block px-2 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Intelligent Routing</Link></li>
              <li><Link href="#errors" className="block px-2 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">Error Codes</Link></li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[800px] mx-auto p-8 md:p-12 lg:p-16">
          
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-fraunces font-black text-white mb-4 tracking-tight">API Reference</h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Integrate ReadyPi in minutes. We provide full drop-in compatibility with the official OpenAI SDKs, allowing you to route requests to Google, Anthropic, Meta, and OpenAI using a single API key and billing in BDT.
            </p>
          </div>

          {/* Interactive Key Input */}
          <div className="bg-[#0a0a0f] border border-gray-800 rounded-xl p-6 mb-12 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 text-white font-semibold">
              <Lock size={18} className="text-[#00ff9d]" /> Your API Key:
            </div>
            <input 
              type="text" 
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Paste your rpi_live_... key here"
              className="flex-1 bg-black border border-gray-800 rounded px-4 py-2 text-sm text-[#00ff9d] font-mono focus:outline-none focus:border-[#00ff9d]/50 w-full"
            />
            <p className="text-xs text-gray-500 w-full sm:w-auto">This key will automatically update the code snippets below.</p>
          </div>

          <section id="quickstart" className="mb-16">
            <h2 className="text-2xl font-fraunces font-bold text-white mb-6 border-b border-gray-800 pb-2 flex items-center gap-2">
              <Zap size={20} className="text-[#00ff9d]" /> Quickstart
            </h2>
            <p className="mb-6 leading-relaxed">
              To get started, simply install the official OpenAI SDK and change the <code>baseURL</code> to point to our gateway. No other code changes are required.
            </p>

            {/* Code Block: Python */}
            <div className="mb-8 bg-[#0a0a0f] border border-gray-800 rounded-xl overflow-hidden group">
              <div className="flex items-center justify-between bg-[#0d1117] px-4 py-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <TerminalSquare size={14} className="text-blue-400" />
                  <span className="text-xs font-bold text-white">Python</span>
                </div>
                <button 
                  onClick={() => handleCopy(pythonCode, 'python')}
                  className="text-gray-500 hover:text-[#00ff9d] transition-colors p-1"
                >
                  {copied === 'python' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <div className="p-4 overflow-x-auto text-sm leading-relaxed text-gray-300">
                <pre><code>{pythonCode}</code></pre>
              </div>
            </div>

            {/* Code Block: Node */}
            <div className="mb-8 bg-[#0a0a0f] border border-gray-800 rounded-xl overflow-hidden group">
              <div className="flex items-center justify-between bg-[#0d1117] px-4 py-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Code2 size={14} className="text-yellow-400" />
                  <span className="text-xs font-bold text-white">Node.js</span>
                </div>
                <button 
                  onClick={() => handleCopy(nodeCode, 'node')}
                  className="text-gray-500 hover:text-[#00ff9d] transition-colors p-1"
                >
                  {copied === 'node' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <div className="p-4 overflow-x-auto text-sm leading-relaxed text-gray-300">
                <pre><code>{nodeCode}</code></pre>
              </div>
            </div>
          </section>

          <section id="chat" className="mb-16">
            <h2 className="text-2xl font-fraunces font-bold text-white mb-6 border-b border-gray-800 pb-2">
              Chat Completions
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded border border-green-500/30 text-xs font-bold uppercase tracking-wider">POST</span>
              <code className="text-gray-300">https://api.readypi.online/v1/chat/completions</code>
            </div>
            <p className="mb-6 leading-relaxed">
              Given a list of messages comprising a conversation, the model will return a response. ReadyPi standardizes the input and output formats across all providers.
            </p>
            
            <h4 className="text-sm uppercase tracking-wider font-bold text-gray-500 mb-4">Request Body</h4>
            <div className="bg-[#0a0a0f] border border-gray-800 rounded-xl overflow-hidden mb-8">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0d1117] border-b border-gray-800 text-gray-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Parameter</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                  <tr>
                    <td className="py-3 px-4 font-bold text-[#00ff9d]">model <span className="text-red-500">*</span></td>
                    <td className="py-3 px-4">string</td>
                    <td className="py-3 px-4 leading-relaxed">ID of the model to use (e.g., <code>google/gemini-1.5-flash</code>).</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-[#00ff9d]">messages <span className="text-red-500">*</span></td>
                    <td className="py-3 px-4">array</td>
                    <td className="py-3 px-4 leading-relaxed">A list of messages comprising the conversation.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-white">temperature</td>
                    <td className="py-3 px-4">number</td>
                    <td className="py-3 px-4 leading-relaxed">Defaults to 1. What sampling temperature to use, between 0 and 2.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
