'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  Search, Terminal, BookOpen, Key, Activity, Zap, Layers, Network, ShieldCheck, 
  ChevronRight, Globe, CreditCard, Code, ArrowRight, Lock, Gauge, Users, Menu, X,
  Rocket, Server, Clock, CheckCircle, Star, TrendingUp, Shield, Eye, EyeOff,
  ChevronDown, ExternalLink, Crown, Award, BadgeCheck, Headphones, BookText,
  Twitter, Github, Linkedin, MessageCircle, BarChart3, ArrowDownRight
} from 'lucide-react'
import PiMark from '@/components/PiMark'
import { CursorTrail, CustomCursor } from '@/lib/cursor'
import { SmoothTilt } from '@/lib/tilt'
import { AnimatedCounter, StatCard } from '@/components/ui/animated-counter'
import { GlowingOrb, RevealOnScroll, FloatingElement, StaggerContainer, staggerItemVariants } from '@/components/ui/motion-primitives'

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.8, delay: 0.2 + i * 0.12, ease: "easeOut" },
  }),
}

// Provider data - OpenRouter-style model showcase
const providers = [
  {
    id: 'openai',
    name: 'OpenAI',
    logo: '⬡',
    color: '#10a37f',
    models: 18,
    description: 'GPT-4o, GPT-4 Turbo, o1, o3, and more',
    featured: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-preview', 'o3-mini'],
    status: 'operational',
    latency: '<100ms',
    uptime: '99.9%'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    logo: '◆',
    color: '#d4a574',
    models: 10,
    description: 'Claude 4 Opus, Sonnet, Haiku',
    featured: ['claude-4-opus', 'claude-4-sonnet', 'claude-3.5-haiku'],
    status: 'operational',
    latency: '<150ms',
    uptime: '99.8%'
  },
  {
    id: 'google',
    name: 'Google AI',
    logo: '◉',
    color: '#4285f4',
    models: 20,
    description: 'Gemini 2.5, 2.0, 1.5 Pro & Flash',
    featured: ['gemini-2.5-flash', 'gemini-2.0-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    status: 'operational',
    latency: '<80ms',
    uptime: '99.9%'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    logo: '◈',
    color: '#6366f1',
    models: 8,
    description: 'DeepSeek V3, R1, Coder',
    featured: ['deepseek-chat', 'deepseek-r1', 'deepseek-coder'],
    status: 'operational',
    latency: '<120ms',
    uptime: '99.7%'
  },
  {
    id: 'groq',
    name: 'Groq',
    logo: '◇',
    color: '#f97316',
    models: 12,
    description: 'Llama 3.3, Mixtral — Ultra fast LPU inference',
    featured: ['llama-3.3-70b', 'llama-3.1-8b', 'mixtral-8x7b'],
    status: 'operational',
    latency: '<50ms',
    uptime: '99.9%'
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    logo: '△',
    color: '#ff6b4a',
    models: 10,
    description: 'Mistral Large, Nemo, Codestral',
    featured: ['mistral-large', 'mistral-nemo', 'codestral'],
    status: 'operational',
    latency: '<100ms',
    uptime: '99.6%'
  },
  {
    id: 'meta',
    name: 'Meta AI',
    logo: '⬢',
    color: '#0668c4',
    models: 15,
    description: 'Llama 3.3, 3.2, 3.1 — all sizes',
    featured: ['llama-3.3-70b', 'llama-3.2-90b-vision', 'llama-3.1-405b'],
    status: 'operational',
    latency: '<120ms',
    uptime: '99.5%'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    logo: '⊕',
    color: '#8b5cf6',
    models: 30,
    description: 'Free tier models — Gemini, Llama, Qwen, Phi',
    featured: ['gemini-2.5-flash-free', 'llama-3.3-70b-free', 'qwen-2.5-72b-free'],
    status: 'operational',
    latency: '<200ms',
    uptime: '99.5%'
  },
  {
    id: 'vertex',
    name: 'Google Vertex',
    logo: '▲',
    color: '#34a853',
    models: 12,
    description: 'Enterprise Gemini, Claude via Vertex AI',
    featured: ['vertex-gemini-1.5-pro', 'vertex-claude-sonnet'],
    status: 'operational',
    latency: '<120ms',
    uptime: '99.9%'
  },
  {
    id: 'aws',
    name: 'AWS Bedrock',
    logo: '◼',
    color: '#ff9900',
    models: 10,
    description: 'Claude, Titan, Llama via AWS',
    featured: ['bedrock-claude-sonnet', 'bedrock-titan'],
    status: 'operational',
    latency: '<150ms',
    uptime: '99.9%'
  },
  {
    id: 'cohere',
    name: 'Cohere',
    logo: '◎',
    color: '#39c2a0',
    models: 6,
    description: 'Command R+, Embed, Rerank',
    featured: ['command-r-plus', 'command-r'],
    status: 'operational',
    latency: '<130ms',
    uptime: '99.7%'
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    logo: '◻',
    color: '#0078d4',
    models: 10,
    description: 'Azure OpenAI, Phi, Orca',
    featured: ['gpt-4-azure', 'phi-3-azure'],
    status: 'operational',
    latency: '<100ms',
    uptime: '99.9%'
  },
]

// Detailed provider info for hover cards
const providerDetails: Record<string, { website: string; founded: string; headquarters: string; bestFor: string[]; pricing: string; keyFeatures: string[] }> = {
  openai: {
    website: 'https://openai.com',
    founded: '2015',
    headquarters: 'San Francisco, CA',
    bestFor: ['Complex reasoning', 'Code generation', 'Creative writing'],
    pricing: 'From ৳0.15/1K tokens',
    keyFeatures: ['Function calling', 'Vision support', 'JSON mode', 'Streaming'],
  },
  anthropic: {
    website: 'https://anthropic.com',
    founded: '2021',
    headquarters: 'San Francisco, CA',
    bestFor: ['Long context', 'Safety alignment', 'Nuanced responses'],
    pricing: 'From ৳0.25/1K tokens',
    keyFeatures: ['200K context', 'Tool use', 'Computer use', 'Artifacts'],
  },
  google: {
    website: 'https://ai.google',
    founded: '2017',
    headquarters: 'Mountain View, CA',
    bestFor: ['Multimodal', 'Long context', 'Cost efficiency'],
    pricing: 'From ৳0.10/1K tokens',
    keyFeatures: ['1M context', 'Native multimodal', 'Grounding', 'Code execution'],
  },
  deepseek: {
    website: 'https://deepseek.com',
    founded: '2023',
    headquarters: 'Beijing, China',
    bestFor: ['Coding', 'Math', 'Reasoning at low cost'],
    pricing: 'From ৳0.10/1K tokens',
    keyFeatures: ['MOE architecture', 'Long context', 'Code expert', 'DeepThink mode'],
  },
  groq: {
    website: 'https://groq.com',
    founded: '2023',
    headquarters: 'San Jose, CA',
    bestFor: ['Speed critical', 'Real-time apps', 'Streaming'],
    pricing: 'From ৳0.10/1K tokens',
    keyFeatures: ['Fastest inference', 'LPU chips', 'Open models', 'No hidden costs'],
  },
  mistral: {
    website: 'https://mistral.ai',
    founded: '2023',
    headquarters: 'Paris, France',
    bestFor: ['European hosting', 'Open weights', 'Balanced performance'],
    pricing: 'From ৳0.20/1K tokens',
    keyFeatures: ['Open weights', 'Commercial license', 'Mixture of experts', 'European'],
  },
  meta: {
    website: 'https://meta.ai',
    founded: '2024',
    headquarters: 'Menlo Park, CA',
    bestFor: ['Open source', 'Large context', 'Community support'],
    pricing: 'From ৳0.05/1K tokens',
    keyFeatures: ['Open source', 'Llama Guard', 'Quantized versions', 'Large scale'],
  },
  openrouter: {
    website: 'https://openrouter.ai',
    founded: '2023',
    headquarters: 'San Francisco, CA',
    bestFor: ['Free models', 'Aggregated access', 'Experimentation'],
    pricing: 'From ৳0.00/1K tokens',
    keyFeatures: ['Free tier models', 'Multi-provider', 'Rate limit pooling', 'Fallbacks'],
  },
  vertex: {
    website: 'https://cloud.google.com/vertex-ai',
    founded: '2021',
    headquarters: 'Mountain View, CA',
    bestFor: ['Enterprise GCP', 'Compliance', 'Multi-model'],
    pricing: 'From ৳0.35/1K tokens',
    keyFeatures: ['GCP native', 'SOC2/ISO', 'Private endpoints', 'Model Garden'],
  },
  aws: {
    website: 'https://aws.amazon.com/bedrock',
    founded: '2023',
    headquarters: 'Seattle, WA',
    bestFor: ['Enterprise AWS', 'Private deployment', 'Compliance'],
    pricing: 'From ৳0.40/1K tokens',
    keyFeatures: ['AWS native', 'VPC endpoints', 'Guardrails', 'Multi-model'],
  },
  cohere: {
    website: 'https://cohere.com',
    founded: '2019',
    headquarters: 'Toronto, Canada',
    bestFor: ['RAG', 'Enterprise search', 'Embeddings'],
    pricing: 'From ৳0.30/1K tokens',
    keyFeatures: ['Command R+', 'Embed v3', 'Rerank', 'Tool use'],
  },
  azure: {
    website: 'https://azure.microsoft.com',
    founded: '2010',
    headquarters: 'Redmond, WA',
    bestFor: ['Enterprise', 'Compliance', 'SLA guarantee'],
    pricing: 'From ৳0.50/1K tokens',
    keyFeatures: ['Enterprise SLA', 'SOC2/ISO', 'Private networking', 'Content filtering'],
  },
}

// Models data
const modelsList = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', context: '1M', promptPrice: '৳0.00', completionPrice: '৳0.00', latency: '0.3s', isFree: true },
  { id: 'meta-llama/llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'Groq', context: '128K', promptPrice: '৳0.00', completionPrice: '৳0.00', latency: '0.2s', isFree: true },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', context: '64K', promptPrice: '৳0.00', completionPrice: '৳0.00', latency: '0.5s', isFree: true },
  { id: 'mistralai/mistral-nemo', name: 'Mistral Nemo', provider: 'Mistral', context: '128K', promptPrice: '৳0.00', completionPrice: '৳0.00', latency: '0.3s', isFree: true },
  { id: 'qwen/qwen-2.5-72b', name: 'Qwen 2.5 72B', provider: 'OpenRouter', context: '128K', promptPrice: '৳0.00', completionPrice: '৳0.00', latency: '0.4s', isFree: true },
  { id: 'microsoft/phi-3-mini-128k', name: 'Phi-3 Mini 128K', provider: 'OpenRouter', context: '128K', promptPrice: '৳0.00', completionPrice: '৳0.00', latency: '0.2s', isFree: true },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', context: '128K', promptPrice: '৳5.00', completionPrice: '৳15.00', latency: '0.6s', isFree: false },
  { id: 'anthropic/claude-4-sonnet', name: 'Claude 4 Sonnet', provider: 'Anthropic', context: '200K', promptPrice: '৳3.00', completionPrice: '৳15.00', latency: '0.5s', isFree: false },
  { id: 'openai/o3-mini', name: 'o3-mini', provider: 'OpenAI', context: '128K', promptPrice: '৳1.10', completionPrice: '৳4.40', latency: '1.0s', isFree: false },
  { id: 'google/gemini-2.0-pro', name: 'Gemini 2.0 Pro', provider: 'Google', context: '1M', promptPrice: '৳1.25', completionPrice: '৳5.00', latency: '0.5s', isFree: false },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek', context: '64K', promptPrice: '৳0.20', completionPrice: '৳0.40', latency: '0.4s', isFree: false },
  { id: 'cohere/command-r-plus', name: 'Command R+', provider: 'Cohere', context: '128K', promptPrice: '৳3.00', completionPrice: '৳15.00', latency: '0.6s', isFree: false },
]

