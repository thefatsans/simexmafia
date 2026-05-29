import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import ProductDetailClient from '@/components/ProductDetailClient'
import { loadStorefrontProduct } from '@/lib/products/load-storefront-product'
import { loadProductReviews } from '@/lib/reviews/load-product-reviews'

export const revalidate = 60

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [product, initialReviews] = await Promise.all([
    loadStorefrontProduct(params.id),
    loadProductReviews(params.id),
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="relative z-0">
      <Suspense
        fallback={
          <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-gray-400 text-lg">Produkt wird geladen...</p>
            </div>
          </div>
        }
      >
        <ProductDetailClient
          productId={params.id}
          initialProduct={product}
          initialReviews={initialReviews}
        />
      </Suspense>
    </div>
  )
}
