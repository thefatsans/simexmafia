import { Product } from '@/types'
import { searchProducts } from '@/lib/search-utils'
import { isSimexDiscordServerProduct } from '@/lib/products/simex-discord-server'

type CatalogProduct = {
  id: string
  name: string
  description?: string
  platform?: string
  category?: string
  tags?: string[]
}

/** Bestes Produkt aus Katalog anhand ID oder Suchbegriff/Name */
export function resolveProductFromCatalog<T extends CatalogProduct>(
  catalog: T[],
  idOrQuery: string
): T | null {
  const raw = decodeURIComponent(idOrQuery).trim()
  if (!raw) return null

  const byId = catalog.find((p) => String(p.id) === String(raw))
  if (byId) return byId

  if (/^\d+$/.test(raw)) {
    return null
  }

  const ranked = searchProducts(catalog, raw, {
    minScore: 72,
    maxResults: 5,
  })

  if (ranked.length > 0) {
    return ranked[0] as T
  }

  const queryLower = raw.toLowerCase()
  if (queryLower.includes('simex') || (queryLower.includes('discord') && !queryLower.includes('nitro'))) {
    const discord = catalog.find(isSimexDiscordServerProduct)
    if (discord) return discord as T
  }

  return null
}

export function pickBestSearchMatch<T extends CatalogProduct & Record<string, unknown>>(
  catalog: T[],
  query: string,
  options?: { minScore?: number; maxResults?: number }
): T | null {
  const matches = searchProducts(catalog, query, {
    minScore: options?.minScore ?? 55,
    maxResults: options?.maxResults ?? 8,
  })
  return (matches[0] as T) ?? null
}
