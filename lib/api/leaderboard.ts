import type { LeaderboardCategory, LeaderboardEntry } from '@/lib/leaderboard/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export async function fetchLeaderboardFromAPI(
  category: LeaderboardCategory = 'sacks'
): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/leaderboard?category=${encodeURIComponent(category)}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return Array.isArray(data.entries) ? data.entries : []
  } catch (error) {
    console.warn('[Leaderboard] API fetch failed:', error)
    return []
  }
}
