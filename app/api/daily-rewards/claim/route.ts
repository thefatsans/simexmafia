import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { dailyRewards } from '@/data/dailyRewards'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId: clientUserId } = body

    console.log('[Daily Rewards] Received claim request:', {
      clientUserId
    })

    // Verify authentication
    const authResult = await getAuthenticatedUser(request, body)
    if (!authResult || authResult.error) {
      return authResult?.error || NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const authenticatedUser = authResult.user
    if (!authenticatedUser || !authenticatedUser.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify userId matches
    if (clientUserId && authenticatedUser.id !== clientUserId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: User ID mismatch' },
        { status: 403 }
      )
    }

    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      )
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: authenticatedUser.id },
      select: {
        id: true,
        goofyCoins: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get daily reward data from database (or create if doesn't exist)
    // We'll use a simple approach: store last claim date in user metadata or separate table
    // For now, let's check if we have a DailyRewardClaim table, otherwise use a simple approach
    
    // Check last claim from CoinTransaction
    const lastClaim = await prisma.coinTransaction.findFirst({
      where: {
        userId: authenticatedUser.id,
        type: 'earned',
        description: {
          contains: 'Daily Reward',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        createdAt: true,
        description: true,
      },
    })

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    today.setHours(0, 0, 0, 0)
    
    // Check if already claimed today
    if (lastClaim) {
      const lastClaimDate = new Date(lastClaim.createdAt)
      const lastClaimDay = new Date(lastClaimDate.getFullYear(), lastClaimDate.getMonth(), lastClaimDate.getDate())
      lastClaimDay.setHours(0, 0, 0, 0)
      
      if (lastClaimDay.getTime() === today.getTime()) {
        return NextResponse.json(
          { success: false, error: 'Daily reward already claimed today' },
          { status: 400 }
        )
      }
    }

    // Calculate streak - count consecutive days from today backwards
    let streak = 1
    if (lastClaim) {
      const lastClaimDate = new Date(lastClaim.createdAt)
      const lastClaimDay = new Date(lastClaimDate.getFullYear(), lastClaimDate.getMonth(), lastClaimDate.getDate())
      lastClaimDay.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((today.getTime() - lastClaimDay.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 1) {
        // Consecutive day - continue streak
        // Get all daily reward claims from the last 7 days
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const recentClaims = await prisma.coinTransaction.findMany({
          where: {
            userId: authenticatedUser.id,
            type: 'earned',
            description: {
              contains: 'Daily Reward',
            },
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            createdAt: true,
            description: true,
          },
        })
        
        // Count consecutive days backwards from today
        // We expect: today-0, today-1, today-2, ... (if streak continues)
        let consecutiveDays = 1 // Today is day 1
        for (let dayOffset = 1; dayOffset <= 6; dayOffset++) {
          const expectedDay = new Date(today)
          expectedDay.setDate(expectedDay.getDate() - dayOffset)
          expectedDay.setHours(0, 0, 0, 0)
          
          // Check if there's a claim for this day
          const hasClaimForDay = recentClaims.some(claim => {
            const claimDate = new Date(claim.createdAt)
            const claimDay = new Date(claimDate.getFullYear(), claimDate.getMonth(), claimDate.getDate())
            claimDay.setHours(0, 0, 0, 0)
            return claimDay.getTime() === expectedDay.getTime()
          })
          
          if (hasClaimForDay) {
            consecutiveDays++
          } else {
            // Streak broken - stop counting
            break
          }
        }
        
        streak = Math.min(consecutiveDays, 7)
      } else if (daysDiff > 1) {
        // Streak broken - more than 1 day passed
        streak = 1
      } else if (daysDiff === 0) {
        // Same day - should not happen (already checked above), but just in case
        return NextResponse.json(
          { success: false, error: 'Daily reward already claimed today' },
          { status: 400 }
        )
      }
      // daysDiff < 0 should not happen (future dates), but if it does, start at streak 1
    }

    // Get reward for current streak
    const rewardIndex = Math.min(streak - 1, 6) // 0-6 for days 1-7
    const reward = dailyRewards[rewardIndex]
    const totalCoins = reward.coins + (reward.bonus || 0)

    // Add coins to user
    await prisma.user.update({
      where: { id: authenticatedUser.id },
      data: {
        goofyCoins: {
          increment: totalCoins,
        },
      },
    })

    // Create coin transaction
    await prisma.coinTransaction.create({
      data: {
        userId: authenticatedUser.id,
        type: 'earned',
        amount: totalCoins,
        balance: dbUser.goofyCoins + totalCoins,
        description: `Daily Reward - Day ${streak}`,
      },
    })

    console.log('[Daily Rewards] Reward claimed:', {
      userId: authenticatedUser.id,
      streak,
      coins: totalCoins,
    })

    return NextResponse.json({
      success: true,
      reward,
      newStreak: streak,
      totalCoins,
      newBalance: dbUser.goofyCoins + totalCoins,
    })
  } catch (error: any) {
    console.error('[Daily Rewards] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


