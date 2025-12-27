'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense, useMemo } from 'react'
import ProductCard from '@/components/ProductCard'
import { getProductsFromAPI } from '@/lib/api/products'
import { Product } from '@/types'
import { searchProducts } from '@/lib/search-utils'
import { Search as SearchIcon, ArrowUpDown } from 'lucide-react'

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating-desc' | 'rating-asc' | 'popularity' | 'name-asc' | 'name-desc'

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>('default')

  useEffect(() => {
    const loadProducts = async () => {
      if (!query.trim()) {
        setFilteredProducts([])
        return
      }

      setIsLoading(true)
      try {
        // Get all products and use intelligent search
        const allProducts = await getProductsFromAPI()
        
        // Use intelligent search with fuzzy matching for better results
        const matched = searchProducts(allProducts, query, {
          fuzzyThreshold: 0.5, // Balanced threshold for search results
          maxResults: 500, // Allow more results for search page
        })
        
        setFilteredProducts(matched)
      } catch (error) {
        console.error('Error loading search results:', error)
        setFilteredProducts([])
      } finally {
        setIsLoading(false)
      }
    }
    loadProducts()
  }, [query])

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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <SearchIcon className="w-6 h-6 text-purple-400" />
              <h1 className="text-4xl font-bold text-white">
                Suchergebnisse
              </h1>
            </div>
            {sortedProducts.length > 0 && (
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
            )}
          </div>
          {query && (
            <p className="text-gray-400">
              {sortedProducts.length > 0 ? (
                <>
                  <span className="text-purple-400 font-semibold">{sortedProducts.length}</span> Ergebnisse gefunden für "
                  <span className="text-white font-medium">{query}</span>"
                </>
              ) : (
                <>
                  Keine Ergebnisse gefunden für "<span className="text-white font-medium">{query}</span>"
                </>
              )}
            </p>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Suche läuft...</p>
          </div>
        ) : !query ? (
          <div className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Geben Sie einen Suchbegriff ein, um Produkte zu finden</p>
          </div>
        ) : sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">Keine Produkte gefunden</p>
            <p className="text-gray-500 text-sm">
              Versuchen Sie es mit anderen Suchbegriffen oder durchsuchen Sie unsere{' '}
              <a href="/products" className="text-purple-400 hover:text-purple-300">
                allen Produkte
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Lade Suchergebnisse...</p>
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}


