'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ArrowLeft, Download, CheckCircle, Star, Gift, Coins, Filter, X, CreditCard, Wallet, TrendingUp } from 'lucide-react'
import { getProductFromAPI } from '@/lib/api/products'
import { getUserReviewsFromAPI } from '@/lib/api/reviews'
import { mockUser } from '@/data/user'
import { Review } from '@/data/reviews'
import { getUserOrders, Order, OrderItem } from '@/data/payments'
import { getSackByType } from '@/data/sacks'

export default function OrdersPage() {
  const [userReviews, setUserReviews] = useState<Review[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')
  const [filterType, setFilterType] = useState<'all' | 'product' | 'sack' | 'goofycoins'>('all')

  useEffect(() => {
    // Load user reviews from API
    const loadReviews = async () => {
      try {
        const reviews = await getUserReviewsFromAPI(mockUser.id)
        setUserReviews(reviews)
      } catch (error) {
        console.error('Error loading user reviews:', error)
        // Fallback zu localStorage
        if (typeof window !== 'undefined') {
          try {
            const localReviews = JSON.parse(localStorage.getItem('userReviews') || '[]')
            setUserReviews(localReviews)
          } catch (e) {
            console.error('Error loading reviews from localStorage:', e)
          }
        }
      }
    }
    loadReviews()
    
    // Load orders
    loadOrders()
  }, [])

  const loadOrders = async () => {
    const userOrders = await getUserOrders(mockUser.id)
    setOrders(userOrders)
  }

  const hasUserReviewed = (productId: string) => {
    return userReviews.some(
      (review) => review.productId === productId && review.userId === mockUser.id
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'processing':
        return 'bg-blue-500/20 text-blue-400'
      case 'failed':
        return 'bg-red-500/20 text-red-400'
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'Abgeschlossen'
      case 'pending':
        return 'Ausstehend'
      case 'processing':
        return 'Wird verarbeitet'
      case 'failed':
        return 'Fehlgeschlagen'
      case 'cancelled':
        return 'Storniert'
      default:
        return status
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit-card':
        return <CreditCard className="w-4 h-4" />
      case 'paypal':
        return <Wallet className="w-4 h-4" />
      default:
        return <CreditCard className="w-4 h-4" />
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'credit-card':
        return 'Kreditkarte'
      case 'paypal':
        return 'PayPal'
      case 'apple-pay':
        return 'Apple Pay'
      case 'google-pay':
        return 'Google Pay'
      default:
        return method
    }
  }

  const getItemIcon = (item: OrderItem) => {
    switch (item.type) {
      case 'sack':
        return '🎁'
      case 'goofycoins':
        return '🪙'
      case 'product':
        return '🎮'
      default:
        return '📦'
    }
  }

  // Komponente für Product Link Button - sucht nach Produkt per ID oder Name
  const ProductLinkButton = ({ item }: { item: OrderItem }) => {
    const [productId, setProductId] = useState<string | null>(item.metadata?.productId || null)
    const [isSearching, setIsSearching] = useState(false)

    useEffect(() => {
      // Wenn productId vorhanden, prüfe ob Produkt existiert
      if (item.metadata?.productId) {
        getProductFromAPI(item.metadata.productId)
          .then(product => {
            if (!product && item.name) {
              // Produkt nicht gefunden, suche nach Name
              setIsSearching(true)
              searchProductByNameForLink(item.name)
                .then(foundProduct => {
                  if (foundProduct) {
                    setProductId(foundProduct.id)
                  }
                })
                .finally(() => setIsSearching(false))
            }
          })
          .catch(() => {
            // Fehler beim Laden, versuche nach Name
            if (item.name) {
              setIsSearching(true)
              searchProductByNameForLink(item.name)
                .then(foundProduct => {
                  if (foundProduct) {
                    setProductId(foundProduct.id)
                  }
                })
                .finally(() => setIsSearching(false))
            }
          })
      } else if (item.name) {
        // Keine ID, suche direkt nach Name
        setIsSearching(true)
        searchProductByNameForLink(item.name)
          .then(foundProduct => {
            if (foundProduct) {
              setProductId(foundProduct.id)
            }
          })
          .finally(() => setIsSearching(false))
      }
    }, [item])

    const searchProductByNameForLink = async (productName: string): Promise<any> => {
      try {
        const { generateProducts } = await import('@/prisma/product-data')
        const sellerIds = ['seller1', 'seller2', 'seller3', 'seller4']
        const generatedProducts = generateProducts(sellerIds)
        const found = generatedProducts.find((p: any) => 
          p.name.toLowerCase() === productName.toLowerCase()
        )
        return found ? { id: found.id } : null
      } catch (error) {
        return null
      }
    }

    if (!productId && !isSearching) {
      return null
    }

    return (
      <a
        href={`/products/${productId || item.metadata?.productId || ''}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const targetId = productId || item.metadata?.productId
          if (targetId) {
            window.location.href = `/products/${targetId}`
          }
        }}
        className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
      >
        <Download className="w-4 h-4" />
        <span>Ansehen</span>
      </a>
    )
  }

  // Komponente für Order Item mit asynchronem Produktbild
  const OrderItemRow = ({ item }: { item: OrderItem }) => {
    const [productImage, setProductImage] = useState<string | null>(null)
    const [isLoadingImage, setIsLoadingImage] = useState(false)

    useEffect(() => {
      if (item.type === 'product') {
        setIsLoadingImage(true)
        // Versuche zuerst mit productId
        const productId = item.metadata?.productId
        if (productId) {
          getProductFromAPI(productId)
            .then(async product => {
              if (product?.image) {
                // Verwende getCompleteProductImage für korrektes Bild
                try {
                  const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
                  const correctImage = getCompleteProductImage(product.name) || product.image
                  setProductImage(correctImage)
                } catch {
                  setProductImage(product.image)
                }
              }
            })
            .catch(() => {
              // Wenn ID nicht gefunden, versuche nach Name zu suchen
              if (item.name) {
                searchProductByName(item.name)
                  .then(product => {
                    if (product?.image) {
                      setProductImage(product.image)
                    }
                  })
                  .catch(() => {
                    // Fallback zu Icon
                  })
              }
            })
            .finally(() => {
              setIsLoadingImage(false)
            })
        } else if (item.name) {
          // Wenn keine ID, versuche direkt nach Name
          searchProductByName(item.name)
            .then(product => {
              if (product?.image) {
                setProductImage(product.image)
              }
            })
            .catch(() => {
              // Fallback zu Icon
            })
            .finally(() => {
              setIsLoadingImage(false)
            })
        } else {
          setIsLoadingImage(false)
        }
      }
    }, [item])
    
    const searchProductByName = async (productName: string): Promise<any> => {
      try {
        // Suche in generierten Produkten
        const { generateProducts } = await import('@/prisma/product-data')
        const sellerIds = ['seller1', 'seller2', 'seller3', 'seller4']
        const generatedProducts = generateProducts(sellerIds)
        
        const searchNameLower = productName.toLowerCase().trim()
        
        // 1. Exakte Übereinstimmung (höchste Priorität)
        let found = generatedProducts.find((p: any) => {
          const productNameLower = p.name.toLowerCase().trim()
          return productNameLower === searchNameLower
        })
        
        // 2. Wenn nicht gefunden, suche nach normalisierter Übereinstimmung (ohne Sonderzeichen)
        if (!found) {
          const normalizedSearch = searchNameLower.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
          found = generatedProducts.find((p: any) => {
            const normalizedName = p.name.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
            return normalizedName === normalizedSearch
          })
        }
        
        // 3. Wenn immer noch nicht gefunden, suche nach Teilübereinstimmung (nur wenn exakt genug)
        // ABER: Verhindere Fehlzuordnungen - z.B. "Discord Nitro" sollte nicht mit "V-Bucks" verwechselt werden
        if (!found && searchNameLower.length > 5) {
          // Nur wenn der Suchbegriff lang genug ist und keine offensichtlichen Fehlzuordnungen
          found = generatedProducts.find((p: any) => {
            const nameLower = p.name.toLowerCase().trim()
            // Prüfe ob der Name den Suchbegriff enthält UND umgekehrt
            // ABER: Verhindere Fehlzuordnungen zwischen verschiedenen Produkttypen
            const searchWords = searchNameLower.split(/\s+/)
            const nameWords = nameLower.split(/\s+/)
            
            // Wenn beide "discord" enthalten, dann ist es wahrscheinlich das richtige Produkt
            if (searchNameLower.includes('discord') && nameLower.includes('discord')) {
              return true
            }
            
            // Wenn beide "v-bucks" oder "vbucks" enthalten, dann ist es wahrscheinlich das richtige Produkt
            if ((searchNameLower.includes('v-bucks') || searchNameLower.includes('vbucks')) && 
                (nameLower.includes('v-bucks') || nameLower.includes('vbucks'))) {
              return true
            }
            
            // Ansonsten: exakte Übereinstimmung der ersten Wörter
            if (searchWords.length > 0 && nameWords.length > 0) {
              return searchWords[0] === nameWords[0] && nameLower.includes(searchNameLower)
            }
            
            return false
          })
        }
        
        if (found) {
          // IMMER getCompleteProductImage verwenden für korrektes Bild
          const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
          const correctImage = getCompleteProductImage(found.name)
          
          // Debug: Log wenn Bild nicht gefunden wird
          if (!correctImage) {
            console.warn(`No image found in complete-product-images.ts for: ${found.name}`)
          }
          
          // Verwende das korrekte Bild oder Fallback
          const finalImage = correctImage || found.image
          
          return {
            id: found.id,
            name: found.name,
            image: correctImage,
            price: found.price,
            description: found.description,
            category: found.category,
            platform: found.platform,
            rating: found.rating,
            reviewCount: found.reviewCount,
            inStock: found.inStock,
            tags: found.tags,
            seller: {
              id: found.sellerId || 'seller1',
              name: found.sellerId === 'seller1' ? 'GameDeals Pro' : found.sellerId === 'seller2' ? 'DigitalKeys Store' : found.sellerId === 'seller3' ? 'GiftCard Masters' : 'Subscriptions Hub',
              rating: 4.7,
              reviewCount: 2000,
              verified: true,
            },
          }
        }
        return null
      } catch (error) {
        console.error('Error searching product by name:', error)
        return null
      }
    }

    return (
      <div className="flex items-center space-x-4">
        <div className="relative w-20 h-20 bg-gradient-to-br from-purple-900/50 to-yellow-900/50 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
          {item.type === 'product' && item.metadata?.productId && productImage ? (
            <Image
              src={productImage}
              alt={item.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <span className="text-2xl">{getItemIcon(item)}</span>
          )}
        </div>
        <div className="flex-1">
          <h4 className="text-white font-semibold">{item.name}</h4>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`text-xs px-2 py-1 rounded ${
              item.type === 'sack' ? 'bg-purple-500/20 text-purple-300' :
              item.type === 'goofycoins' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-blue-500/20 text-blue-300'
            }`}>
              {item.type === 'sack' ? 'Sack' : item.type === 'goofycoins' ? 'GoofyCoins' : 'Produkt'}
            </span>
            {item.metadata?.sackType && (
              <span className="text-gray-400 text-xs">
                {getSackByType(item.metadata.sackType)?.icon} {getSackByType(item.metadata.sackType)?.name}
              </span>
            )}
            {item.metadata?.totalCoins && (
              <span className="text-yellow-400 text-xs">
                {item.metadata.totalCoins} Coins
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-semibold">€{(item.price * item.quantity).toFixed(2)}</p>
          <p className="text-gray-400 text-sm">Menge: {item.quantity}</p>
        </div>
        {item.type === 'product' && (
          <div className="flex items-center space-x-2">
            <ProductLinkButton item={item} />
            {item.metadata?.productId && hasUserReviewed(item.metadata.productId) ? (
              <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg flex items-center space-x-2 text-sm">
                <Star className="w-4 h-4" />
                <span>Bewertet</span>
              </span>
            ) : item.metadata?.productId ? (
              <Link
                href={`/products/${item.metadata.productId}/review`}
                onClick={(e) => e.stopPropagation()}
                className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Star className="w-4 h-4" />
                <span>Bewertung</span>
              </Link>
            ) : null}
          </div>
        )}
      </div>
    )
  }

  const getFilteredOrders = () => {
    return orders.filter(order => {
      if (filterStatus !== 'all' && order.status !== filterStatus) return false
      if (filterType !== 'all') {
        const hasType = order.items.some(item => item.type === filterType)
        if (!hasType) return false
      }
      return true
    })
  }

  const getOrderStatistics = () => {
    const completed = orders.filter(o => o.status === 'completed')
    const totalSpent = completed.reduce((sum, o) => sum + o.total, 0)
    const totalCoinsEarned = completed.reduce((sum, o) => sum + (o.coinsEarned || 0), 0)
    
    return {
      total: orders.length,
      completed: completed.length,
      totalSpent,
      totalCoinsEarned,
    }
  }

  const statistics = getOrderStatistics()
  const filteredOrders = getFilteredOrders()

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Konto
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Bestellhistorie</h1>
          <p className="text-gray-400">Sehen Sie alle Ihre vergangenen Käufe</p>
        </div>

        {/* Statistics */}
        {orders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Package className="w-6 h-6 text-purple-400" />
                <h3 className="text-gray-400 text-sm">Gesamt</h3>
              </div>
              <div className="text-3xl font-bold text-white">{statistics.total}</div>
            </div>
            <div className="bg-fortnite-dark border border-green-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <h3 className="text-gray-400 text-sm">Abgeschlossen</h3>
              </div>
              <div className="text-3xl font-bold text-green-400">{statistics.completed}</div>
            </div>
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <h3 className="text-gray-400 text-sm">Gesamt ausgegeben</h3>
              </div>
              <div className="text-3xl font-bold text-white">€{statistics.totalSpent.toFixed(2)}</div>
            </div>
            <div className="bg-fortnite-dark border border-yellow-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Coins className="w-6 h-6 text-yellow-400" />
                <h3 className="text-gray-400 text-sm">Coins verdient</h3>
              </div>
              <div className="text-3xl font-bold text-yellow-400">{statistics.totalCoinsEarned}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        {orders.length > 0 && (
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400 font-semibold">Filter:</span>
              </div>
              
              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-fortnite-darker border border-purple-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="all">Alle</option>
                  <option value="completed">Abgeschlossen</option>
                  <option value="pending">Ausstehend</option>
                  <option value="failed">Fehlgeschlagen</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">Typ:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-fortnite-darker border border-purple-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="all">Alle</option>
                  <option value="product">Produkte</option>
                  <option value="sack">Säcke</option>
                  <option value="goofycoins">GoofyCoins</option>
                </select>
              </div>

              {(filterStatus !== 'all' || filterType !== 'all') && (
                <button
                  onClick={() => {
                    setFilterStatus('all')
                    setFilterType('all')
                  }}
                  className="ml-auto text-purple-400 hover:text-purple-300 text-sm flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Filter zurücksetzen</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-all cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                {/* Order Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-6 border-b border-purple-500/20">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-white">Bestellung {order.id}</h3>
                      <span className={`${getStatusColor(order.status)} px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1`}>
                        <CheckCircle className="w-4 h-4" />
                        <span>{getStatusText(order.status)}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <p>Bestellt: {formatDate(order.createdAt)}</p>
                      {order.completedAt && (
                        <p>Abgeschlossen: {formatDate(order.completedAt)}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-2 text-sm text-gray-400">
                      {getPaymentMethodIcon(order.paymentMethod)}
                      <span>{getPaymentMethodText(order.paymentMethod)}</span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 text-right">
                    <p className="text-gray-400 text-sm mb-1">Gesamt</p>
                    <p className="text-white font-bold text-2xl">€{order.total.toFixed(2)}</p>
                    {order.coinsEarned && order.coinsEarned > 0 && (
                      <p className="text-purple-400 text-sm mt-1">
                        +{order.coinsEarned} GoofyCoins verdient
                      </p>
                    )}
                    {order.discount > 0 && (
                      <p className="text-green-400 text-xs mt-1">
                        -€{order.discount.toFixed(2)} Rabatt
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <OrderItemRow key={index} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-fortnite-dark border border-purple-500/20 rounded-lg">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">Noch keine Bestellungen</h3>
            <p className="text-gray-400 mb-6">Beginnen Sie mit dem Einkaufen, um Ihre Bestellungen hier zu sehen</p>
            <Link
              href="/products"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-lg transition-all transform hover:scale-105"
            >
              Produkte durchsuchen
            </Link>
          </div>
        ) : (
          <div className="text-center py-12 bg-fortnite-dark border border-purple-500/20 rounded-lg">
            <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">Keine Bestellungen gefunden</h3>
            <p className="text-gray-400 mb-6">Versuchen Sie andere Filter</p>
            <button
              onClick={() => {
                setFilterStatus('all')
                setFilterType('all')
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <span>Filter zurücksetzen</span>
            </button>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
            <div className="bg-fortnite-dark border border-purple-500/30 rounded-lg p-8 max-w-2xl w-full relative my-8">
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-3xl font-bold text-white mb-6">Bestelldetails</h2>

              {/* Order Info */}
              <div className="bg-fortnite-darker rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Bestellnummer</div>
                    <div className="text-white font-semibold">{selectedOrder.id}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Status</div>
                    <span className={`${getStatusColor(selectedOrder.status)} px-3 py-1 rounded-full text-sm font-medium inline-flex items-center space-x-1`}>
                      <CheckCircle className="w-4 h-4" />
                      <span>{getStatusText(selectedOrder.status)}</span>
                    </span>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Bestelldatum</div>
                    <div className="text-white font-semibold">{formatDate(selectedOrder.createdAt)}</div>
                  </div>
                  {selectedOrder.completedAt && (
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Abgeschlossen</div>
                      <div className="text-white font-semibold">{formatDate(selectedOrder.completedAt)}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Zahlungsmethode</div>
                    <div className="text-white font-semibold flex items-center space-x-2">
                      {getPaymentMethodIcon(selectedOrder.paymentMethod)}
                      <span>{getPaymentMethodText(selectedOrder.paymentMethod)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-4">Bestellte Artikel</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="bg-fortnite-darker rounded-lg p-4 flex items-center space-x-4">
                      <div className="text-3xl">{getItemIcon(item)}</div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">{item.name}</div>
                        <div className="text-gray-400 text-sm">Menge: {item.quantity}</div>
                      </div>
                      <div className="text-white font-semibold">€{(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-fortnite-darker rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4">Preisübersicht</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Zwischensumme</span>
                    <span className="text-white">€{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Servicegebühr</span>
                    <span className="text-white">€{selectedOrder.serviceFee.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-400">Rabatt</span>
                      <span className="text-green-400">-€{selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-purple-500/20 pt-2 mt-2 flex items-center justify-between">
                    <span className="text-white font-semibold">Gesamt</span>
                    <span className="text-purple-400 font-bold text-xl">€{selectedOrder.total.toFixed(2)}</span>
                  </div>
                  {selectedOrder.coinsEarned && selectedOrder.coinsEarned > 0 && (
                    <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-purple-500/20">
                      <span className="text-yellow-400">GoofyCoins verdient</span>
                      <span className="text-yellow-400 font-semibold">+{selectedOrder.coinsEarned}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


