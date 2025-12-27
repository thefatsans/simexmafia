import { Sack, SackReward } from './sacks'

export interface SackHistoryEntry {
  id: string
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
      sackId: sackIdWithUser,
      id: `sack-${timestamp}-${random}`,
      openedAt: new Date().toISOString(),
    }
    
    const updated = [newEntry, ...history].slice(0, MAX_HISTORY)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
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

export const clearSackHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing sack history:', error)
  }
}

export const getSackStatistics = () => {
  const history = getSackHistory()
  
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







