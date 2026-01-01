import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { CartProvider } from '@/contexts/CartContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { WishlistProvider } from '@/contexts/WishlistContext'
import { CompareProvider } from '@/contexts/CompareContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ChatProvider } from '@/contexts/ChatContext'
import StructuredData from '@/components/StructuredData'
import ChatWidget from '@/components/ChatWidget'
import Snowflakes from '@/components/Snowflakes'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'SimexMafia - Digital Gaming Marketplace',
    template: '%s | SimexMafia',
  },
  description: 'Ihr vertrauenswürdiger Marktplatz für vergünstigte Spiele, Gutscheine, Abonnements und mehr. Powered by Simex.',
  keywords: ['Gaming', 'Spiele', 'Gutscheine', 'Steam', 'PlayStation', 'Xbox', 'Nintendo', 'V-Bucks', 'FIFA Points', 'Simex'],
  authors: [{ name: 'Simex' }],
  creator: 'Simex',
  publisher: 'SimexMafia',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: '/',
    siteName: 'SimexMafia',
    title: 'SimexMafia - Digital Gaming Marketplace',
    description: 'Ihr vertrauenswürdiger Marktplatz für vergünstigte Spiele, Gutscheine, Abonnements und mehr.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'SimexMafia Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SimexMafia - Digital Gaming Marketplace',
    description: 'Ihr vertrauenswürdiger Marktplatz für vergünstigte Spiele, Gutscheine, Abonnements und mehr.',
    images: ['/logo.png'],
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
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('simexmafia-theme');
                  const systemPreference = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                  const theme = stored || systemPreference;
                  const root = document.documentElement;
                  if (theme === 'light') {
                    root.classList.add('light');
                    root.classList.remove('dark');
                  } else {
                    root.classList.add('dark');
                    root.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} smooth-scroll`} style={{ scrollBehavior: 'smooth' }}>
        <StructuredData type="organization" />
        <StructuredData type="website" />
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <CompareProvider>
                  <ToastProvider>
                    <ChatProvider>
                      <Snowflakes />
                      <Navbar />
                      <main className="min-h-screen relative z-0">
                        {children}
                      </main>
                      <Footer />
                      <ChatWidget />
                    </ChatProvider>
                  </ToastProvider>
                </CompareProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


