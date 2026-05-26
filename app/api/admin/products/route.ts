import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { getKeyInventoryStatsForProducts } from '@/lib/product-keys/stock'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        NOT: { name: { startsWith: '[ARCHIV]' } },
      },
      include: { seller: true },
      orderBy: { createdAt: 'desc' },
    })

    const statsMap = await getKeyInventoryStatsForProducts(products.map((p) => p.id))

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
        inStock: hasKeyPool ? (stats!.available > 0) : product.inStock,
      }
    })

    return NextResponse.json(payload)
  } catch (error) {
    console.error('[admin/products] GET failed:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
