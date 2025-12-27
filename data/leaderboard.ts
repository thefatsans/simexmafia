import { SackHistoryEntry, getSackHistory } from './sackHistory'
import { InventoryItem, getInventory } from './inventory'
import { Order, getUserOrders } from './payments'

export interface LeaderboardEntry {
  userId: string
  userName: string
  avatar?: string
  stats: {
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
}

// Cache für berechnete Stats (wird bei jedem Refresh geleert)
let statsCache: Map<string, LeaderboardEntry['stats']> = new Map()
let cacheTimestamp = 0
const CACHE_DURATION = 3000 // 3 Sekunden Cache

// Lade alle registrierten User aus localStorage
const getAllUsers = (): Array<{ id: string; firstName: string; lastName: string; email: string }> => {
  try {
    if (typeof window === 'undefined') return []
    const usersJson = localStorage.getItem('simexmafia-users')
    if (!usersJson) return []
    const users = JSON.parse(usersJson)
    return Array.isArray(users) ? users.map((u: any) => ({
      id: u.id,
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
    })) : []
  } catch (error) {
    console.error('Error loading users:', error)
    return []
  }
}

// Optimierte Batch-Berechnung aller User-Stats auf einmal
// currentUserId: Wenn gesetzt, werden nur Einträge mit dieser User-ID gezählt
const calculateAllUserStats = (currentUserId?: string): Map<string, LeaderboardEntry['stats']> => {
  const now = Date.now()
  
  // Verwende Cache wenn noch gültig
  if (statsCache.size > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
    return statsCache
  }
  
  // Lade alle Daten einmal
  const history = getSackHistory()
  const inventory = getInventory()
  
  // Erstelle Map für schnellen Zugriff: userId -> Stats
  const userStatsMap = new Map<string, LeaderboardEntry['stats']>()
  
  // Gruppiere Historie nach User-ID (sackId sollte userId enthalten)
  const historyByUser = new Map<string, SackHistoryEntry[]>()
  
  // Lade alle User einmal für bessere Performance
  const users = getAllUsers()
  const userIds = new Set(users.map(u => u.id))
  
  // Debug: Log verfügbare User-IDs
  console.log('[Leaderboard] Available user IDs:', Array.from(userIds))
  console.log('[Leaderboard] Total history entries:', history.length)
  if (history.length > 0) {
    console.log('[Leaderboard] Sample sackIds:', history.slice(0, 3).map(e => e.sackId))
  }
  console.log('[Leaderboard] currentUserId filter:', currentUserId)
  
  let foundCount = 0
  let skippedCount = 0
  
  history.forEach(entry => {
    // Extrahiere User-ID aus sackId
    // Format: "{sackType}-user-{userId}-{timestamp}-{random}"
    // Oder: "{sackType}-{userId}-{timestamp}-{random}"
    // Oder altes Format: "{sackId}-{timestamp}-{random}" (ohne userId)
    let userId = ''
    
    const fullSackId = entry.sackId
    
    // Strategie 1: Suche nach dem Pattern "-user-{userId}" gefolgt von Timestamp
    // Format: "bronze-user-1766838386695-1766841452188-m7kxei6rm"
    // Das Pattern muss nach "-user-" suchen, dann die User-ID, dann ein Timestamp (13-stellige Zahl)
    const userPatternMatch = fullSackId.match(/-user-([^-]+)-\d{13}/)
    if (userPatternMatch && userPatternMatch[1]) {
      const potentialUserId = userPatternMatch[1]
      // Prüfe zuerst die exakte User-ID
      if (userIds.has(potentialUserId)) {
        userId = potentialUserId
        console.log('[Leaderboard] Found userId via pattern (exact):', userId, 'from sackId:', fullSackId)
      } else {
        // Prüfe ob die User-ID mit "user-" beginnt
        const userIdWithPrefix = `user-${potentialUserId}`
        if (userIds.has(userIdWithPrefix)) {
          userId = userIdWithPrefix
          console.log('[Leaderboard] Found userId via pattern (with prefix):', userId, 'from sackId:', fullSackId)
        } else {
          console.log('[Leaderboard] Pattern matched but userId not found in list:', potentialUserId, 'or', userIdWithPrefix, 'Available:', Array.from(userIds))
        }
      }
    } else {
      console.log('[Leaderboard] Pattern did not match for sackId:', fullSackId)
    }
    
    // Strategie 2: Split und suche nach User-ID zwischen "user" und timestamp
    // Format: "bronze-user-1766838386695-1766841452188-m7kxei6rm"
    // Nach "user" kommt die User-ID, dann der Timestamp
    if (!userId) {
      const parts = fullSackId.split('-')
      
      // Suche nach "user" und dann die User-ID im nächsten Teil
      for (let i = 0; i < parts.length - 1; i++) {
        if (parts[i] === 'user' && i + 1 < parts.length) {
          const potentialUserId = parts[i + 1]
          // Prüfe ob es eine bekannte User-ID ist (exakt)
          if (userIds.has(potentialUserId)) {
            // Prüfe ob nach der User-ID ein Timestamp kommt (bestätigt das Format)
            if (i + 2 < parts.length && /^\d{13}$/.test(parts[i + 2])) {
              userId = potentialUserId
              console.log('[Leaderboard] Found userId via split strategy (exact):', userId, 'from sackId:', fullSackId)
              break
            }
          } else {
            // Prüfe ob die User-ID mit "user-" beginnt
            const userIdWithPrefix = `user-${potentialUserId}`
            if (userIds.has(userIdWithPrefix)) {
              // Prüfe ob nach der User-ID ein Timestamp kommt (bestätigt das Format)
              if (i + 2 < parts.length && /^\d{13}$/.test(parts[i + 2])) {
                userId = userIdWithPrefix
                console.log('[Leaderboard] Found userId via split strategy (with prefix):', userId, 'from sackId:', fullSackId)
                break
              }
            }
          }
        }
      }
    }
    
    // Wenn keine User-ID gefunden, überspringe diesen Eintrag
    // (alte Einträge ohne User-ID werden nicht mehr automatisch zugeordnet)
    if (!userId) {
      // Überspringe Einträge ohne User-ID - sie gehören nicht zu diesem Account
      skippedCount++
      console.log('[Leaderboard] Skipped entry without userId:', entry.sackId)
      return
    }
    
    // Wenn currentUserId gesetzt ist, zähle nur Einträge mit dieser User-ID
    // (verhindert, dass alte Einträge vom alten Account gezählt werden)
    if (currentUserId && userId !== currentUserId) {
      // Überspringe Einträge von anderen Usern, wenn currentUserId gesetzt ist
      skippedCount++
      console.log('[Leaderboard] Skipped entry from different user:', userId, 'expected:', currentUserId, 'sackId:', entry.sackId)
      return
    }
    
    foundCount++
    if (!historyByUser.has(userId)) {
      historyByUser.set(userId, [])
    }
    historyByUser.get(userId)!.push(entry)
  })
  
  console.log('[Leaderboard] Found entries:', foundCount, 'Skipped:', skippedCount, 'Total:', history.length)
  
  // Debug: Log für 'unknown' Einträge
  if (historyByUser.has('unknown') && historyByUser.get('unknown')!.length > 0) {
    console.log(`[Leaderboard] Found ${historyByUser.get('unknown')!.length} entries without user ID`)
    console.log('[Leaderboard] Sample sackIds:', historyByUser.get('unknown')!.slice(0, 3).map(e => e.sackId))
    console.log('[Leaderboard] Available user IDs:', Array.from(userIds))
  }
  
  // Berechne Stats für jeden User
  historyByUser.forEach((userHistory, userId) => {
    const totalSacksOpened = userHistory.length
    // totalCoinsSpent: Summe der Coins, die für Säcke ausgegeben wurden
    const totalCoinsSpent = userHistory.filter(h => h.purchaseMethod === 'coins').reduce((sum, h) => sum + h.pricePaid, 0)
    // totalMoneySpent: Summe des Geldes, das für Säcke ausgegeben wurde
    const totalMoneySpent = userHistory.filter(h => h.purchaseMethod === 'money').reduce((sum, h) => sum + h.pricePaid, 0)
    // totalSpent: Nur Geld-Ausgaben (nicht Coins), da Coins separat gezählt werden
    const totalSpent = totalMoneySpent
    
    // Debug: Log für jeden User
    if (currentUserId && userId === currentUserId) {
      console.log('[Leaderboard] Calculating stats for current user:', userId)
      console.log('[Leaderboard] User history entries:', userHistory.length)
      console.log('[Leaderboard] All entries:', userHistory.map(e => ({
        sackId: e.sackId,
        pricePaid: e.pricePaid,
        purchaseMethod: e.purchaseMethod,
        sackType: e.sackType
      })))
      console.log('[Leaderboard] Total spent (money only):', totalSpent)
      console.log('[Leaderboard] Total coins spent:', totalCoinsSpent)
      console.log('[Leaderboard] Total money spent:', totalMoneySpent)
    }
    
    const rewards = {
      nothing: userHistory.filter(h => h.reward.type === 'nothing').length,
      coins: userHistory.filter(h => h.reward.type === 'coins').length,
      products: userHistory.filter(h => h.reward.type === 'product').length,
    }
    
    const totalCoinsWon = userHistory
      .filter(h => h.reward.type === 'coins')
      .reduce((sum, h) => sum + (h.reward.coins || 0), 0)
    
    const totalProductsWon = rewards.products
    
    const successRate = totalSacksOpened > 0
      ? ((rewards.coins + rewards.products) / totalSacksOpened) * 100
      : 0
    
    // Finde beste Belohnung
    let bestReward: LeaderboardEntry['stats']['bestReward'] = null
    userHistory.forEach(entry => {
      if (entry.reward.type === 'product' && entry.reward.product) {
        const value = entry.reward.product.price
        if (!bestReward || value > (bestReward.value || 0)) {
          bestReward = {
            type: 'product',
            value,
            name: entry.reward.product.name,
          }
        }
      } else if (entry.reward.type === 'coins' && entry.reward.coins) {
        const value = entry.reward.coins
        if (!bestReward || value > (bestReward.value || 0)) {
          bestReward = {
            type: 'coins',
            value,
          }
        }
      }
    })
    
    // Finde beliebtesten Sack-Typ
    const sackTypeCounts: Record<string, number> = {}
    userHistory.forEach(entry => {
      sackTypeCounts[entry.sackType] = (sackTypeCounts[entry.sackType] || 0) + 1
    })
    const favoriteSackType = Object.entries(sackTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'bronze'
    
    userStatsMap.set(userId, {
      totalSacksOpened,
      totalSpent,
      totalCoinsSpent,
      totalMoneySpent,
      bestReward,
      totalProductsWon,
      totalCoinsWon,
      successRate,
      favoriteSackType,
    })
  })
  
  // Aktualisiere Cache
  statsCache = userStatsMap
  cacheTimestamp = now
  
  return userStatsMap
}

// Optimierte Funktion: Berechnet Stats für einen einzelnen User (mit Cache)
export const calculateUserStats = (userId: string): LeaderboardEntry['stats'] => {
  const allStats = calculateAllUserStats()
  return allStats.get(userId) || {
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
}

// Cache für Leaderboard-Einträge
let leaderboardCache: LeaderboardEntry[] | null = null
let leaderboardCacheCategory: string | null = null
let leaderboardCacheTimestamp = 0

export const getLeaderboard = (category: 'sacks' | 'spent' | 'products' | 'coins' | 'success' = 'sacks', currentUserId?: string): LeaderboardEntry[] => {
  const now = Date.now()
  
  // Verwende Cache wenn noch gültig und gleiche Kategorie
  if (leaderboardCache && leaderboardCacheCategory === category && (now - leaderboardCacheTimestamp) < CACHE_DURATION) {
    return leaderboardCache
  }
  
  // Berechne alle User-Stats auf einmal (optimiert)
  // Wenn currentUserId gesetzt ist, werden nur Einträge mit dieser User-ID gezählt
  // (verhindert, dass alte Einträge vom alten Account gezählt werden)
  // Für das Leaderboard zeigen wir trotzdem ALLE User, aber nur mit ihren eigenen Stats
  const allStats = calculateAllUserStats(currentUserId)
  
  // Lade alle registrierten User
  const allUsers = getAllUsers()
  
  // Lade aktuellen User für besseren Namen (falls vorhanden)
  let currentUser: { id: string; firstName: string; lastName: string; email: string } | null = null
  if (currentUserId) {
    currentUser = allUsers.find(u => u.id === currentUserId) || null
    // Falls nicht in allUsers, versuche aus localStorage zu laden
    if (!currentUser && typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('simexmafia-user')
        if (storedUser) {
          const parsed = JSON.parse(storedUser)
          if (parsed.id === currentUserId) {
            currentUser = {
              id: parsed.id,
              firstName: parsed.firstName || '',
              lastName: parsed.lastName || '',
              email: parsed.email || '',
            }
          }
        }
      } catch (error) {
        console.error('Error loading current user:', error)
      }
    }
  }
  
  // Erstelle Leaderboard-Einträge für alle User mit Stats
  const entries: LeaderboardEntry[] = []
  
  // Füge alle User mit Stats hinzu
  allUsers.forEach(user => {
    const stats = allStats.get(user.id)
    if (stats && stats.totalSacksOpened > 0) {
      entries.push({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`.trim() || user.email.split('@')[0],
        stats,
      })
    } else if (stats) {
      // Debug: User hat Stats, aber keine Säcke geöffnet
      console.log(`[Leaderboard] User ${user.id} has stats but no sacks opened:`, stats)
    }
  })
  
  // Füge auch User hinzu, die Stats haben, aber nicht in allUsers gefunden wurden
  allStats.forEach((stats, userId) => {
    if (userId !== 'unknown' && stats.totalSacksOpened > 0) {
      // Prüfe ob User bereits in entries ist
      if (!entries.some(e => e.userId === userId)) {
        // Versuche User-Info zu finden
        const user = allUsers.find(u => u.id === userId)
        if (user) {
          entries.push({
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`.trim() || user.email.split('@')[0],
            stats,
          })
        } else if (currentUser && userId === currentUserId) {
          // Verwende aktuellen User für besseren Namen
          entries.push({
            userId: currentUser.id,
            userName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email.split('@')[0],
            stats,
          })
        } else {
          // User nicht gefunden, aber Stats vorhanden - füge trotzdem hinzu
          // Versuche User-ID zu formatieren (entferne "user-" Präfix wenn vorhanden)
          const displayName = userId.startsWith('user-') 
            ? `User ${userId.replace('user-', '')}` 
            : `User ${userId}`
          entries.push({
            userId: userId,
            userName: displayName,
            stats,
          })
        }
      }
    }
  })
  
