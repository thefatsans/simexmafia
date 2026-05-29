import { Product } from '@/types'
import { generateId } from '@/prisma/product-data'
import { getProductImage } from '@/prisma/image-helper'
import { SIMEXMAFIA_SELLER } from '@/lib/sellers'
import { mockProducts, PSN_10_DE_PRODUCT_ID, ROBLOX_800_PRODUCT_ID } from '@/data/products'
import { filterStorefrontCatalog } from '@/lib/products/storefront-catalog'

export const SIMEX_DISCORD_SERVER_ID = generateId(
  'Simex Geheimer Discord-Server',
  'subscriptions',
  'Discord'
)

export const STOREFRONT_PRODUCT_IDS: readonly string[] = [
  PSN_10_DE_PRODUCT_ID,
  ROBLOX_800_PRODUCT_ID,
  SIMEX_DISCORD_SERVER_ID,
]

export function createSimexDiscordServerProduct(): Product {
  return {
    id: SIMEX_DISCORD_SERVER_ID,
    name: 'Simex Geheimer Discord-Server',
    description:
      'Exklusiver Zugang zum geheimen Simex Discord-Server mit vielen exklusiven Inhalten, Leaks, Methoden und Insider-Informationen bezüglich der Website und verschiedenen Strategien. Dieser Server enthält sehr vertrauliche Informationen und ist nur für ausgewählte Mitglieder verfügbar.',
    price: 299.99,
    originalPrice: 499.99,
    discount: 40,
    image: getProductImage('subscriptions', 'Discord', 'Simex Geheimer Discord-Server'),
    category: 'subscriptions',
    platform: 'Discord',
    seller: SIMEXMAFIA_SELLER,
    rating: 5.0,
    reviewCount: 47,
    inStock: true,
    tags: ['exclusive', 'discord', 'vip', 'leaks', 'methods', 'simex', 'premium'],
  }
}

/** Kleiner Katalog für API-Fallbacks — ohne generateProducts() (200+ Einträge). */
export function getStorefrontFallbackCatalog(): Product[] {
  const discord = createSimexDiscordServerProduct()
  const hasDiscord = mockProducts.some((p) => {
    const n = p.name.toLowerCase()
    return n.includes('simex') && n.includes('discord')
  })
  const base = hasDiscord ? mockProducts : [...mockProducts, discord]
  return filterStorefrontCatalog(base)
}
