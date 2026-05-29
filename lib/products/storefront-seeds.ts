import { Product } from '@/types'
import { SIMEXMAFIA_SELLER } from '@/lib/sellers'
import { filterStorefrontCatalog } from '@/lib/products/storefront-catalog'
import {
  PSN_10_DE_PRODUCT_ID,
  ROBLOX_800_PRODUCT_ID,
  SIMEX_DISCORD_SERVER_ID,
  STOREFRONT_PRODUCT_IDS,
} from '@/lib/products/storefront-ids'
import {
  PSN_10_DE_PRODUCT_NAME,
  ROBLOX_800_PRODUCT_NAME,
} from '@/lib/products/storefront-catalog'

export { STOREFRONT_PRODUCT_IDS, SIMEX_DISCORD_SERVER_ID }

const DISCORD_IMAGE =
  'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=600&fit=crop&q=80&auto=format'

export const storefrontMockProducts: Product[] = [
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
    seller: SIMEXMAFIA_SELLER,
    rating: 0,
    reviewCount: 0,
    inStock: false,
    stockCount: 0,
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
    seller: SIMEXMAFIA_SELLER,
    rating: 0,
    reviewCount: 0,
    inStock: false,
    stockCount: 0,
    tags: ['roblox', 'robux', '800', 'global', 'instant'],
  },
]

export function createSimexDiscordServerProduct(): Product {
  return {
    id: SIMEX_DISCORD_SERVER_ID,
    name: 'Simex Geheimer Discord-Server',
    description:
      'Exklusiver Zugang zum geheimen Simex Discord-Server mit vielen exklusiven Inhalten, Leaks, Methoden und Insider-Informationen bezüglich der Website und verschiedenen Strategien.',
    price: 299.99,
    originalPrice: 499.99,
    discount: 40,
    image: DISCORD_IMAGE,
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
  const hasDiscord = storefrontMockProducts.some((p) => {
    const n = p.name.toLowerCase()
    return n.includes('simex') && n.includes('discord')
  })
  const base = hasDiscord ? storefrontMockProducts : [...storefrontMockProducts, discord]
  return filterStorefrontCatalog(base)
}
