'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getProductFromAPI } from '@/lib/api/products'
import { getProductReviewsFromAPI } from '@/lib/api/reviews'
import { Review } from '@/data/reviews'
import { Product } from '@/types'
import Image from 'next/image'
import { Star, ShoppingCart, Shield, Zap, CheckCircle, AlertCircle, GitCompare, Package } from 'lucide-react'
import ProductReviews from '@/components/ProductReviews'
import ProductRecommendations from '@/components/ProductRecommendations'
import { useCart } from '@/contexts/CartContext'
import { useCompare } from '@/contexts/CompareContext'
import { useToast } from '@/contexts/ToastContext'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { getSimilarProducts, getCustomersAlsoBought } from '@/data/recommendations'
import { getStorefrontFallbackCatalog } from '@/lib/products/storefront-seeds'
import StructuredData from '@/components/StructuredData'
import SocialShare from '@/components/SocialShare'
import PriceAlertButton from '@/components/PriceAlertButton'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getStockDetailLabel, isProductOutOfStock } from '@/lib/products/stock-display'
import { isKeyInventoryProduct } from '@/lib/products/key-inventory-catalog'

function recommendationCatalog(product: Product): Product[] {
  const catalog = getStorefrontFallbackCatalog()
  if (catalog.some((item) => item.id === product.id)) {
    return catalog.map((item) => (item.id === product.id ? product : item))
  }
  return [...catalog, product]
}