// Ticker models
const tickerModels = [
  { name: 'GPT-4o', provider: 'OpenAI' },
  { name: 'Claude 4 Sonnet', provider: 'Anthropic' },
  { name: 'Gemini 2.5 Flash', provider: 'Google' },
  { name: 'Llama 3.3 70B', provider: 'Meta' },
  { name: 'DeepSeek R1', provider: 'DeepSeek' },
  { name: 'Mistral Large', provider: 'Mistral' },
  { name: 'o3-mini', provider: 'OpenAI' },
  { name: 'Claude 3.5 Haiku', provider: 'Anthropic' },
  { name: 'Gemini 2.0 Pro', provider: 'Google' },
  { name: 'Qwen 2.5 72B', provider: 'Alibaba' },
  { name: 'Command R+', provider: 'Cohere' },
  { name: 'Phi-3 Mini', provider: 'Microsoft' },
  { name: 'Codestral', provider: 'Mistral' },
  { name: 'Llama 3.1 405B', provider: 'Meta' },
  { name: 'DeepSeek V3', provider: 'DeepSeek' },
  { name: 'Gemini 1.5 Pro', provider: 'Vertex' },
]

// Code tabs
const codeTabs = [
  {
    label: 'Python',
    language: 'python',
    code: `from openai import OpenAI

client = OpenAI(
  base_url="https://api.readypi.io/v1",
  api_key="rpi_live_*******************"
)

completion = client.chat.completions.create(
  model="anthropic/claude-3.5-sonnet",
  messages=[
    {"role": "user", "content": "Write a high-performance HTTP server"}
  ]
)

print(completion.choices[0].message.content)`
  },
  {
    label: 'Node.js',
    language: 'javascript',
    code: `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.readypi.io/v1',
  apiKey: 'rpi_live_*******************',
});

const completion = await client.chat.completions.create({
  model: 'google/gemini-1.5-flash',
  messages: [
    { role: 'user', content: 'Build a REST API with Express' }
  ],
});

console.log(completion.choices[0].message.content);`
  },
  {
    label: 'cURL',
    language: 'bash',
    code: `curl https://api.readypi.io/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer rpi_live_*******************" \\
  -d '{
    "model": "meta-llama/llama-3-70b-instruct",
    "messages": [
      {"role": "user", "content": "Hello from ReadyPi!"}
    ]
  }'`
  },
]

