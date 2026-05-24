import { prisma } from '@/lib/prisma'
import type { SackReward } from '@/data/sacks'

export interface RecordSackOpenInput {
  userId: string
  sackType: string
  sackName: string
  sackIcon?: string
  sackColor?: string
  purchaseMethod: 'coins' | 'money'
  pricePaid: number
  reward: SackReward
}

export async function recordSackOpenInDatabase(input: RecordSackOpenInput) {
  if (!prisma || !process.env.DATABASE_URL) {
    return null
  }

  try {
    const reward = input.reward
    return await prisma.sackOpen.create({
      data: {
        userId: input.userId,
        sackType: input.sackType,
        sackName: input.sackName,
        sackIcon: input.sackIcon,
        sackColor: input.sackColor,
        purchaseMethod: input.purchaseMethod,
        pricePaid: input.pricePaid,
        rewardType: reward.type,
        rewardCoins: reward.type === 'coins' ? reward.coins ?? 0 : null,
        rewardProductName:
          reward.type === 'product' ? reward.product?.name ?? null : null,
        rewardProductPrice:
          reward.type === 'product' ? reward.product?.price ?? null : null,
      },
    })
  } catch (error) {
    console.warn('[Leaderboard] Could not record sack open:', error)
    return null
  }
}
