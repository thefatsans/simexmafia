import { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  title: 'FAQ - Häufig gestellte Fragen | SimexMafia',
  description: 'Finden Sie schnell Antworten auf häufig gestellte Fragen zu Bestellungen, Zahlungen, Account, Produkten, Säcken, GoofyCoins und mehr auf SimexMafia.',
  keywords: ['FAQ', 'Hilfe', 'Fragen', 'Support', 'Anleitung', 'SimexMafia'],
  openGraph: {
    title: 'FAQ - Häufig gestellte Fragen | SimexMafia',
    description: 'Finden Sie schnell Antworten auf häufig gestellte Fragen zu Bestellungen, Zahlungen, Account, Produkten und mehr.',
    url: `${baseUrl}/faq`,
    type: 'website',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ - Häufig gestellte Fragen | SimexMafia',
    description: 'Finden Sie schnell Antworten auf häufig gestellte Fragen.',
  },
  alternates: {
    canonical: '/faq',
  },
  robots: {
    index: true,
    follow: true,
  },
}






