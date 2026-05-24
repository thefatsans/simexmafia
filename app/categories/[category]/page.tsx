'use client'

import { useState, useMemo, useEffect } from 'react'
import { notFound } from 'next/navigation'
import ProductCard from '@/components/ProductCard'
import ProductCardSkeleton from '@/components/ProductCardSkeleton'
import { getProductsFromAPI } from '@/lib/api/products'
import { Category, Platform, Product } from '@/types'
import { sortProducts, type ProductSortOption } from '@/lib/products/sort-products'
import { ArrowUpDown } from 'lucide-react'

const categoryNames: Record<Category, string> = {
  games: 'Videospiele',
  'gift-cards': 'Gutscheine',
  subscriptions: 'Abonnements',
  dlc: 'DLC & Erweiterungen',
  'in-game-currency': 'Spielwährung',
  'top-ups': 'Aufladungen',
}

const PLATFORMS: Platform[] = [
  'Steam',
  'PlayStation',
  'Xbox',
  'Nintendo',
  'Epic Games',
  'Origin',
  'Battle.net',
  'Discord',
  'Other',
]

export default function CategoryPage({ params }: { params: { category: string } }) {
  const category = params.category as Category

  if (!categoryNames[category]) {
    notFound()
  }

  const [sortOption, setSortOption] = useState<ProductSortOption>(
    category === 'gift-cards' ? 'discount-desc' : 'default'
  )
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true)
      try {
        const data = await getProductsFromAPI({ category })
        setProducts(data)
      } catch (error) {
        console.error('Error loading category products:', error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }
    loadProducts()
  }, [category])

  const sortedProducts = useMemo(() => {
    let list = products.filter((p) => p.category === category)
    if (selectedPlatform !== 'all') {
      list = list.filter((p) => p.platform === selectedPlatform)
    }
    return sortProducts(list, sortOption)
  }, [products, category, selectedPlatform, sortOption])

  const platformsInCategory = useMemo(() => {
    const set = new Set<Platform>()
    products
      .filter((p) => p.category === category)
      .forEach((p) => set.add(p.platform))
    return PLATFORMS.filter((p) => set.has(p))
  }, [products, category])

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {category === 'gift-cards' && (
          <div className="mb-6 rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 to-cyan-500/15 px-5 py-4">
            <p className="text-amber-200 font-semibold">☀️ Sommer-Sale auf Gutscheinkarten</p>
            <p className="text-gray-300 text-sm mt-1">
              Jeder Gutschein mindestens <strong className="text-white">20%</strong> Rabatt – ausgewählte Karten{' '}
              <strong className="text-amber-300">30%</strong>.
            </p>
          </div>
        )}

        <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{categoryNames[category]}</h1>
            <p className="text-gray-400">
              {isLoading ? 'Laden…' : `${sortedProducts.length} Produkte`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {platformsInCategory.length > 1 && (
              <select
                value={selectedPlatform}
                onChange={(e) =>
                  setSelectedPlatform(e.target.value as Platform | 'all')
                }
                className="bg-fortnite-dark border border-purple-500/30 rounded-lg px-4 py-2 text-white cursor-pointer"
              >
                <option value="all">Alle Plattformen</option>
                {platformsInCategory.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as ProductSortOption)}
                className="bg-fortnite-dark border border-purple-500/30 rounded-lg px-4 py-2 text-white cursor-pointer"
              >
                <option value="default">Name (A–Z)</option>
                <option value="price-asc">Preis: Niedrig → Hoch</option>
                <option value="price-desc">Preis: Hoch → Niedrig</option>
                <option value="discount-desc">Höchster Rabatt</option>
                <option value="rating-desc">Beste Bewertung</option>
                <option value="popularity">Beliebtheit</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Keine Produkte in dieser Kategorie gefunden.</p>
          </div>
        )}
      </div>
    </div>
  )
}
