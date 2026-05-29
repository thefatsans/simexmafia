import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { enrichProductsWithStock } from '@/lib/product-keys/stock'
import {
  applySimexMafiaSellerToDiscordProducts,
  ensureSimexDiscordServerInCatalog,
} from '@/lib/products/simex-discord-server'
import { filterStorefrontCatalog } from '@/lib/products/storefront-catalog'
import { getStorefrontFallbackCatalog } from '@/lib/products/storefront-seeds'
import {
  getCachedStorefrontProduct,
  getCachedStorefrontProducts,
  setCachedStorefrontProduct,
  setCachedStorefrontProducts,
} from '@/lib/products/storefront-cache'
import {
  PSN_10_DE_PRODUCT_ID,
  ROBLOX_800_PRODUCT_ID,
  SIMEX_DISCORD_SERVER_ID,
  STOREFRONT_PRODUCT_IDS,
} from '@/lib/products/storefront-ids'

function normalizeDbProduct(product: Record<string, unknown>) {
  return {
    ...product,
    originalPrice: product.originalPrice ?? undefined,
  }
}

async function queryStorefrontProductsFromDatabase() {
  if (!process.env.DATABASE_URL || !prisma) {
    return getStorefrontFallbackCatalog()
  }

  const products = await prisma.product.findMany({
    where: {
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
    include: { seller: true },
    orderBy: { createdAt: 'desc' },
  })

  let list = filterStorefrontCatalog(
    products.map((p) => normalizeDbProduct(p as Record<string, unknown>)) as any
  )
  list = await ensureSimexDiscordServerInCatalog(list as any)
  list = applySimexMafiaSellerToDiscordProducts(list as any)
  return enrichProductsWithStock(list as any)
}

const getCachedStorefrontDbProducts = unstable_cache(
  queryStorefrontProductsFromDatabase,
  ['storefront-catalog-v2'],
  { revalidate: 60 }
)

export async function fetchStorefrontProductsFromDatabase() {
  const cached = getCachedStorefrontProducts<ReturnType<typeof getStorefrontFallbackCatalog>>()
  if (cached) {
    return cached
  }

  try {
    return setCachedStorefrontProducts(await getCachedStorefrontDbProducts())
  } catch (error) {
    console.warn('[Storefront] DB fetch failed, using seed catalog:', error)
    return getStorefrontFallbackCatalog()
  }
}

export async function fetchStorefrontProductByIdFromDatabase(id: string) {
  const decodedId = decodeURIComponent(id).trim()
  if (!decodedId) return null

  const catalogCached = getCachedStorefrontProducts<Array<{ id: string }>>()
  if (catalogCached) {
    const fromCatalog = catalogCached.find((p) => p.id === decodedId)
    if (fromCatalog) {
      return fromCatalog
    }
  }

  const cached = getCachedStorefrontProduct<ReturnType<typeof getStorefrontFallbackCatalog>[number]>(decodedId)
  if (cached) {
    return cached
  }

  if (!process.env.DATABASE_URL || !prisma) {
    const { resolveProductFromCatalog } = await import('@/lib/products/resolve-product')
    return resolveProductFromCatalog(getStorefrontFallbackCatalog() as Parameters<typeof resolveProductFromCatalog>[0], decodedId)
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: decodedId },
      include: { seller: true },
    })

    if (product) {
      const normalized = normalizeDbProduct(product as Record<string, unknown>)
      const [withStock] = await enrichProductsWithStock([normalized as any])
      return setCachedStorefrontProduct(decodedId, withStock)
    }

    if (
      decodedId === PSN_10_DE_PRODUCT_ID ||
      decodedId === ROBLOX_800_PRODUCT_ID ||
      decodedId === SIMEX_DISCORD_SERVER_ID
    ) {
      return null
    }
  } catch (error) {
    console.warn('[Storefront] Product by id DB error:', error)
  }

  const { resolveProductFromCatalog } = await import('@/lib/products/resolve-product')
  return resolveProductFromCatalog(getStorefrontFallbackCatalog() as Parameters<typeof resolveProductFromCatalog>[0], decodedId)
}
