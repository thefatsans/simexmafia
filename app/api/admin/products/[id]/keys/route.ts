import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import {
  addProductKeys,
  deleteAvailableProductKeys,
  getKeyInventoryStats,
  listProductKeys,
  type ProductKeyStatus,
} from '@/lib/product-keys/stock'
import { ensureProductStockKeyTable } from '@/lib/product-keys/ensure-table'
import { invalidateStorefrontCache } from '@/lib/products/storefront-cache'

function parseCodesFromBody(body: {
  keys?: string
  codes?: string[]
}): string[] {
  if (Array.isArray(body.codes)) {
    return body.codes
  }
  if (typeof body.keys === 'string') {
    return body.keys.split(/\r?\n/)
  }
  return []
}

function parseKeyStatus(value: string | null): ProductKeyStatus {
  if (value === 'available' || value === 'used') return value
  return 'all'
}

async function ensureProductExists(productId: string) {
  if (!prisma) return null
  return prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  const product = await ensureProductExists(params.id)
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  await ensureProductStockKeyTable()
  const stats = await getKeyInventoryStats(params.id)

  const searchParams = request.nextUrl.searchParams
  if (searchParams.get('list') !== '1') {
    return NextResponse.json({
      available: stats.available,
      used: stats.used,
      total: stats.total,
    })
  }

  const status = parseKeyStatus(searchParams.get('status'))
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const { keys, total } = await listProductKeys(params.id, { status, page, limit })

  return NextResponse.json({
    stats: {
      available: stats.available,
      used: stats.used,
      total: stats.total,
    },
    keys,
    pagination: {
      page: Math.max(page, 1),
      limit: Math.min(Math.max(limit, 1), 100),
      total,
    },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  const product = await ensureProductExists(params.id)
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const codes = parseCodesFromBody(body)

    if (codes.length === 0) {
      return NextResponse.json({ error: 'No keys provided' }, { status: 400 })
    }

    await ensureProductStockKeyTable()
    const result = await addProductKeys(params.id, codes)
    const stats = await getKeyInventoryStats(params.id)
    invalidateStorefrontCache(params.id)

    return NextResponse.json({
      added: result.added,
      skipped: result.skipped,
      stats,
      available: stats.available,
      used: stats.used,
      total: stats.total,
    })
  } catch (error) {
    console.error('[admin/products/keys] POST failed:', error)
    const code = (error as { code?: string })?.code
    const message = error instanceof Error ? error.message : 'Failed to add keys'
    const hint =
      code === 'P2021' || message.includes('ProductStockKey')
        ? 'Datenbank-Tabelle ProductStockKey fehlt. Bitte Migration ausführen: npx prisma migrate deploy'
        : undefined
    return NextResponse.json(
      { error: hint || message, details: message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  const product = await ensureProductExists(params.id)
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const keyIds = Array.isArray(body.keyIds) ? (body.keyIds as string[]) : []

    if (keyIds.length === 0) {
      return NextResponse.json({ error: 'No keyIds provided' }, { status: 400 })
    }

    await ensureProductStockKeyTable()
    const { deleted, skipped } = await deleteAvailableProductKeys(params.id, keyIds)
    const stats = await getKeyInventoryStats(params.id)
    invalidateStorefrontCache(params.id)

    return NextResponse.json({ deleted, skipped, stats })
  } catch (error) {
    console.error('[admin/products/keys] DELETE failed:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete keys'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