  // Debug: Zeige auch 'unknown' User, wenn vorhanden (für Entwicklung)
  const unknownStats = allStats.get('unknown')
  if (unknownStats && unknownStats.totalSacksOpened > 0) {
    console.log('[Leaderboard] Found entries for unknown user:', unknownStats)
    console.log('[Leaderboard] This means some sack history entries don\'t have a user ID')
  }
  
  // Debug: Zeige alle User-IDs die Stats haben
  console.log('[Leaderboard] Users with stats:', Array.from(allStats.keys()))
  console.log('[Leaderboard] Total entries created:', entries.length)
  console.log('[Leaderboard] Entry user IDs:', entries.map(e => e.userId))
  
  // Sortiere nach Kategorie
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
  
  // Aktualisiere Cache
  leaderboardCache = sorted
  leaderboardCacheCategory = category
  leaderboardCacheTimestamp = now
  
  return sorted
}

export const getUserRank = (userId: string, category: 'sacks' | 'spent' | 'products' | 'coins' | 'success' = 'sacks'): number => {
  if (!userId) return 0
  
  const leaderboard = getLeaderboard(category, userId)
  const index = leaderboard.findIndex(entry => entry.userId === userId)
  
  // Debug
  if (index === -1) {
    console.log(`[Leaderboard] User ${userId} not found in leaderboard. Total entries: ${leaderboard.length}`)
    // Prüfe ob User überhaupt Stats hat
    const stats = calculateUserStats(userId)
    if (stats.totalSacksOpened > 0) {
      console.log(`[Leaderboard] User has stats but not in leaderboard:`, stats)
    }
  }
  
  return index >= 0 ? index + 1 : leaderboard.length + 1
}

