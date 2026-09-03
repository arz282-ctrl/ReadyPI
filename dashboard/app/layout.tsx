import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth-context'
import AssistantGate from '@/components/AssistantGate'

export const metadata: Metadata = {
  title: "ReadyPi — India's #1 AI API Gateway & Market | Sarvam AI, Gemini, GPT-4o, Claude",
  description: "Access 150+ AI models including Sarvam AI, Krutrim, Gemini 2.5, GPT-4o, and Claude 3.5 with UPI & Razorpay payments. One API key. Pay in INR (₹). Built for Indian developers & enterprises.",
  keywords: 'AI API India, Sarvam AI, Krutrim, UPI payments, Razorpay, PhonePe, Paytm, OpenAI India, Claude, Gemini, GPT-4o, OpenRouter, DeepSeek, Llama, Developer Tools India',
  openGraph: {
    title: "ReadyPi — India's Premier AI API Gateway & Market",
    description: 'Access 150+ AI models including Sarvam AI, Gemini, GPT-4o, and Claude with UPI & Razorpay payments.',
    url: 'https://readypi.site',
    siteName: 'ReadyPi India',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "ReadyPi — India's Premier AI API Gateway & Market",
    description: 'Access 150+ AI models including Sarvam AI, Gemini, GPT-4o, and Claude with UPI & Razorpay payments.',
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
