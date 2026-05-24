import { SackHistoryEntry, getSackHistory } from './sackHistory'
import { fetchLeaderboardFromAPI } from '@/lib/api/leaderboard'
import {
  buildLeaderboardEntries,
  buildStatsFromSackOpens,
  getUserRankInEntries,
  sortLeaderboard,
} from '@/lib/leaderboard/aggregate'
import type { LeaderboardCategory, LeaderboardEntry } from '@/lib/leaderboard/types'
import { EMPTY_LEADERBOARD_STATS } from '@/lib/leaderboard/types'

export type { LeaderboardCategory, LeaderboardEntry }

const getAllUsers = (): Array<{
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  totalSpent?: number
}> => {
  try {
    if (typeof window === 'undefined') return []

    const users: Array<{
      id: string
      firstName: string
      lastName: string
      email: string
      avatar?: string
      totalSpent?: number
    }> = []

    const usersJson = localStorage.getItem('simexmafia-users')
    if (usersJson) {
      const parsed = JSON.parse(usersJson)
      if (Array.isArray(parsed)) {
        for (const u of parsed) {
          if (u?.id) {
            users.push({
              id: u.id,
              firstName: u.firstName || '',
              lastName: u.lastName || '',
              email: u.email || '',
              avatar: u.avatar,
              totalSpent: u.totalSpent,
            })
          }
        }
      }
    }

    const sessionUser = localStorage.getItem('simexmafia-user')
    if (sessionUser) {
      const parsed = JSON.parse(sessionUser)
      if (parsed?.id && !users.some((u) => u.id === parsed.id)) {
        users.push({
          id: parsed.id,
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          email: parsed.email || '',
          avatar: parsed.avatar,
          totalSpent: parsed.totalSpent,
        })
      }
    }

    return users
  } catch (error) {
    console.error('[Leaderboard] Error loading users:', error)
    return []
  }
}

function extractUserIdFromSackId(sackId: string, knownUserIds: Set<string>): string {
  for (const id of knownUserIds) {
    if (sackId.includes(`-${id}-`)) return id
  }

  const userPattern = sackId.match(/-user-([^-]+)-\d{13}/)
  if (userPattern?.[1] && knownUserIds.has(userPattern[1])) {
    return userPattern[1]
  }

  return ''
}

function historyEntryToOpenRow(entry: SackHistoryEntry, userId: string) {
  return {
    userId,
    sackType: entry.sackType,
    purchaseMethod: entry.purchaseMethod,
    pricePaid: entry.pricePaid,
    rewardType: entry.reward.type,
    rewardCoins: entry.reward.type === 'coins' ? entry.reward.coins ?? 0 : null,
    rewardProductName:
      entry.reward.type === 'product' ? entry.reward.product?.name ?? null : null,
    rewardProductPrice:
      entry.reward.type === 'product' ? entry.reward.product?.price ?? null : null,
  }
}

function buildLocalLeaderboard(category: LeaderboardCategory): LeaderboardEntry[] {
  const users = getAllUsers()
  const userIds = new Set(users.map((u) => u.id))
  const history = getSackHistory()
  const opensByUser = new Map<string, ReturnType<typeof historyEntryToOpenRow>[]>()

  for (const entry of history) {
    const userId =
      entry.userId ||
      extractUserIdFromSackId(entry.sackId, userIds) ||
      (users.length === 1 ? users[0].id : '')

    if (!userId) continue

    const list = opensByUser.get(userId) || []
    list.push(historyEntryToOpenRow(entry, userId))
    opensByUser.set(userId, list)
  }

  const userRows = users.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    avatar: u.avatar ?? null,
    totalSpent: u.totalSpent ?? 0,
  }))

  if (userRows.length === 0 && opensByUser.size > 0) {
    for (const [userId, opens] of opensByUser.entries()) {
      userRows.push({
        id: userId,
        firstName: 'Spieler',
        lastName: '',
        email: `${userId}@local`,
        avatar: null,
        totalSpent: 0,
      })
    }
  }

  return sortLeaderboard(buildLeaderboardEntries(userRows, opensByUser), category)
}

let leaderboardCache: LeaderboardEntry[] | null = null
let leaderboardCacheCategory: LeaderboardCategory | null = null
let leaderboardCacheTimestamp = 0
const CACHE_DURATION = 3000

export const clearLeaderboardCache = () => {
  leaderboardCache = null
  leaderboardCacheCategory = null
  leaderboardCacheTimestamp = 0
}

export async function getLeaderboardAsync(
  category: LeaderboardCategory = 'sacks'
): Promise<LeaderboardEntry[]> {
  const apiEntries = await fetchLeaderboardFromAPI(category)
  if (apiEntries.length > 0) {
    return apiEntries
  }
  return buildLocalLeaderboard(category)
}

export const getLeaderboard = (
  category: LeaderboardCategory = 'sacks',
  _currentUserId?: string
): LeaderboardEntry[] => {
  const now = Date.now()

  if (
    leaderboardCache &&
    leaderboardCacheCategory === category &&
    now - leaderboardCacheTimestamp < CACHE_DURATION
  ) {
    return leaderboardCache
  }

  const entries = buildLocalLeaderboard(category)
  leaderboardCache = entries
  leaderboardCacheCategory = category
  leaderboardCacheTimestamp = now
  return entries
}

export const calculateUserStats = (userId: string) => {
  const entries = getLeaderboard('sacks')
  const entry = entries.find((e) => e.userId === userId)
  return entry?.stats ?? { ...EMPTY_LEADERBOARD_STATS }
}

export const getUserRank = (
  userId: string,
  category: LeaderboardCategory = 'sacks'
): number => {
  const leaderboard = getLeaderboard(category)
  return getUserRankInEntries(leaderboard, userId)
}

export async function getUserRankAsync(
  userId: string,
  category: LeaderboardCategory = 'sacks'
): Promise<number> {
  const leaderboard = await getLeaderboardAsync(category)
  return getUserRankInEntries(leaderboard, userId)
}

export const migrateOldSackHistory = (currentUserId: string) => {
  try {
    if (typeof window === 'undefined' || !currentUserId) return

    const history = getSackHistory()
    let updated = false

    const migratedHistory = history.map((entry) => {
      if (entry.userId === currentUserId) return entry

      const knownIds = new Set(getAllUsers().map((u) => u.id))
      const extracted = extractUserIdFromSackId(entry.sackId, knownIds)

      if (extracted === currentUserId) {
        updated = true
        return { ...entry, userId: currentUserId }
      }

      if (!entry.userId && !extracted) {
        updated = true
        return {
          ...entry,
          userId: currentUserId,
          sackId: `${entry.sackId}-${currentUserId}-migrated`,
        }
      }

      return entry
    })

    if (updated) {
      localStorage.setItem('simexmafia-sack-history', JSON.stringify(migratedHistory))
      clearLeaderboardCache()
    }
  } catch (error) {
    console.error('[Leaderboard] Migration error:', error)
  }
}

// Legacy export for tests
export { buildStatsFromSackOpens }