// Features
const features = [
  { icon: <Network size={22} />, title: 'Intelligent Routing', description: 'Auto-fallback across providers. If Claude is down, GPT-4o takes over seamlessly with zero downtime.', highlight: true },
  { icon: <Gauge size={22} />, title: 'Lowest Latency', description: 'Smart routing picks the fastest provider for each request. Sub-200ms response times with Groq acceleration.', highlight: true },
  { icon: <Lock size={22} />, title: 'Enterprise Security', description: 'SOC 2 compliant infrastructure. All traffic encrypted. API keys never stored in plaintext.', highlight: false },
  { icon: <CreditCard size={22} />, title: 'Local Currency Payments', description: 'bKash, Nagad, Rocket, USDT, Stripe — pay in your local currency. No international card needed. Credits never expire.', highlight: true },
  { icon: <Code size={22} />, title: 'OpenAI Compatible', description: 'Drop-in replacement. Change your base URL and instantly access 150+ models without rewriting code.', highlight: false },
  { icon: <Users size={22} />, title: 'Team Management', description: 'Shared billing, usage analytics per member, and admin controls for production workloads.', highlight: false },
]

// Trust indicators
const trustIndicators = [
  { icon: <Shield size={20} />, label: 'SOC 2 Type II', value: 'Certified' },
  { icon: <Lock size={20} />, label: 'Data Encryption', value: 'AES-256' },
  { icon: <Clock size={20} />, label: 'Uptime SLA', value: '99.9%' },
  { icon: <Headphones size={20} />, label: '24/7 Support', value: 'Live Chat' },
]

