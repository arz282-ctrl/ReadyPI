import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth-context'
import AssistantGate from '@/components/AssistantGate'

export const metadata: Metadata = {
  title: 'ReadyPi — Asia\'s First AI API Gateway | Gemini, GPT-4, Llama',
  description: 'Access 150+ AI models including Gemini, GPT-4, and Llama with bKash/Nagad payment. One API key. Pay in BDT. Asia\'s largest AI gateway with local currency support.',
  keywords: 'AI API, Bangladesh, bKash, Nagad, OpenAI, Claude, Gemini, GPT-4, OpenRouter, DeepSeek, Llama, Developer Tools',
  openGraph: {
    title: 'ReadyPi — Asia\'s First AI API Gateway',
    description: 'Access 150+ AI models including Gemini, GPT-4, and Llama with bKash/Nagad payment.',
    url: 'https://readypi.io',
    siteName: 'ReadyPi',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReadyPi — Asia\'s First AI API Gateway',
    description: 'Access 150+ AI models including Gemini, GPT-4, and Llama with bKash/Nagad payment.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const assistantEnabled = process.env.NEXT_PUBLIC_ENABLE_ASSISTANT === 'true'

  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <AuthProvider>
          {children}
          {assistantEnabled ? <AssistantGate /> : null}
        </AuthProvider>
      </body>
    </html>
  )
}
