import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSecureSession } from '@/lib/api-auth'
import { sackTypes } from '@/data/sacks'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSecureSession(request)
    if (!authResult || authResult.error) {
      return authResult?.error || NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 503 })
    }

    const body = await request.json()
    const sackType = String(body.sackType ?? '').trim()
    const recipientEmail = String(body.recipientEmail ?? '').trim().toLowerCase()
    const message = String(body.message ?? '').trim() || null
    const purchaseMethod = body.purchaseMethod === 'money' ? 'money' : 'coins'

    if (purchaseMethod !== 'coins') {
      return NextResponse.json(
        { success: false, error: 'Geschenke sind derzeit nur mit GoofyCoins möglich' },
        { status: 400 }
      )
    }

    const sack = sackTypes.find((s) => s.type === sackType)
    if (!sack) {
      return NextResponse.json({ success: false, error: 'Ungültiger Sack-Typ' }, { status: 400 })
    }

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return NextResponse.json({ success: false, error: 'Bitte gib eine gültige E-Mail des Empfängers an' }, { status: 400 })
    }

    const sender = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      select: { id: true, email: true, goofyCoins: true, emailVerified: true, firstName: true },
    })

    if (!sender) {
      return NextResponse.json({ success: false, error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    if (!sender.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bitte bestätige deine E-Mail-Adresse, bevor du Säcke verschenkst.',
          code: 'EMAIL_NOT_VERIFIED',
        },
        { status: 403 }
      )
    }

    if (sender.email.toLowerCase() === recipientEmail) {
      return NextResponse.json({ success: false, error: 'Du kannst dir selbst keinen Sack schenken' }, { status: 400 })
    }

    const recipient = await prisma.user.findUnique({
      where: { email: recipientEmail },
      select: { id: true, email: true, firstName: true, lastName: true },
    })

    if (!recipient) {
      return NextResponse.json(
        { success: false, error: 'Kein Konto mit dieser E-Mail gefunden. Der Empfänger muss registriert sein.' },
        { status: 404 }
      )
    }

    if (sender.goofyCoins < sack.priceCoins) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nicht genügend GoofyCoins',
          currentBalance: sender.goofyCoins,
          required: sack.priceCoins,
        },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedSender = await tx.user.update({
        where: { id: sender.id },
        data: { goofyCoins: { decrement: sack.priceCoins } },
        select: { goofyCoins: true },
      })

      if (updatedSender.goofyCoins < 0) {
        throw new Error('INSUFFICIENT_COINS')
      }

      const gift = await tx.sackGift.create({
        data: {
          senderId: sender.id,
          recipientId: recipient.id,
          sackType: sack.type,
          sackName: sack.name,
          purchaseMethod: 'coins',
          pricePaid: sack.priceCoins,
          message,
        },
      })

      await tx.coinTransaction.create({
        data: {
          userId: sender.id,
          type: 'spent',
          amount: -sack.priceCoins,
          balance: updatedSender.goofyCoins,
          description: `Sack geschenkt: ${sack.name} an ${recipient.email}`,
        },
      })

      return { gift, newBalance: updatedSender.goofyCoins }
    })

    return NextResponse.json({
      success: true,
      gift: {
        id: result.gift.id,
        sackType: result.gift.sackType,
        sackName: result.gift.sackName,
        recipientEmail: recipient.email,
        recipientName: `${recipient.firstName} ${recipient.lastName}`.trim(),
        createdAt: result.gift.createdAt.toISOString(),
      },
      newBalance: result.newBalance,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'INSUFFICIENT_COINS') {
      return NextResponse.json({ success: false, error: 'Nicht genügend GoofyCoins' }, { status: 400 })
    }
    console.error('[Sacks Gift POST]', error)
    return NextResponse.json({ success: false, error: 'Geschenk fehlgeschlagen' }, { status: 500 })
  }
}
