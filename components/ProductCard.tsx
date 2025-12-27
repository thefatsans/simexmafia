'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { Star, ShoppingCart, Heart, GitCompare } from 'lucide-react'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import { useCompare } from '@/contexts/CompareContext'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const discountPercentage = product.discount || 0
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { addToCart } = useCart()
  const { addToCompare, isInCompare, canAddMore } = useCompare()
  const { showSuccess, showError } = useToast()
  const { isAuthenticated } = useAuth()
  const inWishlist = isInWishlist(product.id)
  const inCompare = isInCompare(product.id)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      showError('Bitte melden Sie sich an, um Produkte zu kaufen')
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    
    setIsAdding(true)
    addToCart(product)
    setTimeout(() => setIsAdding(false), 500)
  }

  const handleWishlistToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product)
  }

  const handleCompareToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (inCompare) {
      showError('Produkt ist bereits im Vergleich')
      return
    }
    if (!canAddMore) {
      showError('Sie können maximal 3 Produkte vergleichen')
      return
    }
    addToCompare(product)
    showSuccess(`${product.name} wurde zum Vergleich hinzugefügt`)
  }

  return (
    <div className="group bg-fortnite-dark dark:bg-fortnite-dark bg-white dark:border-purple-500/20 border-gray-200 rounded-lg overflow-hidden hover:border-purple-500/50 dark:hover:border-purple-500/50 hover:border-purple-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 dark:hover:shadow-purple-500/20 relative">
      {/* Image Container */}
      <div className="relative aspect-video bg-gradient-to-br from-purple-900/50 to-yellow-900/50 overflow-hidden">
        <Link href={`/products/${product.id}`} className="block w-full h-full">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHh4WIRwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">🎮</span>
            </div>
          )}
        </Link>
        
        {discountPercentage > 0 && (
          <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded-md text-xs font-bold z-10 pointer-events-none">
            -{discountPercentage}%
          </div>
        )}
        
        <div className="absolute top-2 left-2 flex flex-col space-y-2 z-30">
          <button
            onClick={handleWishlistToggle}
            className="bg-black/50 hover:bg-black/70 backdrop-blur-sm p-2 rounded-full transition-all"
            title={inWishlist ? 'Von Wunschliste entfernen' : 'Zur Wunschliste hinzufügen'}
          >
            <Heart
              className={`w-5 h-5 transition-all ${
                inWishlist ? 'fill-red-500 text-red-500' : 'text-white hover:text-red-400'
              }`}
            />
          </button>
          <button
            onClick={handleCompareToggle}
            disabled={!canAddMore && !inCompare}
            className="bg-black/50 hover:bg-black/70 backdrop-blur-sm p-2 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={inCompare ? 'Bereits im Vergleich' : canAddMore ? 'Zum Vergleich hinzufügen' : 'Maximal 3 Produkte vergleichen'}
          >
            <GitCompare
              className={`w-5 h-5 transition-all ${
                inCompare ? 'fill-purple-500 text-purple-500' : 'text-white hover:text-purple-400'
              }`}
            />
          </button>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Link href={`/products/${product.id}`} className="text-white dark:text-white text-gray-900 font-semibold text-sm line-clamp-2 group-hover:text-purple-400 dark:group-hover:text-purple-400 group-hover:text-purple-600 transition-colors">
            {product.name}
          </Link>
        </div>

        {/* Platform Badge */}
        <div className="mb-2">
          <span className="inline-block bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded">
            {product.platform}
          </span>
        </div>

        {/* Seller Info */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-300 dark:text-gray-300 text-gray-600 ml-1">{product.seller.rating}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-500 text-gray-400">•</span>
          <span className="text-xs text-gray-400 dark:text-gray-400 text-gray-600">{product.seller.name}</span>
          {product.seller.verified && (
            <span className="text-xs bg-green-500/20 text-green-400 px-1 rounded">✓</span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline space-x-2">
            {product.discount && product.discount > 0 ? (
              <>
                <span className="text-xl font-bold text-white dark:text-white text-gray-900">€{product.price.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-500 dark:text-gray-500 text-gray-400 line-through">
                    €{product.originalPrice.toFixed(2)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xl font-bold text-white dark:text-white text-gray-900">
                €{(product.originalPrice || product.price).toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all transform hover:scale-110 active:scale-95 relative z-10"
            title="In den Warenkorb"
          >
            <ShoppingCart className={`w-4 h-4 ${isAdding ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  )
}
