'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Layers, Search, Play, Filter, CheckCircle2, ChevronLeft } from 'lucide-react'

export default function ModelsPage() {
  const [search, setSearch] = useState('')
  const [filterProvider, setFilterProvider] = useState('all')

  const models = [
    { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B', provider: 'Groq', context: '8K', promptPrice: 0.50, completionPrice: 0.60, latency: '0.2s', isFree: true, features: ['Text'] },
    { id: 'google/gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', context: '1M', promptPrice: 0.15, completionPrice: 0.30, latency: '0.4s', isFree: true, features: ['Text', 'Vision', 'Tools'] },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek', context: '64K', promptPrice: 0.20, completionPrice: 0.40, latency: '0.4s', isFree: true, features: ['Text', 'Code'] },
    { id: 'deepseek/deepseek-reasoner', name: 'DeepSeek R1', provider: 'DeepSeek', context: '64K', promptPrice: 2.00, completionPrice: 4.50, latency: '1.2s', isFree: false, features: ['Reasoning', 'Math', 'Code'] },
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', context: '128K', promptPrice: 5.00, completionPrice: 15.00, latency: '0.6s', isFree: false, features: ['Text', 'Vision', 'Tools'] },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', context: '200K', promptPrice: 3.00, completionPrice: 15.00, latency: '0.5s', isFree: false, features: ['Text', 'Vision', 'Tools'] },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', context: '128K', promptPrice: 0.15, completionPrice: 0.60, latency: '0.3s', isFree: false, features: ['Text', 'Vision'] },
    { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'Mistral', context: '32K', promptPrice: 2.00, completionPrice: 6.00, latency: '0.5s', isFree: false, features: ['Text', 'Tools'] },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', context: '200K', promptPrice: 0.25, completionPrice: 1.25, latency: '0.3s', isFree: false, features: ['Text', 'Vision'] },
  ]

  const filteredModels = models.filter(m => 
    (filterProvider === 'all' || m.provider.toLowerCase() === filterProvider) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-[#050508] text-gray-300 font-mono">
      <nav className="h-16 bg-[#0a0a0f] border-b border-gray-800 flex items-center px-6 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:text-white transition-colors">
            <ChevronLeft size={16} /> Back
          </Link>
          <div className="h-4 w-[1px] bg-gray-800"></div>
          <div className="flex items-center gap-2 text-white font-semibold">
            <Layers size={18} className="text-[#00ff9d]" /> Supported Models Directory
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-fraunces font-black text-white mb-2 tracking-tight">AI Models</h1>
            <p className="text-gray-500 text-sm">Compare 50+ language models, context limits, and pricing in BDT.</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search models..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#0d1117] border border-gray-800 rounded pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#00ff9d]/50 transition-colors"
              />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <select 
                value={filterProvider}
                onChange={e => setFilterProvider(e.target.value)}
                className="appearance-none bg-[#0d1117] border border-gray-800 rounded pl-9 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#00ff9d]/50 transition-colors cursor-pointer"
              >
                <option value="all">All Providers</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
                <option value="groq">Groq</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0f] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[#0d1117] border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                  <th className="py-4 px-6 font-semibold">Model</th>
                  <th className="py-4 px-6 font-semibold text-right">Context</th>
                  <th className="py-4 px-6 font-semibold text-right">Prompt (৳/1M)</th>
                  <th className="py-4 px-6 font-semibold text-right">Completion (৳/1M)</th>
                  <th className="py-4 px-6 font-semibold text-center">Latency</th>
                  <th className="py-4 px-6 font-semibold">Capabilities</th>
                  <th className="py-4 px-6 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-800/50">
                {filteredModels.map((model, i) => (
                  <tr key={i} className="hover:bg-[#12161e] transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#00ff9d]"></div>
                        <div>
                          <div className="text-white font-semibold flex items-center gap-2">
                            {model.name}
                            {model.isFree && <span className="bg-[#00ff9d]/10 text-[#00ff9d] text-[9px] px-1.5 py-0.5 rounded uppercase border border-[#00ff9d]/20">Free</span>}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 font-mono">{model.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right text-gray-300 font-medium">{model.context}</td>
                    <td className="py-4 px-6 text-right text-white">৳{model.promptPrice.toFixed(2)}</td>
                    <td className="py-4 px-6 text-right text-white">৳{model.completionPrice.toFixed(2)}</td>
                    <td className="py-4 px-6 text-center text-gray-400">{model.latency}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        {model.features.map(f => (
                          <span key={f} className="text-[10px] bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700 uppercase tracking-wider">{f}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link href="/playground" className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-[#00ff9d] transition-colors opacity-0 group-hover:opacity-100">
                        <Play size={12} /> Test
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredModels.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No models found matching your search.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
