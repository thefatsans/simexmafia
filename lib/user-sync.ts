import { prisma } from '@/lib/prisma'
import { isAdmin as isAdminByEmail } from '@/data/admin'

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isAdmin: true,
  goofyCoins: true,
  totalSpent: true,
  tier: true,
} as const

export type AuthUserProfile = {
  userId?: string | null
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  goofyCoins?: number
  avatar?: string | null
}

export type SyncedUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  isAdmin: boolean
  goofyCoins: number
  totalSpent: number
  tier: string
}

function withAdminFlag(user: {
  id: string
  email: string
  firstName: string
  lastName: string
  isAdmin: boolean
  goofyCoins: number
  totalSpent: number
  tier: string
}): SyncedUser {
  return {
    ...user,
    isAdmin: user.isAdmin || isAdminByEmail(user.email),
  }
}

/**
 * Finds or creates a user in the database so API auth works for localStorage users.
 */
export async function ensureUserInDatabase(
  profile: AuthUserProfile
): Promise<SyncedUser | null> {
  if (!prisma) return null

  const userId = profile.userId?.trim() || null
  const email = profile.email?.trim().toLowerCase() || null
  const firstName = profile.firstName?.trim() || null
  const lastName = profile.lastName?.trim() || null

  if (userId) {
    const byId = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    })
    if (byId) return withAdminFlag(byId)
  }

  if (email) {
    const byEmail = await prisma.user.findUnique({
      where: { email },
      select: userSelect,
    })
    if (byEmail) return withAdminFlag(byEmail)
  }

  if (!userId || !email || !firstName || !lastName) {
    return null
  }

  const isAdmin = isAdminByEmail(email)

  try {
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        firstName,
        lastName,
        avatar: profile.avatar || null,
        goofyCoins: profile.goofyCoins ?? 0,
        totalSpent: 0,
        tier: 'Bronze',
        isAdmin,
      },
      select: userSelect,
    })

    return withAdminFlag(user)
  } catch (error: unknown) {
    // Race: user was created between lookup and create
    if ((error as { code?: string })?.code === 'P2002' && email) {
      const existing = await prisma.user.findUnique({
        where: { email },
        select: userSelect,
      })
      if (existing) return withAdminFlag(existing)
    }
    throw error
  }
}
