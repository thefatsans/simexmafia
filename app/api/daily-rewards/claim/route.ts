import { NextRequest, NextResponse } from 'next/server'
import { requireSecureSession } from '@/lib/api-auth'
import { claimDailyReward } from '@/lib/security/claim-daily-reward'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSecureSession(request)
    if (!authResult || authResult.error) {
      return authResult?.error || NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const authenticatedUser = authResult.user
    if (!authenticatedUser?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const result = await claimDailyReward(authenticatedUser.id)
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      reward: result.reward,
      newStreak: result.newStreak,
      totalCoins: result.totalCoins,
      newBalance: result.newBalance,
    })
  } catch (error: unknown) {
    console.error('[Daily Rewards] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
