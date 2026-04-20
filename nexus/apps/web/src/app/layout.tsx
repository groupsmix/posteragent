import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NEXUS - AI Product Creator',
  description: 'Create products with AI-powered workflows',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
