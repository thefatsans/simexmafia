import { Metadata } from 'next'
import { getProducts } from '@/data/products'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export function generateHomeMetadata(): Metadata {
  return {
    title: 'SimexMafia - Digital Gaming Marketplace',
    description: 'Willkommen bei SimexMafia - Ihrem vertrauenswürdigen Marktplatz für vergünstigte Spiele, Gutscheine, Abonnements und digitale Produkte. Beste Preise für Steam, PlayStation, Xbox, Nintendo und mehr. Powered by Simex.',
    keywords: ['Gaming', 'Spiele', 'Gutscheine', 'Steam', 'PlayStation', 'Xbox', 'Nintendo', 'V-Bucks', 'FIFA Points', 'Simex', 'Digital Games', 'Game Keys'],
    openGraph: {
      title: 'SimexMafia - Digital Gaming Marketplace',
      description: 'Ihr vertrauenswürdiger Marktplatz für vergünstigte Spiele, Gutscheine, Abonnements und mehr.',
      url: baseUrl,
      siteName: 'SimexMafia',
      images: [
        {
          url: '/logo.png',
          width: 1200,
          height: 630,
          alt: 'SimexMafia Logo',
        },
      ],
      locale: 'de_DE',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'SimexMafia - Digital Gaming Marketplace',
      description: 'Ihr vertrauenswürdiger Marktplatz für vergünstigte Spiele, Gutscheine, Abonnements und mehr.',
      images: ['/logo.png'],
    },
    alternates: {
      canonical: '/',
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
}

export function generateProductMetadata(productId: string): Metadata {
  // On server-side, getProducts() returns mockProducts
  // On client-side, it will return products from localStorage
  const products = getProducts()
  const product = products.find(p => p.id === productId)
  
  if (!product) {
    // If product not found, return generic metadata
    // The client-side page will load the actual product
    return {
      title: 'Produkt | SimexMafia',
      description: 'Digital Gaming Marketplace - Beste Preise für Spiele, Gutscheine und mehr.',
      openGraph: {
        title: 'Produkt | SimexMafia',
        description: 'Digital Gaming Marketplace',
        url: `${baseUrl}/products/${productId}`,
      },
    }
  }

  return {
    title: product.name,
    description: `${product.name} für ${product.platform} - Jetzt für nur €${product.price.toFixed(2)} kaufen! ${product.description.substring(0, 100)}...`,
    keywords: [product.name, product.platform, product.category, ...product.tags],
    openGraph: {
      title: `${product.name} | SimexMafia`,
      description: `${product.name} für ${product.platform} - Jetzt für nur €${product.price.toFixed(2)} kaufen!`,
      url: `${baseUrl}/products/${product.id}`,
      type: 'website',
      images: product.image ? [
        {
          url: product.image,
          width: 1200,
          height: 630,
          alt: product.name,
        }
      ] : ['/logo.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | SimexMafia`,
      description: `${product.name} für ${product.platform} - Jetzt für nur €${product.price.toFixed(2)} kaufen!`,
      images: product.image ? [product.image] : ['/logo.png'],
    },
    alternates: {
      canonical: `/products/${product.id}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export function generateProductsMetadata(): Metadata {
  return {
    title: 'Alle Produkte | SimexMafia',
    description: 'Durchsuchen Sie alle verfügbaren Produkte auf SimexMafia - Spiele, Gutscheine, Abonnements, DLC und Spielwährung zu besten Preisen. Filter nach Kategorie, Plattform, Preis und mehr.',
    keywords: ['Produkte', 'Spiele', 'Gutscheine', 'DLC', 'Spielwährung', 'Steam', 'PlayStation', 'Xbox', 'Nintendo'],
    openGraph: {
      title: 'Alle Produkte | SimexMafia',
      description: 'Durchsuchen Sie alle verfügbaren Produkte auf SimexMafia - Spiele, Gutscheine, Abonnements, DLC und Spielwährung zu besten Preisen.',
      url: `${baseUrl}/products`,
      type: 'website',
      images: ['/logo.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Alle Produkte | SimexMafia',
      description: 'Durchsuchen Sie alle verfügbaren Produkte auf SimexMafia.',
    },
    alternates: {
      canonical: '/products',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export function generateCategoryMetadata(category: string): Metadata {
  const categoryNames: Record<string, string> = {
    'games': 'Videospiele',
    'gift-cards': 'Gutscheine',
    'subscriptions': 'Abonnements',
    'dlc': 'DLC & Erweiterungen',
    'in-game-currency': 'Spielwährung',
  }

  const categoryName = categoryNames[category] || category

  return {
    title: `${categoryName} | SimexMafia`,
    description: `Durchsuchen Sie ${categoryName} auf SimexMafia - Beste Preise für digitale Gaming-Produkte. Große Auswahl an ${categoryName} für alle Plattformen.`,
    keywords: [categoryName, 'Gaming', 'Spiele', 'Digitale Produkte', 'Beste Preise'],
    openGraph: {
      title: `${categoryName} | SimexMafia`,
      description: `Durchsuchen Sie ${categoryName} auf SimexMafia - Beste Preise für digitale Gaming-Produkte.`,
      url: `${baseUrl}/categories/${category}`,
      type: 'website',
      images: ['/logo.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${categoryName} | SimexMafia`,
      description: `Durchsuchen Sie ${categoryName} auf SimexMafia.`,
    },
    alternates: {
      canonical: `/categories/${category}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}
