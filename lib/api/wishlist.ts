import { Product } from '@/types'
import { getAuthQueryParams } from '@/lib/api/auth-payload'
import type { User } from '@/types/user'

interface WishlistItem {
  id: string
  product: Product
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

type WishlistProfile = Pick<User, 'email' | 'firstName' | 'lastName'>

function mapWishlistItem(item: any): WishlistItem {
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
      seller: item.product.seller,
      rating: item.product.rating || 0,
      reviewCount: item.product.reviewCount || 0,
      inStock: item.product.inStock,
      tags: item.product.tags || [],
    },
  }
}

/**
 * Ruft Wunschliste von der API ab
 * Fallback: Verwendet localStorage wenn API nicht verfügbar
 */
export async function getWishlistFromAPI(
  userId: string,
  profile?: WishlistProfile
): Promise<WishlistItem[]> {
  try {
    const query = profile
      ? getAuthQueryParams({ id: userId, ...profile })
      : `userId=${encodeURIComponent(userId)}`
    const response = await fetch(`${API_BASE_URL}/api/wishlist?${query}`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch wishlist')
    }

    const data = await response.json()
    return data.map(mapWishlistItem)
  } catch (error) {
    console.warn('API not available, using localStorage fallback:', error)
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
        } catch {
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
export async function addToWishlistAPI(
  userId: string,
  product: Product,
  profile?: WishlistProfile
): Promise<WishlistItem> {
  const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      userId,
      productId: product.id,
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
    if (response.status === 409) {
      throw new Error('Item already in wishlist')
    }
    throw new Error('Failed to add to wishlist')
  }

  const data = await response.json()
  return mapWishlistItem(data)
}

/**
 * Entfernt Artikel aus Wunschliste (API)
 */
export async function removeFromWishlistAPI(
  userId: string,
  productId: string,
  profile?: WishlistProfile
): Promise<void> {
  const query = profile
    ? `${getAuthQueryParams({ id: userId, ...profile })}&productId=${encodeURIComponent(productId)}`
    : `userId=${encodeURIComponent(userId)}&productId=${encodeURIComponent(productId)}`
  const response = await fetch(`${API_BASE_URL}/api/wishlist?${query}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to remove from wishlist')
  }
}
