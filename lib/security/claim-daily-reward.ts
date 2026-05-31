import { prisma } from '@/lib/prisma'
import { dailyRewards } from '@/data/dailyRewards'

function utcDayStart(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function utcDayKey(d = new Date()): string {
  return utcDayStart(d).toISOString().slice(0, 10)
}

export async function claimDailyReward(userId: string): Promise<
  | {
      ok: true
      reward: (typeof dailyRewards)[number]
      newStreak: number
      totalCoins: number
      newBalance: number
    }
  | { ok: false; error: string; status: number }
> {
  if (!prisma) {
    return { ok: false, error: 'Database not available', status: 503 }
  }

  return prisma.$transaction(async (tx) => {
    const dbUser = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, goofyCoins: true, emailVerified: true },
    })

    if (!dbUser) {
      return { ok: false, error: 'User not found', status: 404 }
    }

    if (!dbUser.emailVerified) {
      return {
        ok: false,
        error: 'Bitte bestätige deine E-Mail-Adresse, bevor du die tägliche Belohnung abholst.',
        status: 403,
      }
    }

    const todayKey = utcDayKey()
    const todayStart = utcDayStart()

    const alreadyToday = await tx.coinTransaction.findFirst({
      where: {
        userId,
        type: 'earned',
        description: { startsWith: 'Daily Reward' },
        createdAt: { gte: todayStart },
      },
      select: { id: true },
    })

    if (alreadyToday) {
      return { ok: false, error: 'Daily reward already claimed today', status: 400 }
    }

    const lastClaim = await tx.coinTransaction.findFirst({
      where: {
        userId,
        type: 'earned',
        description: { startsWith: 'Daily Reward' },
        createdAt: { lt: todayStart },
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })

    let streak = 1
    if (lastClaim) {
      const lastDay = utcDayStart(lastClaim.createdAt)
      const daysDiff = Math.round(
        (todayStart.getTime() - lastDay.getTime()) / (24 * 60 * 60 * 1000)
      )

      if (daysDiff === 1) {
        const sevenDaysAgo = new Date(todayStart)
        sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7)

        const recentClaims = await tx.coinTransaction.findMany({
          where: {
            userId,
            type: 'earned',
            description: { startsWith: 'Daily Reward' },
            createdAt: { gte: sevenDaysAgo, lt: todayStart },
          },
          select: { createdAt: true },
        })

        let consecutiveDays = 1
        for (let dayOffset = 1; dayOffset <= 6; dayOffset++) {
          const expectedDay = new Date(todayStart)
          expectedDay.setUTCDate(expectedDay.getUTCDate() - dayOffset)
          const expectedKey = utcDayKey(expectedDay)

          const hasClaimForDay = recentClaims.some(
            (claim) => utcDayKey(claim.createdAt) === expectedKey
          )

          if (hasClaimForDay) {
            consecutiveDays++
          } else {
            break
          }
        }

        streak = Math.min(consecutiveDays, 7)
      } else if (daysDiff > 1) {
        streak = 1
      }
    }

    const rewardIndex = Math.min(streak - 1, 6)
    const reward = dailyRewards[rewardIndex]
    const totalCoins = reward.coins + (reward.bonus || 0)

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { goofyCoins: { increment: totalCoins } },
      select: { goofyCoins: true },
    })

    await tx.coinTransaction.create({
      data: {
        userId,
        type: 'earned',
        amount: totalCoins,
        balance: updatedUser.goofyCoins,
        description: `Daily Reward - Day ${streak} (${todayKey})`,
      },
    })

    return {
      ok: true,
      reward,
      newStreak: streak,
      totalCoins,
      newBalance: updatedUser.goofyCoins,
    }
  })
}
