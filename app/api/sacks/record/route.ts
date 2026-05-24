import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { recordSackOpenInDatabase } from '@/lib/leaderboard/record-sack-open'

/** Client-seitige Sack-Öffnung (z. B. Echtgeld-Flow) ins Leaderboard übernehmen */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authResult = await getAuthenticatedUser(request, body)

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
    } = body

    if (!sackType || !sackName || !purchaseMethod || !reward?.type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const record = await recordSackOpenInDatabase({
      userId: authResult.user.id,
      sackType,
      sackName,
      sackIcon,
      sackColor,
      purchaseMethod,
      pricePaid: Number(pricePaid) || 0,
      reward,
    })

    return NextResponse.json({ success: true, id: record?.id ?? null })
  } catch (error) {
    console.error('[Sacks Record] Error:', error)
    return NextResponse.json({ error: 'Failed to record sack open' }, { status: 500 })
  }
}
