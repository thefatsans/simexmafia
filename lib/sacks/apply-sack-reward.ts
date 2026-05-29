import { prisma } from '@/lib/prisma'
import type { SackReward } from '@/data/sacks'
import { recordSackOpenInDatabase } from '@/lib/leaderboard/record-sack-open'
import { recordSackOpenDayCount } from '@/lib/sack-limits'

type SackInfo = {
  type: string
  name: string
  icon?: string
  color?: string
}

export async function applySackRewardToUser(
  userId: string,
  sack: SackInfo,
  reward: SackReward,
  purchaseMethod: 'coins' | 'money',
  pricePaid: number,
  options?: { recordDayCount?: boolean }
) {
  if (!prisma) {
    throw new Error('Database not available')
  }

  if (options?.recordDayCount !== false && purchaseMethod === 'coins') {
    await recordSackOpenDayCount(userId)
  }

  await recordSackOpenInDatabase({
    userId,
    sackType: sack.type,
    sackName: sack.name,
    sackIcon: sack.icon,
    sackColor: sack.color,
    purchaseMethod,
    pricePaid,
    reward,
  })

  if (reward.type === 'coins' && reward.coins) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { goofyCoins: { increment: reward.coins } },
      select: { goofyCoins: true },
    })

    await prisma.coinTransaction.create({
      data: {
        userId,
        type: 'earned',
        amount: reward.coins,
        balance: updated.goofyCoins,
        description: `Sack reward: ${sack.name}`,
      },
    })

    return updated.goofyCoins
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { goofyCoins: true },
  })
  return user?.goofyCoins ?? 0
}
