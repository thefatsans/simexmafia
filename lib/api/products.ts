import { Product } from '@/types'
import { resolveSeller } from '@/lib/sellers'
import { applySimexMafiaSellerToDiscordProducts } from '@/lib/products/simex-discord-server'
import {
  filterStorefrontCatalog,
  isProductAllowedInStorefront,
} from '@/lib/products/storefront-catalog'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''
const CLIENT_PRODUCTS_CACHE_MS = 30_000

let productsListCache: { key: string; data: Product[]; ts: number } | null = null

function productsCacheKey(filters?: Record<string, unknown>): string {
  return JSON.stringify(filters ?? {})
}

function mapApiProduct(p: Record<string, unknown>): Product {
  const seller = p.seller as Record<string, unknown> | undefined
  return {
    id: p.id as string,
    name: p.name as string,
    description: p.description as string,
    price: p.price as number,
    originalPrice: p.originalPrice as number | undefined,
    discount: p.discount as number | undefined,
    image: p.image as string,
    category: p.category as Product['category'],
    platform: p.platform as Product['platform'],
    seller: seller
      ? {
          id: seller.id as string,
          name: seller.name as string,
          rating: seller.rating as number,
          reviewCount: seller.reviewCount as number,
          verified: seller.verified as boolean,
          avatar: seller.avatar as string | undefined,
        }
      : resolveSeller(p.sellerId as string),
    rating: (p.rating as number) || 0,
    reviewCount: (p.reviewCount as number) || 0,
    inStock: (p.inStock as boolean) ?? true,
    stockCount: p.stockCount as number | undefined,
    tags: (p.tags as string[]) || [],
  }
}

/**
 * Ruft alle Produkte von der API ab
 * Fallback: Verwendet Mock-Daten wenn API nicht verfügbar
 */
export async function getProductsFromAPI(filters?: {
  category?: string
  platform?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  inStock?: boolean
}): Promise<Product[]> {
  const cacheKey = productsCacheKey(filters)
  if (
    productsListCache &&
    productsListCache.key === cacheKey &&
    Date.now() - productsListCache.ts < CLIENT_PRODUCTS_CACHE_MS
  ) {
    return productsListCache.data
  }

  try {
    const params = new URLSearchParams()
    if (filters?.category) params.append('category', filters.category)
    if (filters?.platform) params.append('platform', filters.platform)
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString())
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
    if (filters?.search) params.append('search', filters.search)
    if (filters?.inStock) params.append('inStock', 'true')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`${API_BASE_URL}/api/products?${params.toString()}`, {
      signal: controller.signal,
      next: { revalidate: 60 },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      throw new Error('Invalid products response')
    }

    const products = data.map((p) => mapApiProduct(p))
    productsListCache = { key: cacheKey, data: products, ts: Date.now() }
    return products
  } catch (error) {
    console.warn('API not available, using fallback:', error)
    const { getStorefrontFallbackCatalog } = await import('@/lib/products/storefront-seeds')
    const { applyProductQueryFilters } = await import('@/lib/products/query')
    const { finalizeProductsForStorefront } = await import('@/lib/promotions/finalize-products')
    let products = getStorefrontFallbackCatalog()
    const filterPayload = {
      category: filters?.category ?? null,
      platform: filters?.platform ?? null,
      minPrice: filters?.minPrice ?? null,
      maxPrice: filters?.maxPrice ?? null,
      inStock: filters?.inStock,
      search: filters?.search ?? null,
    }
    if (filters) {
      if (filters.search?.trim()) {
        const { searchProducts } = await import('@/lib/search-utils')
        products = searchProducts(products, filters.search.trim(), {
          minScore: 45,
          maxResults: 500,
        })
        products = applyProductQueryFilters(products, {
          ...filterPayload,
          search: null,
        })
      } else {
        products = applyProductQueryFilters(products, filterPayload)
      }
    }
    const result = finalizeProductsForStorefront(
      filterStorefrontCatalog(applySimexMafiaSellerToDiscordProducts(products))
    )
    productsListCache = { key: cacheKey, data: result, ts: Date.now() }
    return result
  }
}

/**
 * Ruft ein einzelnes Produkt von der API ab
 */
