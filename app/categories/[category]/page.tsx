'use client'

import { useState, useMemo, useEffect } from 'react'
import { notFound } from 'next/navigation'
import ProductCard from '@/components/ProductCard'
import { getProductsFromAPI } from '@/lib/api/products'
import { Category, Product } from '@/types'
import { ArrowUpDown } from 'lucide-react'

const categoryNames: Record<Category, string> = {
  'games': 'Videospiele',
  'gift-cards': 'Gutscheine',
  'subscriptions': 'Abonnements',
  'dlc': 'DLC & Erweiterungen',
  'in-game-currency': 'Spielwährung',
  'top-ups': 'Aufladungen',
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating-desc' | 'rating-asc' | 'popularity' | 'name-asc' | 'name-desc'

export default function CategoryPage({ params }: { params: { category: string } }) {
  const category = params.category as Category
  const [sortOption, setSortOption] = useState<SortOption>('default')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  if (!categoryNames[category]) {
    notFound()
  }

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true)
      try {
        const products = await getProductsFromAPI({ category })
        setFilteredProducts(products)
      } catch (error) {
        console.error('Error loading category products:', error)
        setFilteredProducts([])
      } finally {
        setIsLoading(false)
      }
    }
    loadProducts()
  }, [category])

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts].sort((a, b) => {
      switch (sortOption) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'rating-desc':
          return b.rating - a.rating
        case 'rating-asc':
          return a.rating - b.rating
        case 'popularity':
          return b.reviewCount - a.reviewCount
        case 'name-asc':
          return a.name.localeCompare(b.name, 'de')
        case 'name-desc':
          return b.name.localeCompare(a.name, 'de')
        default:
          return 0
      }
    })
    return sorted
  }, [filteredProducts, sortOption])

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{categoryNames[category]}</h1>
              <p className="text-gray-400">{sortedProducts.length} Produkte</p>
            </div>
            
            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-4 h-4 text-gray-400" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="bg-fortnite-dark border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
              >
                <option value="default">Standard</option>
                <option value="price-asc">Preis: Niedrig zu Hoch</option>
                <option value="price-desc">Preis: Hoch zu Niedrig</option>
                <option value="rating-desc">Bewertung: Höchste zuerst</option>
                <option value="rating-asc">Bewertung: Niedrigste zuerst</option>
                <option value="popularity">Beliebtheit</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="name-desc">Name: Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Lade Produkte...</p>
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


