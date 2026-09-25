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
  metadataBase: new URL('https://www.gihealthcare.co.uk'),
  title: {
    default: 'GI Healthcare',
    template: '%s | GI Healthcare',
  },
  description: 'GI Healthcare develops autonomous cooking machines for everyday life, extreme environments and space exploration.',
  icons: { icon: [{ url: '/icons/gi-icon-96.png', type: 'image/png', sizes: '96x96' }], apple: '/icons/gi-icon-180.png' },
  openGraph: { siteName: 'GI Healthcare', type: 'website', locale: 'en_GB', images: [{ url: '/icons/gi-icon-512.png', width: 512, height: 512, alt: 'GI Healthcare' }] },
  twitter: { card: 'summary', images: ['/icons/gi-icon-512.png'] },
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html className={inter.variable} lang="en">
      <body>{children}<Script src="/gi-privacy.js" strategy="afterInteractive" /></body>
    </html>
  )
}
