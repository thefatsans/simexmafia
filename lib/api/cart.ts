import { Product } from '@/types'
import { getAuthQueryParams } from '@/lib/api/auth-payload'
import type { User } from '@/types/user'

interface CartItem {
  id: string
  product: Product
  quantity: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

type CartProfile = Pick<User, 'email' | 'firstName' | 'lastName'>

function mapCartItem(item: any): CartItem {
  return {
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
  }
}

function authQuery(userId: string, profile?: CartProfile) {
  return profile
    ? getAuthQueryParams({ id: userId, ...profile })
    : `userId=${encodeURIComponent(userId)}`
}

/**
 * Ruft Warenkorb von der API ab
 * Fallback: Verwendet localStorage wenn API nicht verfügbar
 */
export async function getCartFromAPI(
  userId: string,
  profile?: CartProfile
): Promise<CartItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart?${authQuery(userId, profile)}`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch cart')
    }

    const data = await response.json()
    return data.map(mapCartItem)
  } catch (error) {
    console.warn('API not available, using localStorage fallback:', error)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('simexmafia-cart')
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
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
export async function addToCartAPI(
  userId: string,
  product: Product,
  quantity: number = 1,
  profile?: CartProfile
): Promise<CartItem> {
  const response = await fetch(`${API_BASE_URL}/api/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      userId,
      productId: product.id,
      quantity,
      ...(profile
        ? {
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
          }
        : {}),
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to add to cart')
  }

  const data = await response.json()
  return mapCartItem(data)
}

/**
 * Aktualisiert Warenkorb-Artikel (API)
 */
export async function updateCartItemAPI(
  cartItemId: string,
  quantity: number,
  userId: string,
  profile?: CartProfile
): Promise<CartItem> {
  const query = authQuery(userId, profile)
  const response = await fetch(`${API_BASE_URL}/api/cart/${cartItemId}?${query}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      quantity,
      ...(profile
        ? {
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
          }
        : {}),
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to update cart item')
  }

  const data = await response.json()
  if (data.message) {
    throw new Error('Item removed from cart')
  }
  return mapCartItem(data)
}

/**
 * Entfernt Artikel aus Warenkorb (API)
 */
export async function removeFromCartAPI(
  cartItemId: string,
  userId: string,
  profile?: CartProfile
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/cart/${cartItemId}?${authQuery(userId, profile)}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  )

  if (!response.ok) {
    throw new Error('Failed to remove from cart')
  }
}

/**
 * Leert den Warenkorb (API)
 */
export async function clearCartAPI(userId: string, profile?: CartProfile): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/cart?${authQuery(userId, profile)}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to clear cart')
  }
}
