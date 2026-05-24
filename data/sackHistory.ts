import { Sack, SackReward } from './sacks'

export interface SackHistoryEntry {
  id: string
  userId?: string
  sackId: string
  sackType: string
  sackName: string
  sackIcon: string
  sackColor: string
  openedAt: string
  reward: SackReward
  purchaseMethod: 'coins' | 'money'
  pricePaid: number
}

async function syncSackOpenToServer(
  entry: Omit<SackHistoryEntry, 'id' | 'openedAt'>,
  userId: string
) {
  try {
    await fetch('/api/sacks/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        sackType: entry.sackType,
        sackName: entry.sackName,
        sackIcon: entry.sackIcon,
        sackColor: entry.sackColor,
        purchaseMethod: entry.purchaseMethod,
        pricePaid: entry.pricePaid,
        reward: entry.reward,
      }),
    })
  } catch (error) {
    console.warn('[SackHistory] Server sync failed:', error)
  }
}

const STORAGE_KEY = 'simexmafia-sack-history'
const MAX_HISTORY = 100

export const saveSackHistory = (entry: Omit<SackHistoryEntry, 'id' | 'openedAt'>, userId?: string) => {
  try {
    const history = getSackHistory()
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    // Füge userId zur sackId hinzu, damit das Leaderboard korrekt funktioniert
    const sackIdWithUser = userId 
      ? `${entry.sackId}-${userId}-${timestamp}-${random}`
      : `${entry.sackId}-${timestamp}-${random}`
    
    const newEntry: SackHistoryEntry = {
      ...entry,
      userId,
      sackId: sackIdWithUser,
      id: `sack-${timestamp}-${random}`,
      openedAt: new Date().toISOString(),
    }
    
    const updated = [newEntry, ...history].slice(0, MAX_HISTORY)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    if (userId) {
      void syncSackOpenToServer(entry, userId)
    }

    return newEntry
  } catch (error) {
    console.error('Error saving sack history:', error)
    return null
  }
}

export const getSackHistory = (): SackHistoryEntry[] => {
  try {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const history = JSON.parse(stored)
    return Array.isArray(history) ? history : []
  } catch (error) {
    console.error('Error loading sack history:', error)
    return []
  }
}

/** Sack-Verlauf nur für den eingeloggten User */
export const getSackHistoryForUser = (userId: string): SackHistoryEntry[] => {
  if (!userId) return []
  const all = getSackHistory()
  const byField = all.filter((entry) => entry.userId === userId)
  if (byField.length > 0) return byField

  const bySackId = all.filter((entry) => entry.sackId.includes(`-${userId}-`))
  if (bySackId.length > 0) return bySackId

  const hasAnyUserId = all.some((entry) => Boolean(entry.userId))
  if (!hasAnyUserId && all.length > 0) return all

  return []
}

export const clearSackHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing sack history:', error)
  }
}

export const getSackStatisticsForHistory = (history: SackHistoryEntry[]) => {
  
  if (history.length === 0) {
    return {
      totalOpened: 0,
      totalSpent: 0,
      totalCoinsSpent: 0,
      totalMoneySpent: 0,
      rewards: {
        nothing: 0,
        coins: 0,
        products: 0,
      },
      totalCoinsWon: 0,
      totalProductValue: 0,
      bestReward: null,
      sackTypeCounts: {} as Record<string, number>,
    }
  }

  const rewards = {
    nothing: 0,
    coins: 0,
    products: 0,
  }
  
  let totalCoinsWon = 0
  let totalProductValue = 0
  let bestReward: SackHistoryEntry | null = null
  const sackTypeCounts: Record<string, number> = {}
  
  let totalSpent = 0
  let totalCoinsSpent = 0
  let totalMoneySpent = 0

  history.forEach((entry) => {
    // Count sack types
    sackTypeCounts[entry.sackType] = (sackTypeCounts[entry.sackType] || 0) + 1
    
    // Count rewards
    if (entry.reward.type === 'nothing') {
      rewards.nothing++
    } else if (entry.reward.type === 'coins') {
      rewards.coins++
      totalCoinsWon += entry.reward.coins || 0
    } else if (entry.reward.type === 'product') {
      rewards.products++
      totalProductValue += entry.reward.product?.price || 0
    }
    
    // Calculate spending
    totalSpent += entry.pricePaid
    if (entry.purchaseMethod === 'coins') {
      totalCoinsSpent += entry.pricePaid
    } else {
      totalMoneySpent += entry.pricePaid
    }
    
    // Find best reward
    if (entry.reward.type === 'product' && entry.reward.product) {
      if (!bestReward || (entry.reward.product.price > (bestReward.reward.product?.price || 0))) {
        bestReward = entry
      }
    } else if (entry.reward.type === 'coins' && entry.reward.coins) {
      if (!bestReward || entry.reward.coins > (bestReward.reward.coins || 0)) {
        bestReward = entry
      }
    }
  })

  return {
    totalOpened: history.length,
    totalSpent,
    totalCoinsSpent,
    totalMoneySpent,
    rewards,
    totalCoinsWon,
    totalProductValue,
    bestReward,
    sackTypeCounts,
  }
}

export const getSackStatistics = () => getSackStatisticsForHistory(getSackHistory())







