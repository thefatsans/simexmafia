import { Product } from '@/types'
import {
  filterStorefrontCatalog,
  PSN_10_DE_PRODUCT_NAME,
  ROBLOX_800_PRODUCT_NAME,
} from '@/lib/products/storefront-catalog'
import {
  PSN_10_DE_PRODUCT_ID,
  ROBLOX_800_PRODUCT_ID,
} from '@/lib/products/storefront-ids'
import { storefrontMockProducts } from '@/lib/products/storefront-seeds'

export { PSN_10_DE_PRODUCT_ID, ROBLOX_800_PRODUCT_ID }

export const mockProducts: Product[] = storefrontMockProducts

const STORAGE_KEY = 'simexmafia-admin-products'

// Get all products - from localStorage if available, otherwise from mockProducts
export const getProducts = (): Product[] => {
  if (typeof window === 'undefined') {
    return mockProducts
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const mockProductIds = new Set(mockProducts.map((p) => p.id))
        const storedProducts = parsed.filter((p: Product) => !mockProductIds.has(p.id))
        return filterStorefrontCatalog([...mockProducts, ...storedProducts])
      }
    }
  } catch (error) {
    console.error('Error loading products from localStorage:', error)
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockProducts))
  } catch (error) {
    console.error('Error saving mock products to localStorage:', error)
  }

  return mockProducts
}

export const getProductById = (id: string): Product | undefined => {
  const products = getProducts()
  return products.find((p) => p.id === id)
}

export const getProductsByCategory = (category: string): Product[] => {
  const products = getProducts()
  return products.filter((p) => p.category === category)
}

export const getProductsByPlatform = (platform: string): Product[] => {
  const products = getProducts()
  return products.filter((p) => p.platform === platform)
}

export const searchProducts = (query: string): Product[] => {
  const products = getProducts()
  const lowerQuery = query.toLowerCase()
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

// Re-export names for backwards compatibility
export { PSN_10_DE_PRODUCT_NAME, ROBLOX_800_PRODUCT_NAME }
