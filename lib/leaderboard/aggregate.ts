import type { LeaderboardCategory, LeaderboardEntry, LeaderboardEntryStats } from './types'
import { EMPTY_LEADERBOARD_STATS } from './types'

type SackOpenRow = {
  userId: string
  sackType: string
  purchaseMethod: string
  pricePaid: number
  rewardType: string
  rewardCoins: number | null
  rewardProductName: string | null
  rewardProductPrice: number | null
}

type UserRow = {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar: string | null
  totalSpent: number
}

export function buildStatsFromSackOpens(opens: SackOpenRow[]): LeaderboardEntryStats {
  if (opens.length === 0) return { ...EMPTY_LEADERBOARD_STATS }

  const totalSacksOpened = opens.length
  const totalCoinsSpent = opens
    .filter((o) => o.purchaseMethod === 'coins')
    .reduce((sum, o) => sum + o.pricePaid, 0)
  const totalMoneySpent = opens
    .filter((o) => o.purchaseMethod === 'money')
    .reduce((sum, o) => sum + o.pricePaid, 0)

  let nothing = 0
  let coins = 0
  let products = 0
  let totalCoinsWon = 0
  let bestReward: LeaderboardEntryStats['bestReward'] = null

  const sackTypeCounts: Record<string, number> = {}

  for (const open of opens) {
    sackTypeCounts[open.sackType] = (sackTypeCounts[open.sackType] || 0) + 1

    if (open.rewardType === 'nothing') nothing++
    else if (open.rewardType === 'coins') {
      coins++
      const value = open.rewardCoins || 0
      totalCoinsWon += value
      if (!bestReward || value > (bestReward.value || 0)) {
        bestReward = { type: 'coins', value }
      }
    } else if (open.rewardType === 'product') {
      products++
      const value = open.rewardProductPrice || 0
      if (!bestReward || value > (bestReward.value || 0)) {
        bestReward = {
          type: 'product',
          value,
          name: open.rewardProductName || undefined,
        }
      }
    }
  }

  const successRate =
    totalSacksOpened > 0 ? ((coins + products) / totalSacksOpened) * 100 : 0

  const favoriteSackType =
    Object.entries(sackTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'bronze'

  return {
    totalSacksOpened,
    totalSpent: totalMoneySpent,
    totalCoinsSpent,
    totalMoneySpent,
    bestReward,
    totalProductsWon: products,
    totalCoinsWon,
    successRate,
    favoriteSackType,
  }
}

export function buildLeaderboardEntries(
  users: UserRow[],
  opensByUser: Map<string, SackOpenRow[]>
): LeaderboardEntry[] {
  return users.map((user) => {
    const userOpens = opensByUser.get(user.id) || []
    const sackStats = buildStatsFromSackOpens(userOpens)

    return {
      userId: user.id,
      userName:
        `${user.firstName} ${user.lastName}`.trim() ||
        user.email.split('@')[0] ||
        'Spieler',
      avatar: user.avatar || undefined,
      stats: {
        ...sackStats,
        totalSpent: Math.max(user.totalSpent || 0, sackStats.totalMoneySpent),
      },
    }
  })
}

export function sortLeaderboard(
  entries: LeaderboardEntry[],
  category: LeaderboardCategory
): LeaderboardEntry[] {
  const sorted = [...entries].sort((a, b) => {
    switch (category) {
      case 'sacks':
        return b.stats.totalSacksOpened - a.stats.totalSacksOpened
      case 'spent':
        return b.stats.totalSpent - a.stats.totalSpent
      case 'products':
        return b.stats.totalProductsWon - a.stats.totalProductsWon
      case 'coins':
        return b.stats.totalCoinsWon - a.stats.totalCoinsWon
      case 'success':
        return b.stats.successRate - a.stats.successRate
      default:
        return 0
    }
  })

  return sorted.filter((entry) => {
    switch (category) {
      case 'sacks':
        return entry.stats.totalSacksOpened > 0
      case 'spent':
        return entry.stats.totalSpent > 0
      case 'products':
        return entry.stats.totalProductsWon > 0
      case 'coins':
        return entry.stats.totalCoinsWon > 0
      case 'success':
        return entry.stats.totalSacksOpened > 0
      default:
        return true
    }
  })
}

export function getUserRankInEntries(
  entries: LeaderboardEntry[],
  userId: string
): number {
  const index = entries.findIndex((e) => e.userId === userId)
  return index >= 0 ? index + 1 : entries.length + 1
}
