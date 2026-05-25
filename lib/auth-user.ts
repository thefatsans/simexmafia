import type { User } from '@/types/user'

export function dbUserToClientUser(dbUser: {
  id: string
  email: string
  firstName: string
  lastName: string
  goofyCoins: number
  totalSpent: number
  tier: string
  joinDate?: Date | string | null
  avatar?: string | null
  emailVerified?: boolean
}): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    goofyCoins: dbUser.goofyCoins ?? 0,
    totalSpent: dbUser.totalSpent ?? 0,
    tier: (dbUser.tier as User['tier']) || 'Bronze',
    joinDate: dbUser.joinDate
      ? new Date(dbUser.joinDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    avatar: dbUser.avatar || undefined,
    emailVerified: dbUser.emailVerified ?? true,
  }
}

export const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  goofyCoins: true,
  totalSpent: true,
  tier: true,
  joinDate: true,
  avatar: true,
  isAdmin: true,
  emailVerified: true,
} as const
