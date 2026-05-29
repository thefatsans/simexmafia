'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, CheckCircle, TrendingUp } from 'lucide-react'
import { getSellersFromAPI, SellerWithStats } from '@/lib/api/sellers'

export default function SellersPage() {
  const [sellers, setSellers] = useState<SellerWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getSellersFromAPI()
      .then(setSellers)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Verkäufer</h1>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Verkäufer werden geladen...</div>
        ) : sellers.length === 0 ? (
          <div className="text-center text-gray-400 py-12">Keine Verkäufer gefunden.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {sellers.map((seller) => (
              <Link
                key={seller.id}
                href={`/sellers/${seller.id}`}
                className="group bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-all hover:transform hover:scale-105"
              >
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

                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-white font-semibold ml-1">
                      {seller.reviewCount > 0 ? seller.rating.toFixed(1) : '—'}
                    </span>
                  </div>
                  <span className="text-gray-400 text-sm">
                    ({seller.reviewCount}{' '}
                    {seller.reviewCount === 1 ? 'Bewertung' : 'Bewertungen'})
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>{seller.productCount} Produkte</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-purple-500/20">
                  <span className="text-purple-400 text-sm font-medium group-hover:text-purple-300 transition-colors">
                    Profil anzeigen →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 bg-fortnite-dark border border-purple-500/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Warum SimexMafia?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
              <h3 className="text-white font-semibold mb-2">Verifiziert & Vertrauenswürdig</h3>
              <p className="text-gray-400 text-sm">
                Offizieller Verkäufer mit sicherer Auslieferung digitaler Codes
              </p>
            </div>
            <div>
              <Star className="w-8 h-8 text-yellow-400 mb-3" />
              <h3 className="text-white font-semibold mb-2">Echte Bewertungen</h3>
              <p className="text-gray-400 text-sm">
                Alle Bewertungen stammen von verifizierten Käufern
              </p>
            </div>
            <div>
              <TrendingUp className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-white font-semibold mb-2">Faire Preise</h3>
              <p className="text-gray-400 text-sm">
                Direkt vom Betreiber — ohne Zwischenhändler
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
