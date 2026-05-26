import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import {
  addProductKeys,
  getKeyInventoryStats,
} from '@/lib/product-keys/stock'

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

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { id: true },
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const stats = await getKeyInventoryStats(params.id)
  return NextResponse.json({
    available: stats.available,
    used: stats.used,
    total: stats.total,
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

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { id: true },
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const codes = parseCodesFromBody(body)

    if (codes.length === 0) {
      return NextResponse.json({ error: 'No keys provided' }, { status: 400 })
    }

    const result = await addProductKeys(params.id, codes)
    const stats = await getKeyInventoryStats(params.id)

    return NextResponse.json({
      added: result.added,
      skipped: result.skipped,
      available: stats.available,
      used: stats.used,
      total: stats.total,
    })
  } catch (error) {
    console.error('[admin/products/keys] POST failed:', error)
    return NextResponse.json({ error: 'Failed to add keys' }, { status: 500 })
  }
}