export default function ProductDetailClient({
  productId,
  initialProduct,
}: {
  productId: string
  initialProduct: Product
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToCart } = useCart()
  const { addToCompare, isInCompare, canAddMore } = useCompare()
  const { showSuccess, showError } = useToast()
  const { addProduct } = useRecentlyViewed()
  const { isAuthenticated } = useAuth()
  const [product, setProduct] = useState<Product>(initialProduct)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [showReviewSuccess, setShowReviewSuccess] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [customersAlsoBought, setCustomersAlsoBought] = useState<Product[]>([])
  const inCompare = isInCompare(product.id)
  const outOfStock = isProductOutOfStock(product)
  const stockDetailLabel = getStockDetailLabel(product)
  const showKeyStock = isKeyInventoryProduct(product)
  const displayRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0
  const displayReviewCount = reviews.length

  useEffect(() => {
    let cancelled = false
    addProduct(initialProduct)

    const loadExtras = async () => {
      setReviewsLoading(true)
      try {
        const productReviews = await getProductReviewsFromAPI(productId)
        if (cancelled) return

        setReviews(productReviews)
        const catalog = recommendationCatalog(initialProduct)
        const [similar, alsoBought] = await Promise.all([
          getSimilarProducts(initialProduct, 4, productId, catalog),
          getCustomersAlsoBought(productId, 4, catalog),
        ])
        if (cancelled) return
        setSimilarProducts(similar)
        setCustomersAlsoBought(alsoBought)
      } catch (error) {
        console.error('Error loading product extras:', error)
      } finally {
        if (!cancelled) setReviewsLoading(false)
      }
    }

    loadExtras()

    getProductFromAPI(productId)
      .then((fresh) => {
        if (!cancelled && fresh) setProduct(fresh)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [productId, initialProduct, addProduct])

  // Handle review submission success
  useEffect(() => {
    if (searchParams.get('reviewSubmitted') === 'true' && product) {
      setShowReviewSuccess(true)
      setTimeout(() => setShowReviewSuccess(false), 5000)
      
      // Lade Reviews neu, falls ein neues Review erstellt wurde
      getProductReviewsFromAPI(product.id).then(setReviews).catch(console.error)
    }
  }, [searchParams, product.id])

  return (
    <>
      <div className="min-h-screen py-8 relative z-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-0">
          {/* Success Message */}
          {showReviewSuccess && (
            <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-green-400 font-semibold">Bewertung erfolgreich veröffentlicht!</p>
                <p className="text-gray-400 text-sm">Vielen Dank für Ihre Bewertung.</p>
              </div>
            </div>
          )}

          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-400">
            <Link href="/" className="hover:text-purple-400">
              Startseite
            </Link>
            <span className="mx-2">/</span>
            <Link href="/products" className="hover:text-purple-400">
              Produkte
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Product Image */}
            <div className="relative aspect-video bg-gradient-to-br from-purple-900/50 to-yellow-900/50 rounded-lg overflow-hidden">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  quality={95}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHh4WIRwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">🎮</span>
                </div>
              )}
              {product.discount && (
                <div className="absolute top-4 right-4 bg-purple-500 text-white px-4 py-2 rounded-lg text-lg font-bold">
                  -{product.discount}%
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-4">
                <span className="inline-block bg-purple-500/20 text-purple-300 text-sm px-3 py-1 rounded mb-3">
                  {product.platform}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4 break-words">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center space-x-4 mb-6">
                {displayReviewCount > 0 ? (
                  <>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(displayRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-white font-medium">
                        {displayRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-gray-400">
                      ({displayReviewCount}{' '}
                      {displayReviewCount === 1 ? 'Bewertung' : 'Bewertungen'})
                    </span>
                  </>
                ) : reviewsLoading ? (
                  <span className="text-gray-400">Bewertungen werden geladen...</span>
                ) : (
                  <span className="text-gray-400">Noch keine Bewertungen</span>
                )}
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                  {product.discount && product.discount > 0 ? (
                    <>
                      <span className="text-3xl sm:text-5xl font-bold text-white">€{product.price.toFixed(2)}</span>
                      {product.originalPrice && (
                        <span className="text-xl sm:text-2xl text-gray-500 line-through">
                          €{product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-3xl sm:text-5xl font-bold text-white">
                      €{(product.originalPrice || product.price).toFixed(2)}
                    </span>
                  )}
                </div>
                {product.discount && product.discount > 0 && (
                  <p className="text-green-400">Save €{(product.originalPrice! - product.price).toFixed(2)}</p>
                )}
                {stockDetailLabel && (
                  <div
                    className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${
                      outOfStock
                        ? 'border-red-500/30 bg-red-500/10 text-red-400'
                        : showKeyStock
                          ? 'border-green-500/30 bg-green-500/10 text-green-400'
                          : 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                    }`}
                  >
                    {showKeyStock && <Package className="w-4 h-4 shrink-0" />}
                    <span>{stockDetailLabel}</span>
                  </div>
                )}
              </div>

              {/* Seller Info */}
              <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-4 mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-white font-medium">Verkauft von:</span>
                  <Link
                    href={`/sellers/${product.seller.id}`}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {product.seller.name}
                  </Link>
                  {product.seller.verified && (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span>{product.seller.rating}</span>
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <span>{product.seller.reviewCount} Bewertungen</span>
                  <span className="hidden sm:inline">•</span>
                  <Link
                    href={`/sellers/${product.seller.id}`}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Verkäuferprofil anzeigen →
                  </Link>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="space-y-4">
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      showError('Bitte melden Sie sich an, um Produkte zu kaufen')
                      router.push(`/auth/login?redirect=${encodeURIComponent(`/products/${product.id}`)}`)
                      return
                    }
                    setIsAddingToCart(true)
                    addToCart(product)
                    setTimeout(() => setIsAddingToCart(false), 500)
                  }}
                  disabled={isAddingToCart || outOfStock}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50 flex items-center justify-center space-x-2"
                >
                  {isAddingToCart ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                  <span>
                    {outOfStock
                      ? 'Ausverkauft'
                      : isAddingToCart
                        ? 'Wird hinzugefügt...'
                        : 'In den Warenkorb'}
                  </span>
                </button>
                <a
                  href="/checkout"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (outOfStock) {
                      showError('Dieses Produkt ist derzeit ausverkauft')
                      return
                    }
                    if (!isAuthenticated) {
                      showError('Bitte melden Sie sich an, um Produkte zu kaufen')
                      router.push(`/auth/login?redirect=${encodeURIComponent(`/products/${product.id}`)}`)
                      return
                    }
                    addToCart(product)
                    router.push('/checkout')
                  }}
                  className={`block w-full bg-fortnite-dark border-2 text-white font-semibold px-8 py-4 rounded-lg transition-all text-center ${
                    outOfStock
                      ? 'border-gray-600 text-gray-500 cursor-not-allowed pointer-events-none'
                      : 'border-purple-500/50 hover:border-purple-500 cursor-pointer'
                  }`}
                >
                  {outOfStock ? 'Ausverkauft' : 'Jetzt kaufen'}
                </a>
                <button
                  onClick={() => {
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
                  }}
                  disabled={!canAddMore && !inCompare}
                  className={`w-full border-2 ${
                    inCompare
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : 'border-purple-500/50 hover:border-purple-500 bg-fortnite-dark text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed font-semibold px-8 py-4 rounded-lg transition-all flex items-center justify-center space-x-2`}
                >
                  <GitCompare className={`w-5 h-5 ${inCompare ? 'fill-purple-500' : ''}`} />
                  <span>
                    {inCompare
                      ? 'Bereits im Vergleich'
                      : canAddMore
                      ? 'Zum Vergleich hinzufügen'
                      : 'Maximal 3 Produkte vergleichen'}
                  </span>
                </button>
                <PriceAlertButton product={product} />
              </div>

              {/* Features */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center space-x-3 text-gray-300">
                  <Zap className="w-5 h-5 text-purple-400" />
                  <span>Sofortige digitale Lieferung</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span>Sicherer Checkout</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                  <span>Verifizierter Verkäufer</span>
                </div>
              </div>

              {/* Social Share */}
              <div className="mt-8 pt-8 border-t border-purple-500/20">
                <SocialShare
                  url={`/products/${product.id}`}
                  title={product.name}
                  description={`${product.name} für ${product.platform} - Jetzt für nur €${product.price.toFixed(2)} bei SimexMafia!`}
                  image={product.image}
                  size="md"
                  variant="horizontal"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Beschreibung</h2>
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <p className="text-gray-300 leading-relaxed">{product.description}</p>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-12">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-yellow-400 font-semibold mb-2">Wichtiger Hinweis</h3>
                <p className="text-gray-300 text-sm">
                  Bitte beachten Sie, dass Rückerstattungen nur verarbeitet werden, bevor Sie den digitalen Key einlösen. 
                  Nach der Aktivierung kann das Produkt nicht zurückerstattet werden. Überprüfen Sie immer die Verkäuferbewertungen 
                  vor einem Kauf, um eine sichere Transaktion zu gewährleisten.
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="mb-12">
            <ProductReviews reviews={reviews} productId={product.id} isLoading={reviewsLoading} />
          </div>

          {/* Customers Also Bought */}
          {customersAlsoBought.length > 0 && (
            <div className="mb-12">
              <ProductRecommendations
                title="Kunden kauften auch"
                products={customersAlsoBought}
              />
            </div>
          )}

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <div className="mb-12">
              <ProductRecommendations
                title="Ähnliche Produkte"
                products={similarProducts}
              />
            </div>
          )}
        </div>
      </div>
      <StructuredData type="product" data={product} />
      <StructuredData 
        type="breadcrumb" 
        data={[
          { name: 'Startseite', url: '/' },
          { name: 'Produkte', url: '/products' },
          { name: product.name, url: `/products/${product.id}` },
        ]} 
      />
    </>
  )
}
