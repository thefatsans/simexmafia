import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { sendSackRedemptionFulfilledEmail } from '@/lib/email-server'

export async function PATCH(
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

  const itemId = params.id
  if (!itemId) {
    return NextResponse.json({ error: 'Item-ID fehlt' }, { status: 400 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const redemptionCode =
      typeof body.redemptionCode === 'string' ? body.redemptionCode.trim() : ''

    if (!redemptionCode) {
      return NextResponse.json({ error: 'Produkt-Key ist erforderlich' }, { status: 400 })
    }

    const existing = await prisma.inventoryItem.findFirst({
      where: { id: itemId, source: 'sack' },
      include: {
        product: true,
        user: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Einlöse-Anfrage nicht gefunden' }, { status: 404 })
    }

    if (existing.redemptionStatus === 'fulfilled' && existing.redemptionCode) {
      return NextResponse.json(
        { error: 'Diese Anfrage wurde bereits erfüllt' },
        { status: 409 }
      )
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        redemptionCode,
        redemptionStatus: 'fulfilled',
        isRedeemed: true,
        redeemedAt: existing.redeemedAt ?? new Date(),
      },
      include: {
        product: true,
        user: true,
      },
    })

    if (updated.user?.email) {
      const emailResult = await sendSackRedemptionFulfilledEmail(
        updated.user.email,
        updated.user.firstName,
        updated.product?.name ?? 'Produkt',
        redemptionCode
      )
      if (!emailResult.success) {
        console.error('[Admin Redemptions PATCH] Email failed:', emailResult.error)
        return NextResponse.json({
          item: updated,
          warning: 'Key gespeichert, aber E-Mail konnte nicht gesendet werden.',
          emailError: emailResult.error,
        })
      }
    }

    return NextResponse.json({
      success: true,
      item: {
        id: updated.id,
        redemptionCode: updated.redemptionCode,
        redemptionStatus: updated.redemptionStatus,
        redeemedAt: updated.redeemedAt?.toISOString() ?? null,
        productName: updated.product?.name,
        userEmail: updated.user?.email,
      },
    })
  } catch (error) {
    console.error('[Admin Redemptions PATCH]', error)
    return NextResponse.json(
      { error: 'Einlöse-Anfrage konnte nicht aktualisiert werden' },
      { status: 500 }
    )
  }
}
