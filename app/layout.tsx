import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import type { ReactNode } from 'react'
import Script from 'next/script'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'GI Healthcare',
    template: '%s | GI Healthcare',
  },
  description: 'GI Healthcare Industries Limited',
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html className={inter.variable} lang="en">
      <body>{children}<Script src="/gi-privacy.js" strategy="afterInteractive" /></body>
    </html>
  )
}
