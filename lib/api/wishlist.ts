import { Product } from '@/types'

interface WishlistItem {
  id: string
  product: Product
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

/**
 * Ruft Wunschliste von der API ab
 * Fallback: Verwendet localStorage wenn API nicht verfügbar
 */
export async function getWishlistFromAPI(userId: string): Promise<WishlistItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wishlist?userId=${userId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch wishlist')
    }

    const data = await response.json()
    
    return data.map((item: any) => ({
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        price: item.product.price,
        originalPrice: item.product.originalPrice,
        discount: item.product.discount,
        image: item.product.image,
        category: item.product.category,
        platform: item.product.platform,
        seller: item.product.seller,
        rating: item.product.rating || 0,
        reviewCount: item.product.reviewCount || 0,
        inStock: item.product.inStock,
        tags: item.product.tags || [],
      },
    }))
  } catch (error) {
    console.warn('API not available, using localStorage fallback:', error)
    // Fallback zu localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('simexmafia-wishlist')
      if (stored) {
        try {
          const productIds = JSON.parse(stored)
          const { getProducts } = await import('@/data/products')
          const products = getProducts()
          return productIds.map((id: string) => {
            const product = products.find(p => p.id === id)
            return product ? { id, product } : null
          }).filter(Boolean) as WishlistItem[]
        } catch (e) {
          return []
        }
      }
    }
    return []
  }
}

/**
 * Fügt Artikel zur Wunschliste hinzu (API)
 */
export async function addToWishlistAPI(userId: string, product: Product): Promise<WishlistItem> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        productId: product.id,
      }),
    })

    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('Item already in wishlist')
      }
      throw new Error('Failed to add to wishlist')
    }

    const data = await response.json()
    
    return {
      id: data.id,
      product: {
        id: data.product.id,
        name: data.product.name,
        description: data.product.description,
        price: data.product.price,
        originalPrice: data.product.originalPrice,
        discount: data.product.discount,
        image: data.product.image,
        category: data.product.category,
        platform: data.product.platform,
        seller: data.product.seller,
        rating: data.product.rating || 0,
        reviewCount: data.product.reviewCount || 0,
        inStock: data.product.inStock,
        tags: data.product.tags || [],
      },
    }
  } catch (error) {
    console.warn('API not available:', error)
    throw error
  }
}

/**
 * Entfernt Artikel aus Wunschliste (API)
 */
export async function removeFromWishlistAPI(userId: string, productId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wishlist?userId=${userId}&productId=${productId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to remove from wishlist')
    }
  } catch (error) {
    console.warn('API not available:', error)
    throw error
  }
}












