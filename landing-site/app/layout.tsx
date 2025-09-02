import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'skillflo.ai - AI-Powered Mock Interviews',
  description: 'Practice interviews. Get hired. That simple. AI mock interviews that actually prepare you for the real thing.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>{children}</body>
    </html>
  )
}
