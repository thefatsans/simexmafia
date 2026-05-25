import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ValidateBody {
  code?: string
  subtotal?: number
  items?: Array<{ type?: string }>
}

export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json(
      { valid: false, error: 'Datenbank nicht verfügbar' },
      { status: 503 }
    )
  }

  try {
    const body = (await request.json()) as ValidateBody
    const codeInput = body.code?.trim().toUpperCase()
    const subtotal = typeof body.subtotal === 'number' ? body.subtotal : 0

    if (!codeInput) {
      return NextResponse.json(
        { valid: false, error: 'Bitte Rabattcode eingeben' },
        { status: 400 }
      )
    }

    const dbCode = await prisma.discountCode.findUnique({
      where: { code: codeInput },
    })

    if (!dbCode || !dbCode.active) {
      return NextResponse.json({ valid: false, error: 'Ungültiger Rabattcode' })
    }

    const now = new Date()
    if (now < dbCode.validFrom) {
      return NextResponse.json({ valid: false, error: 'Rabattcode ist noch nicht gültig' })
    }
    if (dbCode.validUntil && now > dbCode.validUntil) {
      return NextResponse.json({ valid: false, error: 'Rabattcode ist abgelaufen' })
    }

    if (dbCode.usageLimit && dbCode.usageCount >= dbCode.usageLimit) {
      return NextResponse.json({ valid: false, error: 'Rabattcode wurde bereits verwendet' })
    }

    if (dbCode.minAmount && subtotal < dbCode.minAmount) {
      return NextResponse.json({
        valid: false,
        error: `Mindestbestellwert von €${dbCode.minAmount.toFixed(2)} nicht erreicht`,
      })
    }

    let discount = 0
    if (dbCode.type === 'percentage') {
      discount = (subtotal * dbCode.value) / 100
      if (dbCode.maxDiscount) {
        discount = Math.min(discount, dbCode.maxDiscount)
      }
    } else {
      discount = Math.min(dbCode.value, subtotal)
    }

    discount = Math.round(discount * 100) / 100

    return NextResponse.json({
      valid: true,
      discount,
      discountCode: {
        id: dbCode.id,
        code: dbCode.code,
        type: dbCode.type as 'percentage' | 'fixed',
        value: dbCode.value,
        description: dbCode.description,
        minAmount: dbCode.minAmount,
        minPurchase: dbCode.minAmount,
        maxDiscount: dbCode.maxDiscount,
        validFrom: dbCode.validFrom.toISOString(),
        validUntil: dbCode.validUntil ? dbCode.validUntil.toISOString() : null,
        usageLimit: dbCode.usageLimit,
        usedCount: dbCode.usageCount,
        isActive: dbCode.active,
      },
    })
  } catch (error) {
    console.error('[DiscountCodes Validate]', error)
    return NextResponse.json(
      { valid: false, error: 'Validierung fehlgeschlagen' },
      { status: 500 }
    )
  }
}
