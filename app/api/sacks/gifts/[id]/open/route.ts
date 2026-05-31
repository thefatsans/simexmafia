import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSecureSession } from '@/lib/api-auth'
import { openSack, sackTypes } from '@/data/sacks'
import { assertSackOpenAllowed } from '@/lib/sack-limits'
import { applySackRewardToUser } from '@/lib/sacks/apply-sack-reward'
import { serializeSackReward } from '@/lib/sacks/serialize-reward'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireSecureSession(request)
    if (!authResult || authResult.error) {
      return authResult?.error || NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 503 })
    }

    const { id } = await params
    const userId = authResult.user.id

    const gift = await prisma.sackGift.findUnique({ where: { id } })
    if (!gift || gift.recipientId !== userId) {
      return NextResponse.json({ success: false, error: 'Geschenk nicht gefunden' }, { status: 404 })
    }

    if (gift.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Dieses Geschenk wurde bereits geöffnet' }, { status: 400 })
    }

    const recipient = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, emailVerified: true },
    })

    if (!recipient) {
      return NextResponse.json({ success: false, error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    if (!recipient.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bitte bestätige deine E-Mail-Adresse, bevor du Geschenk-Säcke öffnest.',
          code: 'EMAIL_NOT_VERIFIED',
        },
        { status: 403 }
      )
    }

    if (gift.purchaseMethod === 'coins') {
      const sackLimit = await assertSackOpenAllowed(recipient.id)
      if (!sackLimit.allowed) {
        return NextResponse.json(
          { success: false, error: sackLimit.error || 'Sack-Limit erreicht' },
          { status: 403 }
        )
      }
    }

    const sack = sackTypes.find((s) => s.type === gift.sackType)
    if (!sack) {
      return NextResponse.json({ success: false, error: 'Ungültiger Sack-Typ' }, { status: 400 })
    }

    const claim = await prisma.sackGift.updateMany({
      where: { id, recipientId: userId, status: 'pending' },
      data: { status: 'opened', openedAt: new Date() },
    })

    if (claim.count === 0) {
      return NextResponse.json({ success: false, error: 'Dieses Geschenk wurde bereits geöffnet' }, { status: 400 })
    }

    const reward = openSack(sack)
    const newBalance = await applySackRewardToUser(
      recipient.id,
      {
        type: sack.type,
        name: sack.name,
        icon: sack.icon,
        color: sack.color,
      },
      reward,
      gift.purchaseMethod as 'coins' | 'money',
      gift.pricePaid
    )

    return NextResponse.json({
      success: true,
      reward: serializeSackReward(reward),
      sackType: sack.type,
      newBalance,
      senderGift: true,
    })
  } catch (error) {
    console.error('[Sacks Gift Open POST]', error)
    return NextResponse.json({ success: false, error: 'Geschenk konnte nicht geöffnet werden' }, { status: 500 })
  }
}