// Stats for counter animation
const stats = [
  { value: 150, suffix: '+', label: 'AI Models', icon: <Layers size={20} /> },
  { value: 999, suffix: '%', label: 'Uptime SLA', icon: <Server size={20} /> },
  { value: 100, suffix: 'ms', label: 'Avg Latency', icon: <Clock size={20} /> },
  { value: 5000, suffix: '+', label: 'Active Users', icon: <Users size={20} /> },
]

// Testimonials
const testimonials = [
  {
    name: 'Rafiqul Islam',
    role: 'CTO, TechStart BD',
    content: 'ReadyPi transformed our AI integration. The BDT pricing with bKash support is exactly what Bangladesh needed.',
    avatar: 'RI',
    rating: 5
  },
  {
    name: 'Nusrat Jahan',
    role: 'Lead Developer, Dhaka AI Labs',
    content: 'The OpenAI compatibility meant we migrated in under an hour. Best decision for our startup.',
    avatar: 'NJ',
    rating: 5
  },
  {
    name: 'Tanvir Ahmed',
    role: 'Founder, CodeCraft BD',
    content: 'Reliable, fast, and affordable. ReadyPi powers all our production AI features.',
    avatar: 'TA',
    rating: 5
  },
]

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeCodeTab, setActiveCodeTab] = useState(0)
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null)
  const [activeProvider, setActiveProvider] = useState<string>('all')
  
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  // Filter providers
  const filteredProviders = activeProvider === 'all' 
    ? providers 
    : providers.filter(p => p.id === activeProvider || p.featured.includes(activeProvider))

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-300 overflow-hidden">
      {/* Custom Cursor */}
      <CustomCursor show={true} />
      <CursorTrail enabled={true} maxPoints={6} delay={40} color="#ff6b4a" size={6} />

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-2xl border-b border-gray-800/50 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center" aria-label="ReadyPi home">
              <PiMark variant="logo" withWordmark />
            </Link>
            <div className="hidden lg:flex items-center gap-6 text-sm">
              <Link href="/models" className="flex items-center gap-2 hover:text-white transition-colors"><Layers size={16} /> Models</Link>
              <Link href="/playground" className="flex items-center gap-2 hover:text-white transition-colors"><Terminal size={16} /> Chat</Link>
              <Link href="/docs" className="flex items-center gap-2 hover:text-white transition-colors"><BookOpen size={16} /> Docs</Link>
              <Link href="/pricing" className="flex items-center gap-2 hover:text-white transition-colors"><CreditCard size={16} /> Pricing</Link>
              <Link href="/dashboard" className="flex items-center gap-2 hover:text-white transition-colors"><Activity size={16} /> Dashboard</Link>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden md:flex relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="Search 150+ models..." className="bg-[#0d1117] border border-gray-800 rounded-full py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-[#ff6b4a] w-64 transition-all placeholder:text-gray-600" />
            </div>
            <div className="hidden sm:flex items-center gap-4 text-sm font-semibold">
              <Link href="/login" className="hover:text-white transition-colors">Log In</Link>
              <Link href="/signup" className="bg-[#ff6b4a] text-white px-5 py-2.5 rounded-full hover:bg-[#ff5a3a] transition-all hover:shadow-[0_0_25px_rgba(255,107,74,0.4)]">Get Started</Link>
            </div>
            <button className="lg:hidden text-gray-400 hover:text-white p-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }} 
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden border-t border-gray-800 mt-3"
            >
              <div className="flex flex-col gap-3 py-4">
                {[{href:'/models',icon:<Layers size={16}/>,label:'Models'},{href:'/playground',icon:<Terminal size={16}/>,label:'Chat'},{href:'/docs',icon:<BookOpen size={16}/>,label:'Docs'},{href:'/pricing',icon:<CreditCard size={16}/>,label:'Pricing'},{href:'/dashboard',icon:<Activity size={16}/>,label:'Dashboard'}].map(l=>(
                  <Link key={l.href} href={l.href} className="flex items-center gap-3 text-sm text-gray-400 hover:text-white py-1.5" onClick={()=>setMobileMenuOpen(false)}>{l.icon}{l.label}</Link>
                ))}
                <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
                  <Link href="/login" className="text-sm text-gray-400 hover:text-white" onClick={()=>setMobileMenuOpen(false)}>Log In</Link>
                  <Link href="/signup" className="bg-[#ff6b4a] text-white px-5 py-2 rounded-full text-sm font-semibold" onClick={()=>setMobileMenuOpen(false)}>Get Started</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-8 sm:pt-0">
        {/* Ambient orbs */}
        <GlowingOrb className="-top-40 -left-40" color="#ff6b4a" size={600} />
        <GlowingOrb className="-bottom-40 -right-40" color="#c8381a" size={500} />
        <GlowingOrb className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" color="#00ff88" size={300} />

        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ 
          backgroundImage: 'linear-gradient(rgba(255,107,74,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,74,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
          {/* Left Content */}
          <motion.div 
            className="flex-1 text-center lg:text-left"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div variants={staggerItemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff6b4a]/10 border border-[#ff6b4a]/20 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]"></span>
              </span>
              <span className="text-xs text-[#ff6b4a] tracking-wide font-mono uppercase font-medium">Asia's First AI Gateway — Local Currency Support</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={staggerItemVariants} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-fraunces font-black leading-[1.05] mb-6 text-white tracking-tight">
              One API.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff8a6a] via-[#ff6b4a] to-[#c8381a]">150+ Models.</span>{' '}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-300">Your Currency.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p variants={staggerItemVariants} className="text-base sm:text-lg text-gray-400 max-w-xl leading-relaxed mb-8 sm:mb-10 mx-auto lg:mx-0">
              Access GPT-4o, Claude, Gemini, Llama, DeepSeek, and 150+ more models through one standardized API.
              <span className="text-[#ff6b4a] font-semibold"> Pay with bKash, Nagad, Rocket, USDT, or card — your local currency, always.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={staggerItemVariants} className="flex flex-col sm:flex-row flex-wrap gap-4 mb-10 justify-center lg:justify-start">
              <Link href="/signup" className="group flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff6b4a] to-[#c8381a] text-white px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wide hover:shadow-[0_0_40px_rgba(255,107,74,0.5)] transition-all hover:-translate-y-1">
                <Key size={18} /> Get API Key
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/docs" className="flex items-center justify-center gap-2 border border-gray-700 bg-[#0d1117] text-white px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wide hover:border-[#ff6b4a]/50 hover:bg-[#ff6b4a]/5 transition-all">
                <Terminal size={18} /> View Documentation
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div variants={staggerItemVariants} className="flex flex-wrap items-center gap-6 text-sm text-gray-500 justify-center lg:justify-start">
              <div className="flex items-center gap-2"><Zap size={14} className="text-yellow-500" /> Sub-100ms Latency</div>
              <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-green-500" /> OpenAI Compatible</div>
              <div className="flex items-center gap-2"><Globe size={14} className="text-blue-400" /> 150+ Models</div>
            </motion.div>
          </motion.div>

          {/* Right: Enhanced PiMark Hero */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="hidden lg:flex flex-1 items-center justify-center"
          >
            <FloatingElement duration={6} distance={20}>
              <PiMark 
                variant="hero" 
                size={420} 
                showEyes={true}
                showOrbit={true}
                showLabels={true}
              />
            </FloatingElement>
          </motion.div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
      </section>

      {/* ── Trust Badges ── */}
      <section className="py-8 bg-[#0d1117] border-y border-gray-800/50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {trustIndicators.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-[#ff6b4a]/10 flex items-center justify-center text-[#ff6b4a]">
                  {item.icon}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{item.value}</div>
                  <div className="text-gray-500 text-xs">{item.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="py-16 bg-[#0a0a0f]">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {stats.map((stat, i) => (
              <motion.div key={i} variants={staggerItemVariants}>
                <StatCard {...stat} delay={i * 0.1} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Provider Showcase ── */}
      <section className="py-16 sm:py-24 bg-[#0d1117]">
        <div className="max-w-[1400px] mx-auto px-6">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <span className="inline-block font-mono text-[10px] uppercase tracking-[4px] text-[#ff6b4a] mb-4 px-4 py-1.5 rounded-full border border-[#ff6b4a]/20 bg-[#ff6b4a]/5">
                Provider Network
              </span>
              <h2 className="text-3xl md:text-5xl font-fraunces font-black text-white mb-4">
                <span className="text-[#ff6b4a]">12+ Providers.</span> 150+ Models
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto font-mono text-sm">
                Access models from the world's leading AI companies through a single unified API.
              </p>
            </div>
          </RevealOnScroll>

          {/* Provider Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {['all', 'openai', 'anthropic', 'google', 'deepseek', 'groq', 'mistral', 'meta', 'openrouter'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveProvider(filter)}
                className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wide transition-all ${
                  activeProvider === filter
                    ? 'bg-[#ff6b4a] text-white'
                    : 'bg-[#0a0a0f] text-gray-400 hover:text-white hover:bg-[#1a1f2e]'
                }`}
              >
                {filter === 'all' ? 'All Providers' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Provider Grid */}
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
            layout
          >
            {providers.map((provider, i) => (
              <motion.div
                key={provider.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <SmoothTilt strength={8}>
                  <div 
                    className="relative group h-full bg-[#0a0a0f] border border-gray-800 rounded-2xl p-6 transition-all duration-500 hover:border-[#ff6b4a]/30 cursor-pointer"
                    onMouseEnter={() => setHoveredProvider(provider.id)}
                    onMouseLeave={() => setHoveredProvider(null)}
                  >
                    {/* Gradient glow */}
                    <div 
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: `radial-gradient(circle at 50% 0%, ${provider.color}10 0%, transparent 60%)`,
                      }}
                    />

                    <div className="relative z-10">
                      {/* Provider Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${provider.color}20`, color: provider.color }}
                        >
                          {provider.logo}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs text-gray-500">{provider.status}</span>
                        </div>
                      </div>

                      {/* Provider Name & Description */}
                      <h3 className="text-white font-bold text-lg mb-1">{provider.name}</h3>
                      <p className="text-gray-500 text-xs mb-4">{provider.description}</p>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          <span className="text-white font-semibold">{provider.models}</span> models
                        </span>
                        <span className="text-[#ff6b4a]">
                          {provider.latency} avg
                        </span>
                      </div>

                      {/* Hover Details */}
                      <AnimatePresence>
                        {hoveredProvider === provider.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-gray-800"
                          >
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Best for</span>
                                <span className="text-gray-300">{providerDetails[provider.id as keyof typeof providerDetails]?.bestFor[0]}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Starting from</span>
                                <span className="text-[#ff6b4a]">{providerDetails[provider.id as keyof typeof providerDetails]?.pricing}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Uptime</span>
                                <span className="text-green-500">{provider.uptime}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </SmoothTilt>
              </motion.div>
            ))}
          </motion.div>

          {/* View All Models CTA */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-10 text-center">
            <Link href="/models" className="inline-flex items-center gap-2 bg-[#0a0a0f] border border-gray-800 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:border-[#ff6b4a]/50 hover:bg-[#ff6b4a]/5 transition-all group">
              Browse all 150+ models
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Model Ticker ── */}
      <section className="border-y border-gray-800/50 bg-[#0a0a0f] py-4 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...tickerModels, ...tickerModels, ...tickerModels].map((model, i) => (
            <span key={i} className="mx-6 flex items-center gap-2 text-sm font-mono">
              <span className="text-white">{model.name}</span>
              <span className="text-gray-600">•</span>
              <span className="text-[#ff6b4a]">{model.provider}</span>
            </span>
          ))}
        </div>
      </section>

      {/* ── Model Table ── */}
      <section className="py-16 sm:py-24 bg-[#0a0a0f] border-b border-gray-800 relative">
        <GlowingOrb className="top-0 right-0" color="#ff6b4a" size={400} />
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <span className="inline-block font-mono text-[10px] uppercase tracking-[4px] text-[#ff6b4a] mb-4 px-4 py-1.5 rounded-full border border-[#ff6b4a]/20 bg-[#ff6b4a]/5">
                Model Directory
              </span>
              <h2 className="text-3xl md:text-5xl font-fraunces font-black text-white mb-4">
                Supported Models
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto font-mono text-sm">
                Access the world's best models via a single API endpoint. Prices in BDT per 1M tokens.
              </p>
            </div>
          </RevealOnScroll>

          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                  <th className="py-4 px-4 font-semibold">Model</th>
                  <th className="py-4 px-4 font-semibold">Provider</th>
                  <th className="py-4 px-4 font-semibold">Context</th>
                  <th className="py-4 px-4 font-semibold text-right">Prompt ৳</th>
                  <th className="py-4 px-4 font-semibold text-right">Completion ৳</th>
                  <th className="py-4 px-4 font-semibold">Latency</th>
                  <th className="py-4 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {modelsList.map((model, i) => (
                    <motion.tr 
                      key={i}
                      initial={{ opacity: 0, x: -20 }} 
                      whileInView={{ opacity: 1, x: 0 }} 
                      transition={{ delay: i * 0.05 }}
                      viewport={{ once: true }}
                      className="border-b border-gray-800/50 hover:bg-[#ff6b4a]/5 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4 font-semibold text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#00ff88] group-hover:scale-150 transition-transform" />
                        <span className="group-hover:text-[#ff6b4a] transition-colors">{model.id}</span>
                      </td>
                      <td className="py-4 px-4 text-gray-400">{model.provider}</td>
                      <td className="py-4 px-4 font-mono text-[#ff6b4a]">{model.context}</td>
                      <td className="py-4 px-4 text-right text-gray-300">{model.promptPrice}</td>
                      <td className="py-4 px-4 text-right text-gray-300">{model.completionPrice}</td>
                      <td className="py-4 px-4 text-gray-400">{model.latency}</td>
                      <td className="py-4 px-4 text-center">
                        {model.isFree ? (
                          <span className="bg-[#00ff88]/10 text-[#00ff88] text-[10px] px-2 py-1 rounded uppercase tracking-wide font-bold border border-[#00ff88]/20">Free</span>
                        ) : (
                          <span className="bg-[#ff6b4a]/10 text-[#ff6b4a] text-[10px] px-2 py-1 rounded uppercase tracking-wide font-bold border border-[#ff6b4a]/20">Premium</span>
                        )}
                      </td>
                    </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-8 text-center">
            <Link href="/models" className="inline-flex items-center gap-2 text-[#ff6b4a] hover:text-[#ff8a6a] text-sm font-semibold transition-colors group">
              View all 150+ models
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Code Integration ── */}
      <section className="py-16 sm:py-24 bg-[#0d1117] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b4a]/5 via-transparent to-transparent" />
        </div>
        <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <RevealOnScroll direction="left">
            <div className="mb-8">
              <span className="inline-block font-mono text-[10px] uppercase tracking-[4px] text-[#ff6b4a] mb-4 px-4 py-1.5 rounded-full border border-[#ff6b4a]/20 bg-[#ff6b4a]/5">
                Integration
              </span>
              <h2 className="text-3xl md:text-5xl font-fraunces font-black text-white mb-4 text-left">
                Drop-in OpenAI <br /><span className="text-[#ff6b4a]">Compatibility</span>
              </h2>
              <p className="text-gray-400 leading-relaxed mb-8">
                Don't rewrite your code. ReadyPi uses the exact same API format as OpenAI. 
                Just change your base URL and API key, and you instantly have access to the entire AI ecosystem.
              </p>
            </div>
            <div className="space-y-6">
              {[
                { icon: <Network size={18} />, title: 'Intelligent Fallbacks', desc: 'Specify fallback models. If Anthropic is down, we route to OpenAI or Gemini automatically.' },
                { icon: <BarChart3 size={18} />, title: 'Standardized Logging', desc: 'Every request logged and priced natively in BDT for transparent cost management.' },
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.15 }}
                  viewport={{ once: true }}
                  className="flex gap-4 p-4 rounded-xl bg-[#0a0a0f] border border-gray-800 hover:border-[#ff6b4a]/30 transition-all group"
                >
                  <div className="mt-1 w-12 h-12 rounded-xl bg-[#ff6b4a]/10 flex items-center justify-center text-[#ff6b4a] group-hover:bg-[#ff6b4a]/20 transition-colors">{item.icon}</div>
                  <div>
                    <h3 className="text-white font-bold mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </RevealOnScroll>

          <RevealOnScroll direction="right" delay={0.2}>
            <SmoothTilt strength={8} className="bg-[#0a0a0f] rounded-2xl border border-gray-800 overflow-hidden">
              {/* Code tabs */}
              <div className="flex border-b border-gray-800">
                {codeTabs.map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveCodeTab(i)}
                    className={`flex-1 py-3 px-4 text-xs font-mono transition-all ${
                      activeCodeTab === i 
                        ? 'bg-[#ff6b4a]/10 text-[#ff6b4a] border-b-2 border-[#ff6b4a]' 
                        : 'text-gray-500 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {/* Code content */}
              <div className="p-6">
                <pre className="font-mono text-sm text-gray-300 overflow-x-auto">
                  <code>{codeTabs[activeCodeTab].code}</code>
                </pre>
              </div>
            </SmoothTilt>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-16 sm:py-24 bg-[#0a0a0f] border-y border-gray-800/50 relative">
        <GlowingOrb className="bottom-0 left-1/4" color="#00ff88" size={400} />
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <span className="inline-block font-mono text-[10px] uppercase tracking-[4px] text-[#ff6b4a] mb-4 px-4 py-1.5 rounded-full border border-[#ff6b4a]/20 bg-[#ff6b4a]/5">
                Platform Features
              </span>
              <h2 className="text-3xl md:text-5xl font-fraunces font-black text-white mb-4">
                Built for <span className="text-[#ff6b4a]">Production</span>
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto font-mono text-sm">
                Enterprise-grade infrastructure powering AI applications across Bangladesh and beyond.
              </p>
            </div>
          </RevealOnScroll>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((f, i) => (
              <motion.div key={i} variants={staggerItemVariants}>
                <SmoothTilt strength={8}>
                  <div className={`relative group h-full bg-[#0d1117] border rounded-2xl p-6 transition-all duration-500 ${
                    f.highlight ? 'border-[#ff6b4a]/30 hover:border-[#ff6b4a]/50' : 'border-gray-800 hover:border-gray-700'
                  } hover:shadow-[0_0_40px_rgba(255,107,74,0.1)] hover:-translate-y-1`}>
                    {/* Gradient glow on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#ff6b4a]/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10">
                      <motion.div 
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                          f.highlight ? 'bg-[#ff6b4a]/10 text-[#ff6b4a]' : 'bg-gray-800/50 text-gray-400'
                        }`}
                      >
                        {f.icon}
                      </motion.div>
                      <h3 className="text-white font-bold text-lg mb-3 font-fraunces">{f.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed font-mono">{f.description}</p>
                    </div>
                  </div>
                </SmoothTilt>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-16 sm:py-24 bg-[#0d1117]">
        <div className="max-w-[1400px] mx-auto px-6">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <span className="inline-block font-mono text-[10px] uppercase tracking-[4px] text-[#ff6b4a] mb-4 px-4 py-1.5 rounded-full border border-[#ff6b4a]/20 bg-[#ff6b4a]/5">
                Testimonials
              </span>
              <h2 className="text-3xl md:text-5xl font-fraunces font-black text-white mb-4">
                Loved by <span className="text-[#ff6b4a]">Developers</span>
              </h2>
            </div>
          </RevealOnScroll>

          <motion.div 
            className="grid md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={staggerItemVariants}>
                <SmoothTilt strength={6}>
                  <div className="relative h-full bg-[#0a0a0f] border border-gray-800 rounded-2xl p-6 hover:border-[#ff6b4a]/30 transition-all">
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(t.rating)].map((_, j) => (
                        <Star key={j} size={14} className="fill-[#ff6b4a] text-[#ff6b4a]" />
                      ))}
                    </div>
                    {/* Quote */}
                    <p className="text-gray-300 text-sm leading-relaxed mb-6">"{t.content}"</p>
                    {/* Author */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b4a] to-[#c8381a] flex items-center justify-center text-white font-bold text-sm">
                        {t.avatar}
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">{t.name}</div>
                        <div className="text-gray-500 text-xs">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </SmoothTilt>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 sm:py-32 relative overflow-hidden">
        <GlowingOrb className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" color="#ff6b4a" size={600} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f] to-[#0d1117]" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            {/* Animated Pi symbol */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              viewport={{ once: true }}
              className="mb-8 inline-block"
            >
              <PiMark variant="hero" size={200} showEyes={true} showOrbit={true} showLabels={false} />
            </motion.div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-fraunces font-black text-white mb-6">
              Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff8a6a] to-[#c8381a]">Build?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 font-mono">
              Get 50 free credits when you sign up. No credit card required.
            </p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link href="/signup" className="inline-flex items-center gap-3 bg-gradient-to-r from-[#ff6b4a] to-[#c8381a] text-white px-10 py-5 rounded-2xl font-bold text-base uppercase tracking-wide hover:shadow-[0_0_60px_rgba(255,107,74,0.5)] transition-all">
                <Rocket size={20} /> Start Free — 50K Tokens
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#050508] border-t border-gray-900 pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center mb-6">
                <PiMark variant="logo" withWordmark />
              </Link>
              <p className="text-gray-500 text-xs leading-relaxed mb-4">
                The unified gateway for AI models. Built by Rareware Studio in Bangladesh.
              </p>
              {/* Social Links */}
              <div className="flex gap-4">
                <a href="#" className="w-9 h-9 rounded-lg bg-[#0d1117] border border-gray-800 flex items-center justify-center text-gray-500 hover:text-[#ff6b4a] hover:border-[#ff6b4a]/30 transition-all">
                  <Twitter size={16} />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-[#0d1117] border border-gray-800 flex items-center justify-center text-gray-500 hover:text-[#ff6b4a] hover:border-[#ff6b4a]/30 transition-all">
                  <Github size={16} />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-[#0d1117] border border-gray-800 flex items-center justify-center text-gray-500 hover:text-[#ff6b4a] hover:border-[#ff6b4a]/30 transition-all">
                  <Linkedin size={16} />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-[#0d1117] border border-gray-800 flex items-center justify-center text-gray-500 hover:text-[#ff6b4a] hover:border-[#ff6b4a]/30 transition-all">
                  <MessageCircle size={16} />
                </a>
              </div>
            </div>
            {[
              { title: 'Platform', links: [['Models', '/models'], ['Pricing', '/pricing'], ['Dashboard', '/dashboard'], ['Playground', '/playground']] },
              { title: 'Resources', links: [['Documentation', '/docs'], ['API Reference', '/docs'], ['Status', '/status'], ['Support', '/support']] },
              { title: 'Legal', links: [['Terms', '/terms'], ['Privacy', '/privacy'], ['Security', '/security'], ['Contact', '/contact']] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="text-white font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-3 text-gray-500 text-xs">
                  {col.links.map(([label, href], j) => (
                    <li key={j}><Link href={href} className="hover:text-[#ff6b4a] transition-colors">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
            <div>© 2026 ReadyPi · Rareware Studio · Bangladesh 🇧🇩</div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Marquee animation style */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.04; }
          50% { opacity: 0.06; }
        }
      `}</style>
    </main>
  )
}

// Stagger container for Framer Motion
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}