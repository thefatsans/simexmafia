import { NextRequest, NextResponse } from 'next/server'
import { requireSecureSession } from '@/lib/api-auth'
import { getReferralStats } from '@/lib/referral'

export async function GET(request: NextRequest) {
  const authResult = await requireSecureSession(request)
  if (!authResult || authResult.error) {
    return authResult?.error || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = authResult.user.id
  try {
    const stats = await getReferralStats(userId)
    return NextResponse.json(stats)
  } catch (err) {
    console.error('[Referral API] Error:', err)
    return NextResponse.json({ error: 'Failed to load referral stats' }, { status: 500 })
  }
}
