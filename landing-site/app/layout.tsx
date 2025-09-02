import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'skillflo.ai - AI-Powered Mock Interviews',
  description: 'Practice interviews. Get hired. That simple. AI mock interviews that actually prepare you for the real thing.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
