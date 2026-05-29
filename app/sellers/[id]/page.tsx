'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { getSellerFromAPI, SellerWithStats } from '@/lib/api/sellers'
import { getProductsFromAPI } from '@/lib/api/products'
import { Star, CheckCircle, Package, Shield } from 'lucide-react'
import { Product } from '@/types'
import { SIMEXMAFIA_SELLER_ID } from '@/lib/sellers'

export default function SellerPage({ params }: { params: { id: string } }) {
  const [seller, setSeller] = useState<SellerWithStats | null>(null)
  const [sellerProducts, setSellerProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [sellerData, products] = await Promise.all([
          getSellerFromAPI(params.id),
          getProductsFromAPI(),
        ])

        if (!sellerData || params.id !== SIMEXMAFIA_SELLER_ID) {
          setNotFoundState(true)
          return
        }

        setSeller(sellerData)
        setSellerProducts(products.filter((product) => product.seller.id === params.id))
      } catch (error) {
        console.error('Error loading seller:', error)
        setNotFoundState(true)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [params.id])

  if (notFoundState) {
    notFound()
  }

  if (isLoading || !seller) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">Laden...</div>
        </div>
      </div>
    )
  }

  const averagePrice =
    sellerProducts.length > 0
      ? sellerProducts.reduce((sum, product) => sum + product.price, 0) / sellerProducts.length
      : 0

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-purple-400">
            Startseite
          </Link>
          <span className="mx-2">/</span>
          <Link href="/sellers" className="hover:text-purple-400">
            Verkäufer
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white">{seller.name}</span>
        </nav>

        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-3 mb-4">
                <h1 className="text-4xl font-bold text-white">{seller.name}</h1>
                {seller.verified && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                      Verifizierter Verkäufer
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4 mb-4">
                {seller.reviewCount > 0 ? (
                  <>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${
                            i < Math.floor(seller.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="ml-3 text-white font-semibold text-xl">
                        {seller.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-gray-400">
                      ({seller.reviewCount}{' '}
                      {seller.reviewCount === 1 ? 'Bewertung' : 'Bewertungen'})
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">Noch keine Bewertungen</span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-fortnite-darker rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <Package className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-400 text-sm">Produkte</span>
                  </div>
                  <p className="text-white font-bold text-2xl">{sellerProducts.length}</p>
                </div>
                <div className="bg-fortnite-darker rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <Star className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-400 text-sm">Bewertungen</span>
                  </div>
                  <p className="text-white font-bold text-2xl">{seller.reviewCount}</p>
                </div>
                <div className="bg-fortnite-darker rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-400 text-sm">Ø Preis</span>
                  </div>
                  <p className="text-white font-bold text-2xl">€{averagePrice.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-semibold mb-2">Über SimexMafia</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                SimexMafia ist der offizielle Verkäufer auf diesem Marktplatz. Alle Produkte
                werden direkt ausgeliefert — Bewertungen stammen ausschließlich von verifizierten
                Käufern.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white">Produkte von {seller.name}</h2>
            <span className="text-gray-400">
              {sellerProducts.length} {sellerProducts.length === 1 ? 'Produkt' : 'Produkte'}
            </span>
          </div>

          {sellerProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sellerProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-fortnite-dark border border-purple-500/20 rounded-lg">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Derzeit keine Produkte verfügbar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
