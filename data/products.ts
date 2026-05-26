import { Product } from '@/types'
import {
  filterStorefrontCatalog,
  PSN_10_DE_PRODUCT_NAME,
  ROBLOX_800_PRODUCT_NAME,
} from '@/lib/products/storefront-catalog'

/** Stable id — must match prisma/catalog-storefront.ts (legacy generateId seed) */
export const PSN_10_DE_PRODUCT_ID = '771688015'
/** Stable id — must match prisma/catalog-storefront.ts */
export const ROBLOX_800_PRODUCT_ID = '1477038181'

export const mockProducts: Product[] = [
  {
    id: PSN_10_DE_PRODUCT_ID,
    name: PSN_10_DE_PRODUCT_NAME,
    description:
      'PlayStation Store Guthaben 10 € für deutsche PSN-Accounts (Region DE). Digitaler Code – Lieferung nach Zahlung. Nur auf einem deutschen PlayStation Network-Konto einlösbar.',
    price: 9.99,
    originalPrice: 10.0,
    discount: 1,
    image:
      'https://static.rapido.com/cms/sites/21/2020/08/04104235/Gift-cards-Dual-Branded.jpg',
    category: 'gift-cards',
    platform: 'PlayStation',
    seller: {
      id: 'seller3',
      name: 'GiftCard Masters',
      rating: 4.7,
      reviewCount: 8923,
      verified: true,
    },
    rating: 4.8,
    reviewCount: 0,
    inStock: true,
    tags: ['gift-card', 'playstation', 'instant', 'de', 'psn-10'],
  },
  {
    id: ROBLOX_800_PRODUCT_ID,
    name: ROBLOX_800_PRODUCT_NAME,
    description:
      '800 Robux für Roblox (Global). Digitaler Geschenkcode – Lieferung nach Zahlung. Einlösung auf roblox.com/redeem.',
    price: 9.99,
    originalPrice: 9.99,
    image: 'https://cdn.cdkeys.com/media/catalog/product/r/o/roblox_800_robux.jpg',
    category: 'in-game-currency',
    platform: 'Roblox',
    seller: {
      id: 'seller-simexmafia',
      name: 'SimexMafia',
      rating: 5.0,
      reviewCount: 847,
      verified: true,
    },
    rating: 4.7,
    reviewCount: 0,
    inStock: false,
    stockCount: 0,
    tags: ['roblox', 'robux', '800', 'global', 'instant'],
  },
]

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