// Funktion zum Leeren des Caches (z.B. nach neuen Sack-Öffnungen)
export const clearLeaderboardCache = () => {
  statsCache.clear()
  leaderboardCache = null
  leaderboardCacheCategory = null
  cacheTimestamp = 0
  leaderboardCacheTimestamp = 0
}

// Funktion zum Migrieren alter Einträge ohne User-ID zum aktuellen User
export const migrateOldSackHistory = (currentUserId: string) => {
  try {
    if (typeof window === 'undefined' || !currentUserId) return
    
    const history = getSackHistory()
    let updated = false
    
    const migratedHistory = history.map(entry => {
      // Prüfe ob Eintrag keine User-ID hat (altes Format)
      const parts = entry.sackId.split('-')
      const hasTimestamp = parts.some(p => /^\d{13}$/.test(p))
      
      // Wenn kein Timestamp vorhanden oder Format nicht korrekt, ist es ein alter Eintrag
      // Füge User-ID hinzu, wenn noch nicht vorhanden
      if (!entry.sackId.includes(currentUserId)) {
        // Prüfe ob es bereits eine User-ID im Format hat
        const users = getAllUsers()
        let hasUserId = false
        for (const user of users) {
          if (entry.sackId.includes(user.id)) {
            hasUserId = true
            break
          }
        }
        
        if (!hasUserId) {
          // Migriere: Füge User-ID hinzu
          updated = true
          return {
            ...entry,
            sackId: `${entry.sackId}-${currentUserId}-migrated`,
          }
        }
      }
      
      return entry
    })
    
    if (updated) {
      localStorage.setItem('simexmafia-sack-history', JSON.stringify(migratedHistory))
      clearLeaderboardCache()
      console.log('[Leaderboard] Migrated old sack history entries to current user')
    }
  } catch (error) {
    console.error('Error migrating sack history:', error)
  }
}
