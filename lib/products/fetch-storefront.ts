import { prisma } from '@/lib/prisma'
import { enrichProductsWithStock } from '@/lib/product-keys/stock'
import { ensureStorefrontSellerReady } from '@/lib/sellers/ensure-simexmafia-seller'
import {
  applySimexMafiaSellerToDiscordProducts,
  ensureSimexDiscordServerInCatalog,
} from '@/lib/products/simex-discord-server'
import { filterStorefrontCatalog } from '@/lib/products/storefront-catalog'
import { getStorefrontFallbackCatalog } from '@/lib/products/storefront-seeds'
import {
  PSN_10_DE_PRODUCT_ID,
  ROBLOX_800_PRODUCT_ID,
  SIMEX_DISCORD_SERVER_ID,
  STOREFRONT_PRODUCT_IDS,
} from '@/lib/products/storefront-ids'

function normalizeDbProduct(product: Record<string, unknown>) {
  const reviews = product.reviews as Array<{ rating: number }> | undefined
  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : (product.rating as number)

  return {
    ...product,
    rating: avgRating,
    reviewCount: reviews?.length ?? (product.reviewCount as number),
    originalPrice: product.originalPrice ?? undefined,
    reviews: undefined,
  }
}

export async function fetchStorefrontProductsFromDatabase() {
  if (!process.env.DATABASE_URL || !prisma) {
    return getStorefrontFallbackCatalog()
  }

  try {
    await ensureStorefrontSellerReady()

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
      include: {
        seller: true,
        reviews: {
          select: { rating: true },
          take: 20,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    let list = filterStorefrontCatalog(
      products.map((p) => normalizeDbProduct(p as Record<string, unknown>)) as any
    )
    list = await ensureSimexDiscordServerInCatalog(list as any)
    list = applySimexMafiaSellerToDiscordProducts(list as any)
    return await enrichProductsWithStock(list as any)
  } catch (error) {
    console.warn('[Storefront] DB fetch failed, using seed catalog:', error)
    return getStorefrontFallbackCatalog()
  }
}

export async function fetchStorefrontProductByIdFromDatabase(id: string) {
  const decodedId = decodeURIComponent(id).trim()
  if (!decodedId) return null

  if (!process.env.DATABASE_URL || !prisma) {
    const { resolveProductFromCatalog } = await import('@/lib/products/resolve-product')
    return resolveProductFromCatalog(getStorefrontFallbackCatalog() as any, decodedId)
  }

  try {
    await ensureStorefrontSellerReady()

    const product = await prisma.product.findUnique({
      where: { id: decodedId },
      include: {
        seller: true,
        reviews: {
          select: { rating: true },
          take: 30,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (product) {
      return normalizeDbProduct(product as Record<string, unknown>)
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
  return resolveProductFromCatalog(getStorefrontFallbackCatalog() as any, decodedId)
}
