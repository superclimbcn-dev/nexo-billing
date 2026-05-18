import type { Metadata } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://billing.nexo-digital.app'),
  title: {
    default: 'Nexo Billing — Facturación Verifactu para autónomos',
    template: '%s | Nexo Billing',
  },
  description:
    'Crea facturas en segundos, cumple con Verifactu 2027 y presenta impuestos sin estrés. Diseñado para autónomos y PYMES españolas.',
  keywords: [
    'facturación',
    'verifactu',
    'autónomos',
    'PYMES',
    'España',
    'AEAT',
    'facturas online',
    'modelo 303',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://billing.nexo-digital.app',
    siteName: 'Nexo Billing',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@nexobilling',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nexo Billing',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
