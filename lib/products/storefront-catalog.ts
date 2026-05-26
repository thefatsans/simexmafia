import { Product } from '@/types'
import { isSimexDiscordServerProduct } from '@/lib/products/simex-discord-server'

export const PSN_10_DE_PRODUCT_NAME = 'PlayStation Store Guthaben 10 € (DE)'
export const PSN_10_DE_LEGACY_NAME = 'PlayStation Store Gift Card €10'
export const ROBLOX_800_PRODUCT_NAME = 'Roblox 800 Robux (Global)'
export const ROBLOX_800_LEGACY_NAME = 'Roblox Robux 800'

export type StorefrontProductLike = Pick<Product, 'name' | 'category' | 'platform'>

function hasTenEuroDenomination(name: string): boolean {
  const lower = name.toLowerCase()
  if (/€\s*100|100\s*€|100\s*eur|\b100\s*(eur|€)/.test(lower)) {
    return false
  }
  if (/€\s*1\d{2,}|\b\d{2,}\s*€/.test(lower) && !/€\s*10\b|10\s*€/.test(lower)) {
    return false
  }
  return (
    /€\s*10\b/.test(lower) ||
    /\b10\s*€/.test(lower) ||
    /\b10\s*(eur|euro)\b/.test(lower) ||
    /\beur(?:o)?\s*10\b/.test(lower) ||
    /guthaben\s*10/.test(lower)
  )
}

export function isPsn10DeProduct(product: StorefrontProductLike): boolean {
  if (product.category !== 'gift-cards') return false
  if (product.platform !== 'PlayStation') return false
  return hasTenEuroDenomination(product.name)
}

export function isRoblox800Product(product: StorefrontProductLike): boolean {
  const lower = product.name.toLowerCase()
  const categoryOk =
    product.category === 'in-game-currency' || product.category === 'gift-cards'
  if (!categoryOk) return false
  const hasRoblox = lower.includes('roblox') || lower.includes('robux')
  const has800 =
    /\b800\b/.test(lower) ||
    lower.includes('800 robux') ||
    lower.includes('robux 800')
  return hasRoblox && has800
}

export function isStorefrontCatalogProduct(product: StorefrontProductLike): boolean {
  return (
    isSimexDiscordServerProduct(product) ||
    isPsn10DeProduct(product) ||
    isRoblox800Product(product)
  )
}

export function filterStorefrontCatalog<T extends StorefrontProductLike>(products: T[]): T[] {
  return products.filter((product): product is T => isStorefrontCatalogProduct(product))
}

export function isProductAllowedInStorefront(product: StorefrontProductLike): boolean {
  return isStorefrontCatalogProduct(product)
}
