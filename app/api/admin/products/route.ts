import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { getKeyInventoryStatsForProducts } from '@/lib/product-keys/stock'
import { STOREFRONT_PRODUCT_IDS } from '@/lib/products/storefront-ids'

const ADMIN_CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=15',
}

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

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const includeAll = request.nextUrl.searchParams.get('all') === '1'

    const products = await prisma.product.findMany({
      where: storefrontProductWhere(includeAll),
      include: { seller: true },
      orderBy: { createdAt: 'desc' },
    })

    const keyTrackedIds = products.map((product) => product.id)

    const statsMap =
      keyTrackedIds.length > 0
        ? await getKeyInventoryStatsForProducts(keyTrackedIds)
        : new Map<string, { available: number; used: number; total: number }>()

    const payload = products.map((product) => {
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

    return NextResponse.json(payload, { headers: ADMIN_CACHE_HEADERS })
  } catch (error) {
    console.error('[admin/products] GET failed:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
