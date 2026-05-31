import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSessionPayload, requireSecureSession } from '@/lib/api-auth'
import {
  CASHOUT_VARIANTS,
  eurToCoins,
  normalizeCashoutVariant,
  validateCashoutAmount,
} from '@/lib/goofycoins/cashout'
import { mapCashoutForUser } from '@/lib/goofycoins/map-cashout'
import {
  sendCashoutAdminNotificationEmail,
  sendCashoutSubmittedEmail,
} from '@/lib/email-server'
import { checkRateLimit } from '@/lib/rate-limit'
import { MAX_PENDING_CASHOUTS } from '@/lib/security/limits'

export const dynamic = 'force-dynamic'

const USER_CASHOUT_CACHE = {
  'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
}

export async function GET(request: NextRequest) {
  const session = requireSessionPayload(request)
  if (!session.payload) {
    return session.error!
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const items = await prisma.goofyCoinCashout.findMany({
      where: { userId: session.payload.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(
      { items: items.map(mapCashoutForUser) },
      { headers: USER_CASHOUT_CACHE }
    )
  } catch (error) {
    console.error('[GoofyCoin Cashout GET]', error)
    return NextResponse.json({ error: 'Anfragen konnten nicht geladen werden' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireSecureSession(request)
  if (!authResult || authResult.error) {
    return authResult?.error || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const cashoutLimit = await checkRateLimit(
      `cashout:user:${authResult.user.id}`,
      3,
      24 * 60 * 60 * 1000
    )
    if (!cashoutLimit.allowed) {
      return NextResponse.json(
        { error: 'Zu viele Umtausch-Anfragen. Bitte morgen erneut versuchen.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const euroAmount = Number(body.euroAmount)
    const variant = normalizeCashoutVariant(body.variant)
    const fullName = String(body.fullName ?? '').trim()
    const email = String(body.email ?? '').trim()
    const phone = String(body.phone ?? '').trim() || null
    const iban = String(body.iban ?? '').replace(/\s/g, '').trim() || null
    const address = String(body.address ?? '').trim() || null
    const notes = String(body.notes ?? '').trim() || null

    const amountError = validateCashoutAmount(euroAmount)
    if (amountError) {
      return NextResponse.json({ error: amountError }, { status: 400 })
    }

    if (!variant) {
      return NextResponse.json({ error: 'Bitte wähle Bargeld oder Echtgeld' }, { status: 400 })
    }

    if (!fullName || fullName.length < 2) {
      return NextResponse.json({ error: 'Bitte gib deinen vollständigen Namen an' }, { status: 400 })
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Bitte gib eine gültige E-Mail an' }, { status: 400 })
    }

    if (variant === 'bank') {
      if (!iban || iban.length < 15) {
        return NextResponse.json({ error: 'Für Echtgeld ist eine gültige IBAN erforderlich' }, { status: 400 })
      }
    } else if (!address && !phone) {
      return NextResponse.json(
        { error: 'Für Bargeld gib bitte Adresse oder Telefonnummer an' },
        { status: 400 }
      )
    }

    const coinsAmount = eurToCoins(euroAmount)
    const variantLabel = CASHOUT_VARIANTS[variant].label

    const result = await prisma.$transaction(async (tx) => {
      const dbUser = await tx.user.findUnique({
        where: { id: authResult.user.id },
        select: { id: true, goofyCoins: true, emailVerified: true },
      })

      if (!dbUser) {
        throw new Error('USER_NOT_FOUND')
      }

      if (!dbUser.emailVerified) {
        throw new Error('EMAIL_NOT_VERIFIED')
      }

      const pendingCount = await tx.goofyCoinCashout.count({
        where: { userId: authResult.user.id, status: 'pending' },
      })
      if (pendingCount >= MAX_PENDING_CASHOUTS) {
        throw new Error('TOO_MANY_PENDING')
      }

      if (dbUser.goofyCoins < coinsAmount) {
        throw new Error('INSUFFICIENT_COINS')
      }

      const updatedUser = await tx.user.update({
        where: { id: authResult.user.id },
        data: { goofyCoins: { decrement: coinsAmount } },
        select: { goofyCoins: true },
      })

      if (updatedUser.goofyCoins < 0) {
        throw new Error('INSUFFICIENT_COINS')
      }

      const cashout = await tx.goofyCoinCashout.create({
        data: {
          userId: authResult.user.id,
          variant,
          coinsAmount,
          euroAmount,
          fullName,
          email,
          phone,
          iban: variant === 'bank' ? iban : null,
          address: variant === 'cash' ? address : null,
          notes,
        },
      })

      await tx.coinTransaction.create({
        data: {
          userId: authResult.user.id,
          type: 'redeemed',
          amount: -coinsAmount,
          balance: updatedUser.goofyCoins,
          description: `Umtausch (${variantLabel}): ${euroAmount.toFixed(2)}€`,
        },
      })

      return { cashout, newBalance: updatedUser.goofyCoins }
    })

    sendCashoutSubmittedEmail({
      email,
      firstName: authResult.user.firstName || fullName.split(' ')[0] || 'Spieler',
      euroAmount,
      coinsAmount,
      variantLabel,
    }).catch((err) => console.error('[GoofyCoin Cashout] User email failed:', err))

    sendCashoutAdminNotificationEmail({
      userName: fullName,
      userEmail: email,
      euroAmount,
      coinsAmount,
      variantLabel,
      cashoutId: result.cashout.id,
    }).catch((err) => console.error('[GoofyCoin Cashout] Admin email failed:', err))

    return NextResponse.json({
      success: true,
      cashout: mapCashoutForUser(result.cashout),
      newBalance: result.newBalance,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }
    if (message === 'EMAIL_NOT_VERIFIED') {
      return NextResponse.json(
        {
          error: 'Bitte bestätige deine E-Mail-Adresse, bevor du GoofyCoins umtauschst.',
          code: 'EMAIL_NOT_VERIFIED',
        },
        { status: 403 }
      )
    }
    if (message === 'INSUFFICIENT_COINS') {
      return NextResponse.json({ error: 'Nicht genügend GoofyCoins' }, { status: 400 })
    }
    if (message === 'TOO_MANY_PENDING') {
      return NextResponse.json(
        { error: `Maximal ${MAX_PENDING_CASHOUTS} offene Umtausch-Anfragen gleichzeitig.` },
        { status: 400 }
      )
    }

    console.error('[GoofyCoin Cashout POST]', error)
    return NextResponse.json({ error: 'Umtausch-Anfrage fehlgeschlagen' }, { status: 500 })
  }
}
