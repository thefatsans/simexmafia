import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSecureSession } from '@/lib/api-auth'
import { dailyRewards } from '@/data/dailyRewards'

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export async function GET(request: NextRequest) {
  const authResult = await requireSecureSession(request)
  if (!authResult || authResult.error) {
    return authResult?.error || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const claims = await prisma.coinTransaction.findMany({
      where: {
        userId: authResult.user.id,
        type: 'earned',
        description: { contains: 'Daily Reward' },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { createdAt: true, description: true },
    })

    const today = startOfDay(new Date())
    const lastClaim = claims[0] ?? null
    const lastClaimDay = lastClaim ? startOfDay(lastClaim.createdAt) : null
    const daysDiff = lastClaimDay
      ? Math.floor((today.getTime() - lastClaimDay.getTime()) / (1000 * 60 * 60 * 24))
      : null

    const canClaim = !lastClaimDay || (daysDiff !== null && daysDiff >= 1)

    let currentStreak = 0
    if (lastClaim) {
      const match = lastClaim.description.match(/Day (\d+)/)
      currentStreak = match ? Number(match[1]) : 0
    }

    let nextStreak = 1
    if (canClaim) {
      if (!lastClaimDay) {
        nextStreak = 1
      } else if (daysDiff === 1) {
        nextStreak = currentStreak >= 7 ? 1 : currentStreak + 1
      } else {
        nextStreak = 1
      }
    } else {
      nextStreak = currentStreak || 1
    }

    return NextResponse.json({
      canClaim,
      lastClaimDate: lastClaim?.createdAt.toISOString() ?? null,
      currentStreak: canClaim && lastClaimDay && daysDiff !== 1 && daysDiff !== null && daysDiff > 1 ? 0 : currentStreak,
      nextStreak,
      nextReward: dailyRewards[Math.min(nextStreak, 7) - 1] ?? dailyRewards[0],
      totalClaims: claims.length,
    })
  } catch (error) {
    console.error('[Daily Rewards Status GET]', error)
    return NextResponse.json({ error: 'Status konnte nicht geladen werden' }, { status: 500 })
  }
}
