import { Product } from '@/types'

interface CartItem {
  id: string
  product: Product
  quantity: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

/**
 * Ruft Warenkorb von der API ab
 * Fallback: Verwendet localStorage wenn API nicht verfügbar
 */
export async function getCartFromAPI(userId: string): Promise<CartItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart?userId=${userId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch cart')
    }

    const data = await response.json()
    
    // Konvertiere Datenbank-Format zu CartItem-Format
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
        seller: {
          id: item.product.seller.id,
          name: item.product.seller.name,
          rating: item.product.seller.rating,
          reviewCount: item.product.seller.reviewCount,
          verified: item.product.seller.verified,
          avatar: item.product.seller.avatar,
        },
        rating: item.product.rating || 0,
        reviewCount: item.product.reviewCount || 0,
        inStock: item.product.inStock,
        tags: item.product.tags || [],
      },
      quantity: item.quantity,
    }))
  } catch (error) {
    console.warn('API not available, using localStorage fallback:', error)
    // Fallback zu localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('simexmafia-cart')
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          return []
        }
      }
    }
    return []
  }
}

/**
 * Fügt Artikel zum Warenkorb hinzu (API)
 */
export async function addToCartAPI(userId: string, product: Product, quantity: number = 1): Promise<CartItem> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        productId: product.id,
        quantity,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to add to cart')
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
      quantity: data.quantity,
    }
  } catch (error) {
    console.warn('API not available, using localStorage fallback:', error)
    // Fallback: Wird von CartContext gehandhabt
    throw error
  }
}

/**
 * Aktualisiert Warenkorb-Artikel (API)
 */
export async function updateCartItemAPI(cartItemId: string, quantity: number): Promise<CartItem> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/${cartItemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity }),
    })

    if (!response.ok) {
      throw new Error('Failed to update cart item')
    }

    const data = await response.json()
    
    return {
      id: data.id,
      product: data.product,
      quantity: data.quantity,
    }
  } catch (error) {
    console.warn('API not available:', error)
    throw error
  }
}

/**
 * Entfernt Artikel aus Warenkorb (API)
 */
export async function removeFromCartAPI(cartItemId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/${cartItemId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to remove from cart')
    }
  } catch (error) {
    console.warn('API not available:', error)
    throw error
  }
}

/**
 * Leert den Warenkorb (API)
 */
export async function clearCartAPI(userId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart?userId=${userId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to clear cart')
    }
  } catch (error) {
    console.warn('API not available:', error)
    throw error
  }
}