async function getProductFromStorefrontFallback(id: string): Promise<Product | null> {
  const { getStorefrontFallbackCatalog } = await import('@/lib/products/storefront-seeds')
  const { resolveProductFromCatalog } = await import('@/lib/products/resolve-product')
  const found = resolveProductFromCatalog(getStorefrontFallbackCatalog(), id)
  if (!found) return null

  const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
  const product = mapApiProduct(found as unknown as Record<string, unknown>)
  product.image = getCompleteProductImage(product.name) || product.image
  const [withSeller] = applySimexMafiaSellerToDiscordProducts([product])
  return isProductAllowedInStorefront(withSeller) ? withSeller : null
}

export async function getProductFromAPI(id: string): Promise<Product | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(id)}`, {
      signal: controller.signal,
      next: { revalidate: 60 },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 404) {
        const isNumericId = /^\d+$/.test(id)
        const local = await getProductFromStorefrontFallback(id)
        if (local) return local
        if (!isNumericId) {
          return await searchProductByName(id)
        }
        return null
      }
      throw new Error('Failed to fetch product')
    }

    const p = await response.json()

    if (p.error) {
      const local = await getProductFromStorefrontFallback(id)
      if (local) return local
      const isNumericId = /^\d+$/.test(id)
      if (!isNumericId) {
        return await searchProductByName(id)
      }
      return null
    }

    const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
    const product = mapApiProduct(p)
    product.image = getCompleteProductImage(product.name) || product.image

    const [withSeller] = applySimexMafiaSellerToDiscordProducts([product])
    if (!isProductAllowedInStorefront(withSeller)) {
      return null
    }
    return withSeller
  } catch (error) {
    console.warn('API not available, using fallback:', error)
    const local = await getProductFromStorefrontFallback(id)
    if (local) return local

    try {
      const { getProducts } = await import('@/data/products')
      const products = getProducts()
      // Suche nach exakter ID-Übereinstimmung (beide als String vergleichen)
      let foundProduct = products.find(p => String(p.id) === String(id))
      
      // Wenn nicht gefunden UND es keine numerische ID ist, versuche nach Name zu suchen
      if (!foundProduct) {
        const isNumericId = /^\d+$/.test(id)
        if (!isNumericId) {
          const idLower = id.toLowerCase().trim()
          foundProduct = products.find(p => {
            const nameLower = (p.name || '').toLowerCase().trim()
            return nameLower === idLower || 
                   nameLower.includes(idLower) || 
                   idLower.includes(nameLower)
          })
        }
      }
      
      if (foundProduct) {
        console.log(`[Client] Product with ID "${id}" found in mock data: ${foundProduct.name}`)
      }
      
      if (foundProduct && !isProductAllowedInStorefront(foundProduct)) {
        return null
      }
      return foundProduct || null
    } catch (mockError) {
      console.warn('Mock products fallback failed:', mockError)
      return null
    }
  }
}

/**
 * Sucht ein Produkt nach Name in allen verfügbaren Quellen
 */
export async function searchProductByName(searchTerm: string): Promise<Product | null> {
  try {
    const { searchProducts } = await import('@/lib/search-utils')
    const { pickBestSearchMatch } = await import('@/lib/products/resolve-product')

    const response = await fetch(`${API_BASE_URL}/api/products?search=${encodeURIComponent(searchTerm)}`)
    
    if (response.ok) {
      const products = await response.json()
      const ranked = searchProducts(
        (products || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          platform: p.platform,
          category: p.category,
          tags: p.tags || [],
        })),
        searchTerm,
        { minScore: 70, maxResults: 5 }
      )
      const bestId = ranked[0]?.id ?? pickBestSearchMatch(products || [], searchTerm, { minScore: 70 })?.id
      const p = bestId ? products.find((item: any) => item.id === bestId) : products[0]
      if (p) {
        // Verwende getCompleteProductImage für korrektes Bild
        const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
        const correctImage = getCompleteProductImage(p.name) || p.image
        
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          originalPrice: p.originalPrice,
          discount: p.discount,
          image: correctImage,
          category: p.category as Product['category'],
          platform: p.platform as Product['platform'],
          seller: p.seller
            ? {
                id: p.seller.id,
                name: p.seller.name,
                rating: p.seller.rating,
                reviewCount: p.seller.reviewCount,
                verified: p.seller.verified,
                avatar: p.seller.avatar,
              }
            : {
                id: 'seller1',
                name: 'SimexMafia Partner',
                rating: 4.7,
                reviewCount: 2000,
                verified: true,
              },
          rating: p.rating || 0,
          reviewCount: p.reviewCount || 0,
          inStock: p.inStock,
          tags: p.tags || [],
        }
      }
    }
  } catch (error) {
    console.warn('API search failed, using fallback:', error)
  }
  
  // Fallback: Suche in generierten Produkten
  try {
    const { generateProducts } = await import('@/prisma/product-data')
    const sellerIds = ['seller1', 'seller2', 'seller3', 'seller4']
    const generatedProducts = generateProducts(sellerIds)
    
    const { pickBestSearchMatch } = await import('@/lib/products/resolve-product')
    const foundProduct = pickBestSearchMatch(
      generatedProducts as any,
      searchTerm,
      { minScore: 72 }
    ) as (typeof generatedProducts)[number] | null

    if (foundProduct) {
      const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
      const correctImage = getCompleteProductImage(foundProduct.name) || foundProduct.image

      return {
        id: foundProduct.id,
        name: foundProduct.name,
        description: foundProduct.description,
        price: foundProduct.price,
        originalPrice: foundProduct.originalPrice,
        discount: foundProduct.discount,
        image: correctImage,
        category: foundProduct.category as Product['category'],
        platform: foundProduct.platform as Product['platform'],
        seller: resolveSeller(foundProduct.sellerId),
        rating: foundProduct.rating || 0,
        reviewCount: foundProduct.reviewCount || 0,
        inStock: foundProduct.inStock,
        tags: foundProduct.tags || [],
      }
    }
  } catch (genError) {
    console.warn('Generated products search failed:', genError)
  }
  
  // Letzter Fallback zu Mock-Daten
  try {
    const { getProducts } = await import('@/data/products')
    const products = getProducts()
    const searchLower = searchTerm.toLowerCase().trim()
    const foundProduct = products.find(p => {
      const nameLower = (p.name || '').toLowerCase().trim()
      return nameLower === searchLower ||
             nameLower.includes(searchLower) ||
             searchLower.includes(nameLower)
    })
    
    if (foundProduct) {
      // Verwende getCompleteProductImage für korrektes Bild
      const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
      const correctImage = getCompleteProductImage(foundProduct.name) || foundProduct.image
      
      return {
        ...foundProduct,
        image: correctImage,
      }
    }
    
    return null
  } catch (mockError) {
    console.warn('Mock products search failed:', mockError)
    return null
  }
}

/**
 * Erstellt ein neues Produkt über die API
 */
export async function createProductAPI(productData: {
  name: string
  description: string
  price: number
  originalPrice?: number
  discount?: number
  image: string
  category: string
  platform: string
  tags?: string[]
  sellerId: string
  inStock?: boolean
}): Promise<Product> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create product')
    }

    const p = await response.json()
    
    // Verwende getCompleteProductImage für korrektes Bild
    const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
    const correctImage = getCompleteProductImage(p.name) || p.image
    
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      discount: p.discount,
      image: correctImage,
      category: p.category as Product['category'],
      platform: p.platform as Product['platform'],
      seller: {
        id: p.seller.id,
        name: p.seller.name,
        rating: p.seller.rating,
        reviewCount: p.seller.reviewCount,
        verified: p.seller.verified,
        avatar: p.seller.avatar,
      },
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      inStock: p.inStock,
      tags: p.tags || [],
    }
  } catch (error: any) {
    console.error('Error creating product:', error)
    throw error
  }
}

/**
 * Aktualisiert ein Produkt über die API
 */
export async function updateProductAPI(
  productId: string,
  productData: {
    name?: string
    description?: string
    price?: number
    originalPrice?: number
    discount?: number
    image?: string
    category?: string
    platform?: string
    tags?: string[]
    inStock?: boolean
  }
): Promise<Product> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update product')
    }

    const p = await response.json()
    
    // Verwende getCompleteProductImage für korrektes Bild
    const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
    const correctImage = getCompleteProductImage(p.name) || p.image
    
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      discount: p.discount,
      image: correctImage,
      category: p.category as Product['category'],
      platform: p.platform as Product['platform'],
      seller: {
        id: p.seller.id,
        name: p.seller.name,
        rating: p.seller.rating,
        reviewCount: p.seller.reviewCount,
        verified: p.seller.verified,
        avatar: p.seller.avatar,
      },
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      inStock: p.inStock,
      tags: p.tags || [],
    }
  } catch (error: any) {
    console.error('Error updating product:', error)
    throw error
  }
}

/**
 * Löscht ein Produkt über die API
 */
export async function deleteProductAPI(productId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete product')
    }
  } catch (error: any) {
    console.error('Error deleting product:', error)
    throw error
  }
}


