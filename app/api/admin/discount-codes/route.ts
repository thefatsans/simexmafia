import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'

interface DiscountCodeBody {
  code?: string
  type?: 'percentage' | 'fixed'
  value?: number
  description?: string | null
  minAmount?: number | null
  maxDiscount?: number | null
  validFrom?: string | null
  validUntil?: string | null
  usageLimit?: number | null
  active?: boolean
}

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
    minPurchase: c.minAmount, // legacy alias
    maxDiscount: c.maxDiscount,
    validFrom: c.validFrom.toISOString(),
    validUntil: c.validUntil ? c.validUntil.toISOString() : null,
    usageLimit: c.usageLimit,
    usageCount: c.usageCount,
    usedCount: c.usageCount, // legacy alias
    active: c.active,
    isActive: c.active, // legacy alias
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
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
    const q = request.nextUrl.searchParams.get('q')?.trim() || ''

    const where = q
      ? {
          OR: [
            { code: { contains: q, mode: 'insensitive' as const } },
            { description: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const codes = await prisma.discountCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      {
        codes: codes.map(serializeCode),
        total: codes.length,
      },
      { headers: { 'Cache-Control': 'private, max-age=15' } }
    )
  } catch (error) {
    console.error('[Admin DiscountCodes GET]', error)
    return NextResponse.json({ error: 'Failed to fetch discount codes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const body = (await request.json()) as DiscountCodeBody
    const code = body.code?.trim().toUpperCase()
    const type = body.type
    const value = typeof body.value === 'number' ? body.value : Number(body.value)

    if (!code || !/^[A-Z0-9_-]{3,32}$/.test(code)) {
      return NextResponse.json(
        { error: 'Code muss 3–32 Zeichen lang sein (A–Z, 0–9, _ -).' },
        { status: 400 }
      )
    }

    if (type !== 'percentage' && type !== 'fixed') {
      return NextResponse.json({ error: 'Typ muss percentage oder fixed sein.' }, { status: 400 })
    }

    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ error: 'Wert muss > 0 sein.' }, { status: 400 })
    }

    if (type === 'percentage' && value > 100) {
      return NextResponse.json({ error: 'Prozent darf maximal 100 sein.' }, { status: 400 })
    }

    const validFrom = body.validFrom ? new Date(body.validFrom) : new Date()
    const validUntil = body.validUntil ? new Date(body.validUntil) : null

    if (validUntil && validUntil.getTime() < validFrom.getTime()) {
      return NextResponse.json({ error: 'validUntil muss nach validFrom liegen.' }, { status: 400 })
    }

    const created = await prisma.discountCode.create({
      data: {
        code,
        type,
        value,
        description: body.description?.toString() || null,
        minAmount: body.minAmount != null ? Number(body.minAmount) : null,
        maxDiscount: body.maxDiscount != null ? Number(body.maxDiscount) : null,
        validFrom,
        validUntil,
        usageLimit: body.usageLimit != null ? Number(body.usageLimit) : null,
        active: body.active ?? true,
      },
    })

    return NextResponse.json({ code: serializeCode(created) }, { status: 201 })
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Dieser Code existiert bereits.' },
        { status: 409 }
      )
    }
    console.error('[Admin DiscountCodes POST]', error)
    return NextResponse.json({ error: 'Code konnte nicht angelegt werden' }, { status: 500 })
  }
}
