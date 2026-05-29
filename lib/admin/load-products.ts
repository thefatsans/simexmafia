import { prisma } from '@/lib/prisma'
import { getKeyInventoryStatsForProducts } from '@/lib/product-keys/stock'
import { KEY_INVENTORY_PRODUCT_IDS } from '@/lib/products/key-inventory-catalog'
import { STOREFRONT_PRODUCT_IDS } from '@/lib/products/storefront-ids'

function storefrontProductWhere(includeAll: boolean) {
  const base = { NOT: { name: { startsWith: '[ARCHIV]' } } } as const

  if (includeAll) {
    return base
  }

  return {
    ...base,
    OR: [
      { id: { in: [...STOREFRONT_PRODUCT_IDS] } },
      {
        AND: [
          { name: { contains: 'simex', mode: 'insensitive' as const } },
          { name: { contains: 'discord', mode: 'insensitive' as const } },
        ],
      },
    ],
  }
}

export async function loadAdminProducts(includeAll = false) {
  if (!prisma) {
    return []
  }

  const products = await prisma.product.findMany({
    where: storefrontProductWhere(includeAll),
    include: { seller: true },
    orderBy: { createdAt: 'desc' },
  })

  const keyTrackedIds = products
    .map((product) => product.id)
    .filter((id) => KEY_INVENTORY_PRODUCT_IDS.has(id))

  const statsMap =
    keyTrackedIds.length > 0
      ? await getKeyInventoryStatsForProducts(keyTrackedIds)
      : new Map<string, { available: number; used: number; total: number }>()

  return products.map((product) => {
    const stats = statsMap.get(product.id)
    const hasKeyPool = stats && stats.total > 0
    const stockCount = hasKeyPool ? stats!.available : undefined

    return {
      ...product,
      originalPrice: product.originalPrice ?? undefined,
      stockCount,
      keysAvailable: stats?.available ?? 0,
      keysUsed: stats?.used ?? 0,
      keysTotal: stats?.total ?? 0,
      inStock: hasKeyPool ? stats!.available > 0 : product.inStock,
    }
  })
}
