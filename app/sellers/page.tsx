'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { mockSellers } from '@/data/sellers'
import { Star, CheckCircle, TrendingUp } from 'lucide-react'
import { getProductsFromAPI } from '@/lib/api/products'
import { Product } from '@/types'

export default function SellersPage() {
  const [sellersWithStats, setSellersWithStats] = useState(
    mockSellers.map(seller => ({
      ...seller,
      productCount: 0,
    }))
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSellerStats = async () => {
      try {
        // Lade alle Produkte von der API
        const products = await getProductsFromAPI()
        
        // Zähle Produkte pro Verkäufer
        const productCounts: Record<string, number> = {}
        products.forEach((product: Product) => {
          const sellerId = product.seller.id
          productCounts[sellerId] = (productCounts[sellerId] || 0) + 1
        })

        // Aktualisiere Verkäufer mit echten Produktanzahlen
        const updatedSellers = mockSellers.map(seller => ({
          ...seller,
          productCount: productCounts[seller.id] || 0,
        }))

        setSellersWithStats(updatedSellers)
      } catch (error) {
        console.error('Error loading seller stats:', error)
        // Fallback zu Mock-Daten bei Fehler
        setSellersWithStats(
          mockSellers.map(seller => ({
            ...seller,
            productCount: 0,
          }))
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadSellerStats()
  }, [])

  // Sort by rating and review count
  const sortedSellers = [...sellersWithStats].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating
    return b.reviewCount - a.reviewCount
  })

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Top Verkäufer</h1>
          <p className="text-gray-400 text-lg">
            Durchsuchen Sie unsere verifizierten Verkäufer und finden Sie die besten Angebote
          </p>
        </div>

        {/* Sellers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedSellers.map((seller) => (
            <Link
              key={seller.id}
              href={`/sellers/${seller.id}`}
              className="group bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-all hover:transform hover:scale-105"
            >
              {/* Seller Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-white font-semibold text-lg group-hover:text-purple-400 transition-colors">
                      {seller.name}
                    </h3>
                    {seller.verified && (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    )}
                  </div>
                  {seller.verified && (
                    <span className="inline-block bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded mb-2">
                      Verifizierter Verkäufer
                    </span>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-white font-semibold ml-1">{seller.rating}</span>
                </div>
                <span className="text-gray-400 text-sm">({seller.reviewCount.toLocaleString()} Bewertungen)</span>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>{seller.productCount} Produkte</span>
                </div>
              </div>

              {/* View Profile Link */}
              <div className="mt-4 pt-4 border-t border-purple-500/20">
                <span className="text-purple-400 text-sm font-medium group-hover:text-purple-300 transition-colors">
                  Profil anzeigen →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-fortnite-dark border border-purple-500/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Warum verifizierte Verkäufer wählen?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
              <h3 className="text-white font-semibold mb-2">Verifiziert & Vertrauenswürdig</h3>
              <p className="text-gray-400 text-sm">
                Alle Verkäufer durchlaufen eine Verifizierung, um sichere Transaktionen zu gewährleisten
              </p>
            </div>
            <div>
              <Star className="w-8 h-8 text-yellow-400 mb-3" />
              <h3 className="text-white font-semibold mb-2">Hohe Bewertungen</h3>
              <p className="text-gray-400 text-sm">
                Durchsuchen Sie Verkäufer basierend auf Kundenbewertungen und Ratings
              </p>
            </div>
            <div>
              <TrendingUp className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-white font-semibold mb-2">Beste Preise</h3>
              <p className="text-gray-400 text-sm">
                Vergleichen Sie Preise mehrerer Verkäufer, um die besten Angebote zu finden
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


