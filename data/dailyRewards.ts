export interface DailyReward {
  day: number // Tag im Streak (1-7)
  coins: number
  bonus?: number // Bonus bei bestimmten Tagen
  name: string
  description: string
  icon: string
  color: string
}

export interface DailyRewardData {
  lastClaimDate: string | null // ISO date string
  currentStreak: number // 0-7
  totalClaims: number
}

// Use user-specific storage key
export const getStorageKey = (userId?: string): string => {
  if (typeof window === 'undefined' || !userId) {
    return 'simexmafia-daily-rewards'
  }
  return `simexmafia-daily-rewards-${userId}`
}

export const dailyRewards: DailyReward[] = [
  {
    day: 1,
    coins: 10,
    name: 'Tag 1',
    description: 'Willkommen zurück!',
    icon: '🌱',
    color: '#CD7F32',
  },
  {
    day: 2,
    coins: 15,
    name: 'Tag 2',
    description: 'Gut gemacht!',
    icon: '🌿',
    color: '#C0C0C0',
  },
  {
    day: 3,
    coins: 20,
    name: 'Tag 3',
    description: 'Du bist auf dem richtigen Weg!',
    icon: '🌳',
    color: '#FFD700',
  },
  {
    day: 4,
    coins: 30,
    bonus: 10,
    name: 'Tag 4',
    description: 'Bonus-Tag!',
    icon: '⭐',
    color: '#B9F2FF',
  },
  {
    day: 5,
    coins: 40,
    name: 'Tag 5',
    description: 'Halbe Woche geschafft!',
    icon: '🔥',
    color: '#50C878',
  },
  {
    day: 6,
    coins: 50,
    bonus: 20,
    name: 'Tag 6',
    description: 'Noch ein Tag!',
    icon: '💎',
    color: '#4B0082',
  },
  {
    day: 7,
    coins: 100,
    bonus: 50,
    name: 'Tag 7 - Wochensieg!',
    description: 'Vollständige Woche! Mega-Belohnung!',
    icon: '👑',
    color: '#FF1493',
  },
]

export const getDailyRewardData = (userId?: string): DailyRewardData => {
  try {
    if (typeof window === 'undefined') {
      return { lastClaimDate: null, currentStreak: 0, totalClaims: 0 }
    }
    const storageKey = getStorageKey(userId)
    const stored = localStorage.getItem(storageKey)
    if (!stored) {
      return { lastClaimDate: null, currentStreak: 0, totalClaims: 0 }
    }
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error loading daily reward data:', error)
    return { lastClaimDate: null, currentStreak: 0, totalClaims: 0 }
  }
}

export const saveDailyRewardData = (data: DailyRewardData, userId?: string) => {
  try {
    if (typeof window === 'undefined') return
    const storageKey = getStorageKey(userId)
    localStorage.setItem(storageKey, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving daily reward data:', error)
  }
}

export const canClaimReward = (userId?: string): boolean => {
  const data = getDailyRewardData(userId)
  
  if (!data.lastClaimDate) {
    return true // Noch nie eine Belohnung geholt
  }
  
  const lastClaim = new Date(data.lastClaimDate)
  const now = new Date()
  
  // Setze beide auf Mitternacht für genauen Vergleich
  lastClaim.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  
  const daysDiff = Math.floor((now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24))
  
  // Kann geholt werden wenn:
  // - Letzter Claim war gestern (Streak fortsetzen)
  // - Oder noch nie geholt wurde
  return daysDiff === 1 || daysDiff === 0
}

export const isStreakBroken = (userId?: string): boolean => {
  const data = getDailyRewardData(userId)
  
  if (!data.lastClaimDate) {
    return false // Noch nie geholt, also nicht gebrochen
  }
  
  const lastClaim = new Date(data.lastClaimDate)
  const now = new Date()
  
  lastClaim.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  
  const daysDiff = Math.floor((now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24))
  
  // Streak ist gebrochen wenn mehr als 1 Tag vergangen ist
  return daysDiff > 1
}

export const claimDailyReward = (userId?: string): { success: boolean; reward: DailyReward | null; newStreak: number; totalCoins: number } => {
  const data = getDailyRewardData(userId)
  
  // Prüfe ob Streak gebrochen ist
  if (isStreakBroken(userId)) {
    // Reset Streak
    data.currentStreak = 0
  }
  
  // Prüfe ob bereits heute geholt wurde
  if (!canClaimReward(userId)) {
    return { success: false, reward: null, newStreak: data.currentStreak, totalCoins: 0 }
  }
  
  // Erhöhe Streak (oder starte bei 1)
  const newStreak = data.currentStreak >= 7 ? 1 : data.currentStreak + 1
  const reward = dailyRewards[newStreak - 1]
  
  // Berechne Gesamt-Coins
  const totalCoins = reward.coins + (reward.bonus || 0)
  
  // Speichere Daten
  const updatedData: DailyRewardData = {
    lastClaimDate: new Date().toISOString(),
    currentStreak: newStreak,
    totalClaims: data.totalClaims + 1,
  }
  saveDailyRewardData(updatedData, userId)
  
  return {
    success: true,
    reward,
    newStreak,
    totalCoins,
  }
}

export const getNextReward = (userId?: string): DailyReward | null => {
  const data = getDailyRewardData(userId)
  const nextStreak = data.currentStreak >= 7 ? 1 : data.currentStreak + 1
  return dailyRewards[nextStreak - 1] || null
}

export const getTimeUntilNextClaim = (userId?: string): number => {
  const data = getDailyRewardData(userId)
  
  if (!data.lastClaimDate) {
    return 0 // Kann sofort geholt werden
  }
  
  const lastClaim = new Date(data.lastClaimDate)
  const now = new Date()
  
  lastClaim.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  
  // Wenn bereits heute geholt, berechne Zeit bis morgen
  if (lastClaim.getTime() === now.getTime()) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow.getTime() - now.getTime()
  }
  
  return 0 // Kann sofort geholt werden
}







