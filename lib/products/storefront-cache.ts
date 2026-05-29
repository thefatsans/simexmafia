const STOREFRONT_CACHE_MS = 60_000

type CacheEntry<T> = { data: T; ts: number }

let productsCache: CacheEntry<unknown> | null = null
let productByIdCache = new Map<string, CacheEntry<unknown>>()

export function getCachedStorefrontProducts<T>(): T | null {
  if (!productsCache || Date.now() - productsCache.ts >= STOREFRONT_CACHE_MS) {
    return null
  }
  return productsCache.data as T
}

export function setCachedStorefrontProducts<T>(data: T): T {
  productsCache = { data, ts: Date.now() }
  return data
}

export function getCachedStorefrontProduct<T>(id: string): T | null {
  const entry = productByIdCache.get(id)
  if (!entry || Date.now() - entry.ts >= STOREFRONT_CACHE_MS) {
    return null
  }
  return entry.data as T
}

export function setCachedStorefrontProduct<T>(id: string, data: T): T {
  productByIdCache.set(id, { data, ts: Date.now() })
  return data
}

export function invalidateStorefrontCache(productId?: string): void {
  productsCache = null
  if (productId) {
    productByIdCache.delete(productId)
  } else {
    productByIdCache.clear()
  }
}
