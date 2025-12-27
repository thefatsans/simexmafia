'use client'

import { Product } from '@/types'
import ProductCard from './ProductCard'
import { Sparkles } from 'lucide-react'

interface ProductRecommendationsProps {
  title: string
  products: Product[]
  variant?: 'default' | 'compact'
  showEmpty?: boolean
}

export default function ProductRecommendations({
  title,
  products,
  variant = 'default',
  showEmpty = false,
}: ProductRecommendationsProps) {
  if (products.length === 0 && !showEmpty) {
    return null
  }

  if (products.length === 0 && showEmpty) {
    return (
      <div className="py-12 text-center">
        <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Keine Empfehlungen verfügbar</p>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="flex items-center space-x-3 mb-6">
        <Sparkles className="w-6 h-6 text-purple-400" />
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      <div
        className={`grid gap-6 ${
          variant === 'compact'
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}






