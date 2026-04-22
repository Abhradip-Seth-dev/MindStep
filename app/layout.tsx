import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MindStep — Campus Mental Health',
  description: 'Your pattern is already there. You just cannot see it yet.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ background: '#080C12', minHeight: '100vh', overflow: 'hidden auto' }}>
        {children}
      </body>
    </html>
  )
}