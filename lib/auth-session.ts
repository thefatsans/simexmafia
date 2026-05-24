import type { User } from '@/types/user'
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
