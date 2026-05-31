import { NextRequest, NextResponse } from 'next/server'
import { requireSecureSession } from '@/lib/api-auth'
import { recordSackOpenInDatabase } from '@/lib/leaderboard/record-sack-open'
import { sackTypes } from '@/data/sacks'

/** Client-seitige Sack-Öffnung (Echtgeld-Flow) ins Leaderboard übernehmen */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authResult = await requireSecureSession(request)

    if (!authResult || authResult.error) {
      return authResult?.error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      sackType,
      sackName,
      sackIcon,
      sackColor,
      purchaseMethod,
      pricePaid,
      reward,
      orderId,
    } = body

    if (purchaseMethod !== 'money') {
      return NextResponse.json({ error: 'Invalid purchase method' }, { status: 400 })
    }

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId is required for money sack opens' }, { status: 400 })
    }

    if (!sackType || !sackName || !reward?.type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sack = sackTypes.find((s) => s.type === sackType || s.id === sackType)
    if (!sack) {
      return NextResponse.json({ error: 'Invalid sack type' }, { status: 400 })
    }

    if (sack.name !== sackName) {
      return NextResponse.json({ error: 'Sack name mismatch' }, { status: 400 })
    }

    const record = await recordSackOpenInDatabase({
      userId: authResult.user.id,
      sackType: sack.type,
      sackName: sack.name,
      sackIcon: sackIcon || sack.icon,
      sackColor: sackColor || sack.color,
      purchaseMethod: 'money',
      pricePaid: Number(pricePaid) || sack.priceMoney,
      reward: {
        type: reward.type,
        coins: reward.type === 'coins' ? sack.priceCoins : undefined,
        message: reward.message || '',
      },
    })

    return NextResponse.json({ success: true, id: record?.id ?? null })
  } catch (error) {
    console.error('[Sacks Record] Error:', error)
    return NextResponse.json({ error: 'Failed to record sack open' }, { status: 500 })
  }
}
