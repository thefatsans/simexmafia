import type { SackReward } from '@/data/sacks'

export type RewardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export function getRewardRarity(reward: SackReward): RewardRarity {
  if (reward.type === 'nothing') return 'common'

  if (reward.type === 'coins') {
    const coins = reward.coins ?? 0
    if (coins < 50) return 'common'
    if (coins < 200) return 'uncommon'
    if (coins < 500) return 'rare'
    return 'epic'
  }

  if (reward.type === 'product') {
    const price = reward.product?.price ?? 0
    if (price < 20) return 'uncommon'
    if (price < 50) return 'rare'
    if (price < 100) return 'epic'
    return 'legendary'
  }

  return 'common'
}
