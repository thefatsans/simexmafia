import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  buildLeaderboardEntries,
  sortLeaderboard,
} from '@/lib/leaderboard/aggregate'
import type { LeaderboardCategory } from '@/lib/leaderboard/types'

const VALID_CATEGORIES: LeaderboardCategory[] = [
  'sacks',
  'spent',
  'products',
  'coins',
  'success',
]

export async function GET(request: NextRequest) {
  try {
    const categoryParam = request.nextUrl.searchParams.get('category') || 'sacks'
    const category = VALID_CATEGORIES.includes(categoryParam as LeaderboardCategory)
      ? (categoryParam as LeaderboardCategory)
      : 'sacks'

    if (!prisma || !process.env.DATABASE_URL) {
      return NextResponse.json({ entries: [], category, source: 'empty' })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        totalSpent: true,
      },
    })

    let sackOpens: Array<{
      userId: string
      sackType: string
      purchaseMethod: string
      pricePaid: number
      rewardType: string
      rewardCoins: number | null
      rewardProductName: string | null
      rewardProductPrice: number | null
    }> = []

    try {
      sackOpens = await prisma.sackOpen.findMany({
        select: {
          userId: true,
          sackType: true,
          purchaseMethod: true,
          pricePaid: true,
          rewardType: true,
          rewardCoins: true,
          rewardProductName: true,
          rewardProductPrice: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      console.warn('[Leaderboard API] SackOpen table missing or error:', error)
    }

    const opensByUser = new Map<string, typeof sackOpens>()
    for (const open of sackOpens) {
      const list = opensByUser.get(open.userId) || []
      list.push(open)
      opensByUser.set(open.userId, list)
    }

    const entries = sortLeaderboard(
      buildLeaderboardEntries(users, opensByUser),
      category
    )

    return NextResponse.json({
      entries,
      category,
      source: 'database',
      totalUsers: users.length,
    })
  } catch (error) {
    console.error('[Leaderboard API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load leaderboard', entries: [] },
      { status: 500 }
    )
  }
}
