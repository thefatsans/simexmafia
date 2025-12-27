import { Product } from '@/types'

interface StructuredDataProps {
  type: 'product' | 'organization' | 'website' | 'breadcrumb' | 'itemList' | 'faq'
  data?: any
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const getStructuredData = () => {
    switch (type) {
      case 'product':
        const product = data as Product
        return {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description,
          image: product.image || '/logo.png',
          brand: {
            '@type': 'Brand',
            name: product.platform,
          },
          offers: {
            '@type': 'Offer',
            url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/products/${product.id}`,
            priceCurrency: 'EUR',
            price: product.price,
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: product.seller.name,
            },
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }

      case 'organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'SimexMafia',
          url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/logo.png`,
          description: 'Digital Gaming Marketplace - Ihr vertrauenswürdiger Marktplatz für vergünstigte Spiele, Gutscheine, Abonnements und mehr.',
          sameAs: [
            'https://youtube.com/@simex',
            'https://twitter.com/simex',
            'https://instagram.com/simex',
          ],
        }

      case 'website':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'SimexMafia',
          url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        }

      case 'breadcrumb':
        const items = data as Array<{ name: string; url: string }>
        return {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${item.url}`,
          })),
        }

      case 'itemList':
        const products = data as Product[]
        return {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: products.map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Product',
              name: product.name,
              image: product.image || '/logo.png',
              description: product.description,
              offers: {
                '@type': 'Offer',
                price: product.price,
                priceCurrency: 'EUR',
                availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              },
            },
          })),
        }

      case 'faq':
        const faqs = data as Array<{ question: string; answer: string }>
        return {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }

      default:
        return null
    }
  }

  const structuredData = getStructuredData()

  if (!structuredData) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}


