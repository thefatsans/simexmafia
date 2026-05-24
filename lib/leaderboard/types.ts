export type LeaderboardCategory = 'sacks' | 'spent' | 'products' | 'coins' | 'success'

export interface LeaderboardEntryStats {
  totalSacksOpened: number
  totalSpent: number
  totalCoinsSpent: number
  totalMoneySpent: number
  bestReward: {
    type: 'product' | 'coins' | 'nothing'
    value: number
    name?: string
  } | null
  totalProductsWon: number
  totalCoinsWon: number
  successRate: number
  favoriteSackType: string
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  avatar?: string
  stats: LeaderboardEntryStats
}

export const EMPTY_LEADERBOARD_STATS: LeaderboardEntryStats = {
  totalSacksOpened: 0,
  totalSpent: 0,
  totalCoinsSpent: 0,
  totalMoneySpent: 0,
  bestReward: null,
  totalProductsWon: 0,
  totalCoinsWon: 0,
  successRate: 0,
  favoriteSackType: 'bronze',
}
