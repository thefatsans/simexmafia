'use client'

import { useWishlist } from '@/contexts/WishlistContext'
import { useToast } from '@/contexts/ToastContext'
import ProductCard from '@/components/ProductCard'
import { Heart, Trash2, ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useState, useEffect } from 'react'
import AnimatedSection from '@/components/AnimatedSection'

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist()
  const { addToCart } = useCart()
  const { showSuccess, showError } = useToast()
  const [isClearing, setIsClearing] = useState(false)

  // Debug: Log wishlist on mount and changes
  useEffect(() => {
    console.log('WishlistPage - Current wishlist:', wishlist.length, 'items', wishlist)
  }, [wishlist])

  // Debug: Log wishlist on mount
  useEffect(() => {
    console.log('WishlistPage - Current wishlist:', wishlist)
  }, [wishlist])

  const handleRemove = (productId: string) => {
    removeFromWishlist(productId)
    showSuccess('Von Wunschliste entfernt')
  }

  const handleClearAll = () => {
    if (confirm('Möchten Sie wirklich alle Artikel von der Wunschliste entfernen?')) {
      setIsClearing(true)
      clearWishlist()
      showSuccess('Wunschliste geleert')
      setTimeout(() => setIsClearing(false), 500)
    }
  }

  const handleAddAllToCart = () => {
    wishlist.forEach(product => {
      addToCart(product, 1)
    })
    showSuccess(`${wishlist.length} Artikel zum Warenkorb hinzugefügt`)
  }

  return (
    <div className="min-h-screen py-8 page-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimatedSection animationType="fadeInUp" className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                <Heart className="w-8 h-8 mr-3 text-red-400 fill-red-400" />
                Meine Wunschliste
              </h1>
              <p className="text-gray-400">
                {wishlist.length === 0
                  ? 'Ihre Wunschliste ist leer'
                  : `${wishlist.length} ${wishlist.length === 1 ? 'Artikel' : 'Artikel'} in Ihrer Wunschliste`}
              </p>
            </div>
            {wishlist.length > 0 && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleAddAllToCart}
                  className="flex items-center space-x-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Alle zum Warenkorb</span>
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={isClearing}
                  className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Alle entfernen</span>
                </button>
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* Wishlist Content */}
        {wishlist.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Ihre Wunschliste ist leer</h2>
            <p className="text-gray-400 mb-8">
              Fügen Sie Produkte hinzu, die Sie später kaufen möchten
            </p>
            <a
              href="/products"
              onClick={(e) => {
                e.preventDefault()
                window.location.href = '/products'
              }}
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-lg smooth-hover"
            >
              Produkte durchsuchen
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((product, index) => (
              <div key={product.id} className={`relative group animate-fade-in-scale animate-delay-${Math.min((index % 4) * 100, 600)}`}>
                <ProductCard product={product} />
                <button
                  onClick={() => handleRemove(product.id)}
                  className="absolute top-2 left-2 bg-red-500/80 hover:bg-red-500 backdrop-blur-sm p-2 rounded-full smooth-hover opacity-0 group-hover:opacity-100 z-40"
                  title="Von Wunschliste entfernen"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
