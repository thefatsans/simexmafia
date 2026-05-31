import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { CASHOUT_VARIANTS } from '@/lib/goofycoins/cashout'
import {
  sendCashoutCompletedEmail,
  sendCashoutRejectedEmail,
} from '@/lib/email-server'

const VALID_ACTIONS = new Set(['complete', 'reject'])

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
    const action = String(body.action ?? '').trim()
    const adminNotes = String(body.adminNotes ?? '').trim() || null

    if (!VALID_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 })
    }

    const existing = await prisma.goofyCoinCashout.findUnique({
      where: { id },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Anfrage nicht gefunden' }, { status: 404 })
    }

    if (existing.status !== 'pending') {
      return NextResponse.json({ error: 'Anfrage wurde bereits bearbeitet' }, { status: 400 })
    }

    if (action === 'complete') {
      const updated = await prisma.goofyCoinCashout.update({
        where: { id },
        data: {
          status: 'completed',
          adminNotes,
          processedAt: new Date(),
        },
      })

      if (existing.user?.email) {
        const variantLabel =
          CASHOUT_VARIANTS[existing.variant as keyof typeof CASHOUT_VARIANTS]?.label ??
          existing.variant
        sendCashoutCompletedEmail({
          email: existing.user.email,
          firstName: existing.user.firstName || existing.fullName,
          euroAmount: existing.euroAmount,
          variantLabel,
        }).catch((err) => console.error('[Cashout complete] Email failed:', err))
      }

      return NextResponse.json({
        success: true,
        item: {
          id: updated.id,
          status: updated.status,
          processedAt: updated.processedAt?.toISOString() ?? null,
        },
      })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: existing.userId },
        data: { goofyCoins: { increment: existing.coinsAmount } },
        select: { goofyCoins: true },
      })

      await tx.coinTransaction.create({
        data: {
          userId: existing.userId,
          type: 'bonus',
          amount: existing.coinsAmount,
          balance: user.goofyCoins,
          description: `Rückerstattung: Umtausch abgelehnt (${existing.euroAmount.toFixed(2)}€)`,
        },
      })

      return tx.goofyCoinCashout.update({
        where: { id },
        data: {
          status: 'rejected',
          adminNotes,
          processedAt: new Date(),
        },
      })
    })

    if (existing.user?.email) {
      sendCashoutRejectedEmail({
        email: existing.user.email,
        firstName: existing.user.firstName || existing.fullName,
        euroAmount: existing.euroAmount,
        coinsAmount: existing.coinsAmount,
        adminNotes,
      }).catch((err) => console.error('[Cashout reject] Email failed:', err))
    }

    return NextResponse.json({
      success: true,
      item: {
        id: updated.id,
        status: updated.status,
        processedAt: updated.processedAt?.toISOString() ?? null,
      },
    })
  } catch (error) {
    console.error('[Admin GoofyCoin Cashout PATCH]', error)
    return NextResponse.json({ error: 'Aktion fehlgeschlagen' }, { status: 500 })
  }
}
