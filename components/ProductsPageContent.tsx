'use client'

import { useState, useMemo, useEffect } from 'react'
import ProductCard from '@/components/ProductCard'
import ProductCardSkeleton from '@/components/ProductCardSkeleton'
import { seedProductsClientCache } from '@/lib/api/products'
import { Product, Category, Platform } from '@/types'
import {
  sortProducts,
  groupProductsByCategory,
  type ProductSortOption,
} from '@/lib/products/sort-products'
import { Filter, X, ArrowUpDown } from 'lucide-react'
import ReferralBanner from '@/components/ReferralBanner'

const CATEGORIES: Category[] = [
  'games',
  'gift-cards',
  'subscriptions',
  'dlc',
  'in-game-currency',
]

const CATEGORY_ORDER: Category[] = [
  'games',
  'dlc',
  'gift-cards',
  'in-game-currency',
  'subscriptions',
]

const CATEGORY_NAMES: Record<Category, string> = {
  games: 'Spiele',
  'gift-cards': 'Gutscheine',
  subscriptions: 'Abonnements',
  dlc: 'DLCs',
  'in-game-currency': 'In-Game-Währung',
  'top-ups': 'Top-Ups',
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

export default function ProductsPageContent({
  initialProducts,
}: {
  initialProducts: Product[]
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [showFilters, setShowFilters] = useState(false)
  const [sortOption, setSortOption] = useState<ProductSortOption>('default')
  const [minRating, setMinRating] = useState(0)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [hasDiscount, setHasDiscount] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const category = params.get('category')
    if (category && (CATEGORIES as string[]).includes(category)) {
      setSelectedCategory(category as Category)
    }
  }, [])

  useEffect(() => {
    seedProductsClientCache(initialProducts)
    setProducts(initialProducts)
  }, [initialProducts])

  const maxPrice = useMemo(() => {
    if (products.length === 0) return 500
    return Math.ceil(Math.max(...products.map((p) => p.price), 1))
  }, [products])

  useEffect(() => {
    setPriceRange([0, maxPrice])
  }, [maxPrice])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false
      if (selectedPlatform !== 'all' && p.platform !== selectedPlatform) return false
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false
      if (minRating > 0 && p.rating < minRating) return false
      if (inStockOnly && !p.inStock) return false
      if (hasDiscount && !(p.discount && p.discount > 0)) return false
      return true
    })
  }, [
    products,
    selectedCategory,
    selectedPlatform,
    priceRange,
    minRating,
    inStockOnly,
    hasDiscount,
  ])

  const filteredAndSortedProducts = useMemo(() => {
    const sorted = sortProducts(filteredProducts, sortOption)
    return groupProductsByCategory(sorted, CATEGORY_ORDER)
  }, [filteredProducts, sortOption])

  const totalProductCount = useMemo(() => {
    return Object.values(filteredAndSortedProducts).reduce(
      (sum, list) => sum + (list?.length ?? 0),
      0
    )
  }, [filteredAndSortedProducts])

  const visibleCategories =
    selectedCategory === 'all'
      ? CATEGORY_ORDER.filter(
          (cat) =>
            filteredAndSortedProducts[cat] && filteredAndSortedProducts[cat]!.length > 0
        )
      : CATEGORY_ORDER.filter((cat) => cat === selectedCategory)

  return (
    <div className="min-h-screen py-8 page-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Alle Produkte</h1>
          <p className="text-gray-400">
            Finden Sie die besten Angebote für digitale Gaming-Produkte
          </p>
        </div>

        <ReferralBanner storageKey="referral-banner-dismissed-products" className="mb-6" />

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className={`lg:w-64 ${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-semibold text-lg">Filter</h2>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Kategorie</h3>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-purple-500 text-white'
                        : 'bg-fortnite-darker text-gray-300 hover:bg-purple-500/20'
                    }`}
                  >
                    Alle Kategorien
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded transition-colors ${
                        selectedCategory === cat
                          ? 'bg-purple-500 text-white'
                          : 'bg-fortnite-darker text-gray-300 hover:bg-purple-500/20'
                      }`}
                    >
                      {CATEGORY_NAMES[cat]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Plattform</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform('all')}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      selectedPlatform === 'all'
                        ? 'bg-purple-500 text-white'
                        : 'bg-fortnite-darker text-gray-300 hover:bg-purple-500/20'
                    }`}
                  >
                    Alle Plattformen
                  </button>
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => setSelectedPlatform(platform)}
                      className={`w-full text-left px-3 py-2 rounded transition-colors ${
                        selectedPlatform === platform
                          ? 'bg-purple-500 text-white'
                          : 'bg-fortnite-darker text-gray-300 hover:bg-purple-500/20'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Preisspanne</h3>
                <input
                  type="range"
                  min={0}
                  max={maxPrice}
                  step={1}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>€{priceRange[0].toFixed(0)}</span>
                  <span>€{priceRange[1].toFixed(0)}</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Mindestbewertung</h3>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.5}
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-400 mt-2 text-right">
                  {minRating > 0 ? `⭐ ${minRating.toFixed(1)}+` : 'Alle'}
                </p>
              </div>

              <div className="mb-6 space-y-3">
                <h3 className="text-white font-medium mb-3">Weitere Filter</h3>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-purple-500/30 bg-fortnite-darker text-purple-500"
                  />
                  <span className="text-gray-300 text-sm">Nur verfügbare Produkte</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasDiscount}
                    onChange={(e) => setHasDiscount(e.target.checked)}
                    className="w-4 h-4 rounded border-purple-500/30 bg-fortnite-darker text-purple-500"
                  />
                  <span className="text-gray-300 text-sm">Nur Angebote</span>
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all')
                  setSelectedPlatform('all')
                  setPriceRange([0, maxPrice])
                  setMinRating(0)
                  setInStockOnly(false)
                  setHasDiscount(false)
                  setSortOption('default')
                }}
                className="w-full px-4 py-2 bg-fortnite-darker border border-purple-500/30 hover:border-purple-500 text-gray-300 hover:text-white rounded-lg transition-colors"
              >
                Filter zurücksetzen
              </button>
            </div>
          </aside>

          <div className="flex-1">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden mb-4 flex items-center space-x-2 bg-fortnite-dark border border-purple-500/20 px-4 py-2 rounded-lg text-white"
            >
              <Filter className="w-5 h-5" />
              <span>Filter</span>
            </button>

            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-gray-400 text-sm sm:text-base">
                Zeige {totalProductCount} von {products.length} Produkten
              </p>
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as ProductSortOption)}
                  className="bg-fortnite-dark border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="default">Name (A–Z)</option>
                  <option value="price-asc">Preis: Niedrig → Hoch</option>
                  <option value="price-desc">Preis: Hoch → Niedrig</option>
                  <option value="discount-desc">Höchster Rabatt</option>
                  <option value="rating-desc">Beste Bewertung</option>
                  <option value="popularity">Beliebtheit</option>
                  <option value="name-desc">Name (Z–A)</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : totalProductCount > 0 ? (
              <div className="space-y-12">
                {visibleCategories.map((category) => {
                  const categoryProducts = filteredAndSortedProducts[category]!
                  return (
                    <div key={category}>
                      <h2 className="text-2xl font-bold text-white mb-6">
                        {CATEGORY_NAMES[category]} ({categoryProducts.length})
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
                <p className="text-gray-400 text-lg">
                  Keine Produkte gefunden, die Ihren Filtern entsprechen.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
