'use client'

import { useCompare } from '@/contexts/CompareContext'
import { useRouter } from 'next/navigation'
import { X, ShoppingCart, Star, Package, TrendingUp, Shield, Zap } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'
import Image from 'next/image'
import { Product } from '@/types'

export default function ComparePage() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare()
  const { addToCart } = useCart()
  const { showSuccess } = useToast()
  const router = useRouter()

  if (compareItems.length === 0) {
    return (
      <div className="min-h-screen py-12 bg-fortnite-darker">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <Package className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">Produktvergleich</h1>
            <p className="text-gray-400 text-lg mb-8">
              Sie haben noch keine Produkte zum Vergleich hinzugefügt.
            </p>
            <button
              onClick={() => router.push('/products')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-3 rounded-lg transition-all transform hover:scale-105"
            >
              Zu den Produkten
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1)
    showSuccess(`${product.name} wurde zum Warenkorb hinzugefügt`)
  }

  const features = [
    { key: 'price', label: 'Preis', icon: TrendingUp },
    { key: 'originalPrice', label: 'Originalpreis', icon: Package },
    { key: 'discount', label: 'Rabatt', icon: TrendingUp },
    { key: 'platform', label: 'Plattform', icon: Zap },
    { key: 'category', label: 'Kategorie', icon: Package },
    { key: 'rating', label: 'Bewertung', icon: Star },
    { key: 'reviewCount', label: 'Anzahl Bewertungen', icon: Star },
    { key: 'seller', label: 'Verkäufer', icon: Shield },
    { key: 'inStock', label: 'Verfügbarkeit', icon: Package },
  ]

  return (
    <div className="min-h-screen py-12 bg-fortnite-darker">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Produktvergleich</h1>
            <p className="text-gray-400">
              Vergleichen Sie bis zu {compareItems.length} Produkte
            </p>
          </div>
          <button
            onClick={clearCompare}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            Alle entfernen
          </button>
        </div>

        {/* Comparison Table */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-fortnite-darker border-b border-purple-500/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white sticky left-0 bg-fortnite-darker z-10 min-w-[200px]">
                    Eigenschaft
                  </th>
                  {compareItems.map((product) => (
                    <th key={product.id} className="px-6 py-4 text-center text-sm font-semibold text-white min-w-[250px] relative">
                      <button
                        onClick={() => removeFromCompare(product.id)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="mt-6">
                        <div className="relative w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-purple-900/50 to-yellow-900/50 rounded-lg overflow-hidden">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="128px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <h3 className="text-white font-semibold mb-2">{product.name}</h3>
                        <button
                          onClick={() => {
                            window.location.href = `/products/${product.id}`
                          }}
                          className="text-purple-400 hover:text-purple-300 text-sm mb-3"
                        >
                          Details ansehen
                        </button>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-4 py-2 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>In den Warenkorb</span>
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/20">
                {features.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <tr key={feature.key} className="hover:bg-purple-500/10 transition-colors">
                      <td className="px-6 py-4 sticky left-0 bg-fortnite-dark z-10">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-5 h-5 text-purple-400" />
                          <span className="text-white font-medium">{feature.label}</span>
                        </div>
                      </td>
                      {compareItems.map((product) => (
                        <td key={product.id} className="px-6 py-4 text-center text-gray-300">
                          {feature.key === 'price' && (
                            <span className="text-white font-semibold text-lg">
                              €{product.price.toFixed(2)}
                            </span>
                          )}
                          {feature.key === 'originalPrice' && (
                            <span className={product.originalPrice ? 'text-gray-400 line-through' : 'text-gray-600'}>
                              {product.originalPrice ? `€${product.originalPrice.toFixed(2)}` : '-'}
                            </span>
                          )}
                          {feature.key === 'discount' && (
                            <span className={product.discount ? 'text-green-400 font-semibold' : 'text-gray-600'}>
                              {product.discount ? `-${product.discount}%` : '-'}
                            </span>
                          )}
                          {feature.key === 'platform' && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-sm">
                              {product.platform}
                            </span>
                          )}
                          {feature.key === 'category' && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
                              {product.category}
                            </span>
                          )}
                          {feature.key === 'rating' && (
                            <div className="flex items-center justify-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span>{product.rating.toFixed(1)}</span>
                            </div>
                          )}
                          {feature.key === 'reviewCount' && (
                            <span>{product.reviewCount}</span>
                          )}
                          {feature.key === 'seller' && (
                            <div>
                              <span className="text-white">{product.seller.name}</span>
                              {product.seller.verified && (
                                <Shield className="w-4 h-4 text-green-400 inline-block ml-1" />
                              )}
                            </div>
                          )}
                          {feature.key === 'inStock' && (
                            <span
                              className={`px-2 py-1 rounded text-sm ${
                                product.inStock
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {product.inStock ? 'Auf Lager' : 'Nicht verfügbar'}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-center space-x-4">
          <button
            onClick={() => {
              compareItems.forEach(product => addToCart(product, 1))
              showSuccess('Alle Produkte wurden zum Warenkorb hinzugefügt')
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-3 rounded-lg transition-all transform hover:scale-105 flex items-center space-x-2"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Alle zum Warenkorb hinzufügen</span>
          </button>
        </div>
      </div>
    </div>
  )
}






