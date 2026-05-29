import { prisma } from '@/lib/prisma'
import { STOREFRONT_PRODUCT_IDS } from '@/lib/products/storefront-ids'

const COUNT_CACHE_MS = 60_000
let countCache: { sellerId: string; count: number; at: number } | null = null

/** Anzahl sichtbarer Storefront-Produkte eines Verkäufers (ohne archivierte DB-Einträge). */
export async function getStorefrontProductCountForSeller(sellerId: string): Promise<number> {
  if (countCache && countCache.sellerId === sellerId && Date.now() - countCache.at < COUNT_CACHE_MS) {
    return countCache.count
  }

  if (!prisma) {
    return STOREFRONT_PRODUCT_IDS.length
  }

  try {
    const count = await prisma.product.count({
      where: {
        sellerId,
        NOT: { name: { startsWith: '[ARCHIV]' } },
        OR: [
          { id: { in: [...STOREFRONT_PRODUCT_IDS] } },
          {
            AND: [
              { name: { contains: 'simex', mode: 'insensitive' } },
              { name: { contains: 'discord', mode: 'insensitive' } },
            ],
          },
        ],
      },
    })
    countCache = { sellerId, count, at: Date.now() }
    return count
  } catch (error) {
    console.warn('[Sellers] storefront product count failed:', error)
    return STOREFRONT_PRODUCT_IDS.length
  }
}
