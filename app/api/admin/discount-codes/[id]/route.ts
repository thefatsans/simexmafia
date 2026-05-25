import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'

function serializeCode(c: {
  id: string
  code: string
  type: string
  value: number
  description: string | null
  minAmount: number | null
  maxDiscount: number | null
  validFrom: Date
  validUntil: Date | null
  usageLimit: number | null
  usageCount: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: c.id,
    code: c.code,
    type: c.type as 'percentage' | 'fixed',
    value: c.value,
    description: c.description,
    minAmount: c.minAmount,
    minPurchase: c.minAmount,
    maxDiscount: c.maxDiscount,
    validFrom: c.validFrom.toISOString(),
    validUntil: c.validUntil ? c.validUntil.toISOString() : null,
    usageLimit: c.usageLimit,
    usageCount: c.usageCount,
    usedCount: c.usageCount,
    active: c.active,
    isActive: c.active,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    const data: Record<string, unknown> = {}

    if (typeof body.code === 'string') {
      const code = body.code.trim().toUpperCase()
      if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
        return NextResponse.json({ error: 'Ungültiger Code.' }, { status: 400 })
      }
      data.code = code
    }
    if (body.type === 'percentage' || body.type === 'fixed') data.type = body.type
    if (body.value != null) {
      const v = Number(body.value)
      if (!Number.isFinite(v) || v <= 0) {
        return NextResponse.json({ error: 'Wert muss > 0 sein.' }, { status: 400 })
      }
      data.value = v
    }
    if ('description' in body) data.description = body.description?.toString() || null
    if ('minAmount' in body) data.minAmount = body.minAmount != null ? Number(body.minAmount) : null
    if ('minPurchase' in body && !('minAmount' in body)) {
      data.minAmount = body.minPurchase != null ? Number(body.minPurchase) : null
    }
    if ('maxDiscount' in body) data.maxDiscount = body.maxDiscount != null ? Number(body.maxDiscount) : null
    if ('validFrom' in body && body.validFrom) data.validFrom = new Date(body.validFrom)
    if ('validUntil' in body) data.validUntil = body.validUntil ? new Date(body.validUntil) : null
    if ('usageLimit' in body) data.usageLimit = body.usageLimit != null ? Number(body.usageLimit) : null
    if (typeof body.active === 'boolean') data.active = body.active
    if (typeof body.isActive === 'boolean' && !('active' in body)) data.active = body.isActive

    const updated = await prisma.discountCode.update({
      where: { id },
      data,
    })

    return NextResponse.json({ code: serializeCode(updated) })
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ error: 'Code existiert bereits.' }, { status: 409 })
    }
    if ((error as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'Code nicht gefunden.' }, { status: 404 })
    }
    console.error('[Admin DiscountCodes PATCH]', error)
    return NextResponse.json({ error: 'Update fehlgeschlagen' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const { id } = await params
    await prisma.discountCode.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'Code nicht gefunden.' }, { status: 404 })
    }
    console.error('[Admin DiscountCodes DELETE]', error)
    return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })
  }
}
