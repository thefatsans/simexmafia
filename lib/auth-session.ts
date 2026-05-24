import type { User, Tier } from '@/types/user'
import { calculateTier } from '@/types/user'
import CryptoJS from 'crypto-js'

interface StoredUser extends User {
  password: string
}

export function hashPasswordClient(password: string): string {
  return CryptoJS.SHA256(password).toString()
}

export function persistUserSession(user: User, passwordHash?: string): void {
  if (typeof window === 'undefined') return

  localStorage.setItem('simexmafia-user', JSON.stringify(user))

  const usersJson = localStorage.getItem('simexmafia-users')
  const users: StoredUser[] = usersJson ? JSON.parse(usersJson) : []
  const emailLower = user.email.toLowerCase()
  const index = users.findIndex((u) => u.email.toLowerCase() === emailLower)

  const storedEntry: StoredUser = {
    ...user,
    password: passwordHash || (index >= 0 ? users[index].password : ''),
  }

  if (index >= 0) {
    users[index] = { ...users[index], ...storedEntry }
  } else {
    users.push(storedEntry)
  }

  localStorage.setItem('simexmafia-users', JSON.stringify(users))
}

export function findLocalUser(
  email: string,
  password: string
): StoredUser | null {
  if (typeof window === 'undefined') return null

  const usersJson = localStorage.getItem('simexmafia-users')
  if (!usersJson) return null

  const users: StoredUser[] = JSON.parse(usersJson)
  const foundUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!foundUser) return null

  const passwordHash = hashPasswordClient(password)
  if (foundUser.password !== passwordHash && foundUser.password !== password) {
    return null
  }

  return foundUser
}

export function tryLocalLogin(
  email: string,
  password: string
): { success: boolean; user?: User; error?: string } {
  const foundUser = findLocalUser(email, password)
  if (!foundUser) {
    return { success: false, error: 'Ungültige E-Mail oder Passwort' }
  }

  const passwordHash = hashPasswordClient(password)
  if (foundUser.password === password && password.length < 64) {
    foundUser.password = passwordHash
    persistUserSession(
      {
        id: foundUser.id,
        email: foundUser.email,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        goofyCoins: foundUser.goofyCoins,
        totalSpent: foundUser.totalSpent,
        tier: foundUser.tier,
        joinDate: foundUser.joinDate,
        avatar: foundUser.avatar,
      },
      passwordHash
    )
  }

  const { password: _, ...userData } = foundUser
  persistUserSession(userData as User, passwordHash)
  return { success: true, user: userData as User }
}

export function registerLocal(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): { success: boolean; user?: User; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Registrierung nicht verfügbar' }
  }

  const normalizedEmail = email.trim().toLowerCase()
  const usersJson = localStorage.getItem('simexmafia-users')
  const users: StoredUser[] = usersJson ? JSON.parse(usersJson) : []

  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return {
      success: false,
      error: 'Diese E-Mail ist bereits registriert. Bitte melden Sie sich an.',
    }
  }

  const passwordHash = hashPasswordClient(password)
  const newUser: StoredUser = {
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    password: passwordHash,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    goofyCoins: 100,
    totalSpent: 0,
    tier: calculateTier(100) as Tier,
    joinDate: new Date().toISOString().split('T')[0],
  }

  users.push(newUser)
  localStorage.setItem('simexmafia-users', JSON.stringify(users))

  const { password: _, ...userData } = newUser
  persistUserSession(userData as User, passwordHash)
  return { success: true, user: userData as User }
}

/** Sync local user to DB in background (non-blocking). */
export async function syncLocalUserToDatabase(user: User, password?: string): Promise<void> {
  try {
    const { syncUserToDatabaseAPI } = await import('@/lib/api/users')
    await syncUserToDatabaseAPI(user)
    if (password) {
      const { migratePasswordAPI } = await import('@/lib/api/auth')
      await migratePasswordAPI(user.email, password)
    }
  } catch {
    // ignore – local session remains valid
  }
}
