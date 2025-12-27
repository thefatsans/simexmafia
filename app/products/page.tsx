'use client'

import { useState, useMemo, useEffect } from 'react'
import ProductCard from '@/components/ProductCard'
import ProductCardSkeleton from '@/components/ProductCardSkeleton'
import { getProductsFromAPI } from '@/lib/api/products'
import { Product, Category, Platform } from '@/types'
import { Filter, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating-desc' | 'rating-asc' | 'popularity' | 'name-asc' | 'name-desc'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true)
      try {
        const data = await getProductsFromAPI()
        setProducts(data)
      } catch (error) {
        console.error('Error loading products:', error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }
    loadProducts()
  }, [])
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
  const [showFilters, setShowFilters] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>('default')
  const [minRating, setMinRating] = useState<number>(0)
  const [inStockOnly, setInStockOnly] = useState<boolean>(false)
  const [hasDiscount, setHasDiscount] = useState<boolean>(false)

  const categories: Category[] = ['games', 'gift-cards', 'subscriptions', 'dlc', 'in-game-currency']
  const categoryOrder: Category[] = ['games', 'dlc', 'gift-cards', 'in-game-currency', 'subscriptions']
  const categoryNames: Record<Category, string> = {
    'games': 'Spiele',
    'gift-cards': 'Gutscheine',
    'subscriptions': 'Abonnements',
    'dlc': 'DLCs',
    'in-game-currency': 'In-Game-Währung',
    'top-ups': 'Top-Ups',
  }
  const platforms: Platform[] = ['Steam', 'PlayStation', 'Xbox', 'Nintendo', 'Epic Games', 'Origin', 'Battle.net', 'Origin', 'Other']
  
  // Calculate max price for range slider
  const maxPrice = useMemo(() => {
    return Math.max(...products.map(p => p.price), 100)
  }, [products])
  
  useEffect(() => {
    if (maxPrice > 0) {
      setPriceRange([0, Math.min(maxPrice, 100)])
    }
  }, [maxPrice])

  // Filter and sort products, grouped by category
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products]

    // Apply filters
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(p => p.platform === selectedPlatform)
    }

    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])

    // Additional filters
    if (minRating > 0) {
      filtered = filtered.filter(p => p.rating >= minRating)
    }

    if (inStockOnly) {
      filtered = filtered.filter(p => p.inStock)
    }

    if (hasDiscount) {
      filtered = filtered.filter(p => p.discount && p.discount > 0)
    }

    // Apply sorting within each category
    const sortFunction = (a: Product, b: Product) => {
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
    }

    // Group by category
    const grouped = filtered.reduce((acc, product) => {
      const category = product.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(product)
      return acc
    }, {} as Record<Category, Product[]>)

    // Sort products within each category
    Object.keys(grouped).forEach(category => {
      grouped[category as Category].sort(sortFunction)
    })

    // Return grouped structure
    return grouped
  }, [products, selectedCategory, selectedPlatform, priceRange, sortOption, minRating, inStockOnly, hasDiscount])

  // Calculate total count for display
  const totalProductCount = useMemo(() => {
    return Object.values(filteredAndSortedProducts).reduce((sum, products) => sum + products.length, 0)
  }, [filteredAndSortedProducts])

  const handleCategoryChange = (category: Category | 'all') => {
    setSelectedCategory(category)
  }

  const handlePlatformChange = (platform: Platform | 'all') => {
    setSelectedPlatform(platform)
  }

  const handlePriceRangeChange = (value: number) => {
    setPriceRange([priceRange[0], value])
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white dark:text-white text-gray-900 mb-2">Alle Produkte</h1>
          <p className="text-gray-400 dark:text-gray-400 text-gray-600">Finden Sie die besten Angebote für digitale Gaming-Produkte</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className={`lg:w-64 ${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-fortnite-dark dark:bg-fortnite-dark bg-white dark:border-purple-500/20 border-gray-200 border rounded-lg p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white dark:text-white text-gray-900 font-semibold text-lg">Filter</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="text-white dark:text-white text-gray-900 font-medium mb-3">Kategorie</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className={`w-full text-left px-3 py-2 rounded ${
                      selectedCategory === 'all'
                        ? 'bg-purple-500 text-white'
                        : 'bg-fortnite-darker dark:bg-fortnite-darker bg-gray-100 text-gray-300 dark:text-gray-300 text-gray-700 hover:bg-purple-500/20 dark:hover:bg-purple-500/20'
                    } transition-colors`}
                  >
                    Alle Kategorien
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`w-full text-left px-3 py-2 rounded capitalize ${
                        selectedCategory === cat
                          ? 'bg-purple-500 text-white'
                          : 'bg-fortnite-darker dark:bg-fortnite-darker bg-gray-100 text-gray-300 dark:text-gray-300 text-gray-700 hover:bg-purple-500/20 dark:hover:bg-purple-500/20'
                      } transition-colors`}
                    >
                      {cat.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Filter */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Plattform</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handlePlatformChange('all')}
                    className={`w-full text-left px-3 py-2 rounded ${
                      selectedPlatform === 'all'
                        ? 'bg-purple-500 text-white'
                        : 'bg-fortnite-darker text-gray-300 hover:bg-purple-500/20'
                    } transition-colors`}
                  >
                    Alle Plattformen
                  </button>
                  {platforms.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => handlePlatformChange(platform)}
                      className={`w-full text-left px-3 py-2 rounded ${
                        selectedPlatform === platform
                          ? 'bg-purple-500 text-white'
                          : 'bg-fortnite-darker dark:bg-fortnite-darker bg-gray-100 text-gray-300 dark:text-gray-300 text-gray-700 hover:bg-purple-500/20 dark:hover:bg-purple-500/20'
                      } transition-colors`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Preisspanne</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={maxPrice}
                    value={priceRange[1]}
                    onChange={(e) => handlePriceRangeChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>€{priceRange[0].toFixed(2)}</span>
                    <span>€{priceRange[1].toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Mindestbewertung</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Alle</span>
                    <span>{minRating > 0 ? `⭐ ${minRating.toFixed(1)}+` : 'Alle'}</span>
                  </div>
                </div>
              </div>

              {/* Additional Filters */}
              <div className="mb-6 space-y-3">
                <h3 className="text-white font-medium mb-3">Weitere Filter</h3>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-purple-500/30 bg-fortnite-darker text-purple-500 focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-gray-300 dark:text-gray-300 text-gray-700 text-sm">Nur verfügbare Produkte</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasDiscount}
                    onChange={(e) => setHasDiscount(e.target.checked)}
                    className="w-4 h-4 rounded border-purple-500/30 bg-fortnite-darker dark:bg-fortnite-darker bg-gray-100 text-purple-500 focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-gray-300 dark:text-gray-300 text-gray-700 text-sm">Nur Angebote</span>
                </label>
              </div>

              {/* Reset Filters */}
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setSelectedPlatform('all')
                  setPriceRange([0, maxPrice])
                  setMinRating(0)
                  setInStockOnly(false)
                  setHasDiscount(false)
                  setSortOption('default')
                }}
                className="w-full mt-4 px-4 py-2 bg-fortnite-darker dark:bg-fortnite-darker bg-gray-100 border border-purple-500/30 dark:border-purple-500/30 border-gray-300 hover:border-purple-500 dark:hover:border-purple-500 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white rounded-lg transition-colors"
              >
                Filter zurücksetzen
              </button>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden mb-4 flex items-center space-x-2 bg-fortnite-dark border border-purple-500/20 px-4 py-2 rounded-lg text-white hover:bg-purple-500/20 transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span>Filter</span>
            </button>

            {/* Sort and Results Count */}
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-gray-400 dark:text-gray-400 text-gray-600 text-sm sm:text-base">
                Zeige {totalProductCount} von {products.length} Produkten
              </p>
              
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

            {/* Products grouped by category */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : totalProductCount > 0 ? (
              <div className="space-y-12">
                {categoryOrder
                  .filter(category => filteredAndSortedProducts[category] && filteredAndSortedProducts[category].length > 0)
                  .map((category) => {
                    const categoryProducts = filteredAndSortedProducts[category]
                    return (
                      <div key={category}>
                        <h2 className="text-2xl font-bold text-white mb-6">
                          {categoryNames[category]} ({categoryProducts.length})
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {categoryProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 dark:text-gray-400 text-gray-600 text-lg">Keine Produkte gefunden, die Ihren Filtern entsprechen.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


