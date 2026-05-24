// Client-side API functions for user operations
import type { User } from '@/types/user'
import { getAuthQueryParams } from '@/lib/api/auth-payload'

export async function syncUserToDatabaseAPI(
  user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'goofyCoins' | 'avatar'>
): Promise<any | null> {
  try {
    const response = await fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        goofyCoins: user.goofyCoins,
        avatar: user.avatar,
      }),
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error syncing user to database:', error)
    return null
  }
}

export async function getUserFromAPI(
  userId: string,
  profile?: Pick<User, 'email' | 'firstName' | 'lastName'>
): Promise<any> {
  try {
    const query = profile
      ? getAuthQueryParams({ id: userId, ...profile })
      : `userId=${encodeURIComponent(userId)}`
    const response = await fetch(`/api/users?${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching user from API:', error)
    throw error
  }
}

export async function getUserByEmailFromAPI(email: string): Promise<any> {
  try {
    const response = await fetch(`/api/users?email=${email}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching user from API:', error)
    throw error
  }
}

export async function updateUserAPI(userId: string, updates: {
  firstName?: string
  lastName?: string
  avatar?: string
  goofyCoins?: number
  totalSpent?: number
  tier?: string
}): Promise<any> {
  try {
    const response = await fetch('/api/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        id: userId,
        ...updates,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to update user')
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating user in API:', error)
    throw error
  }
}




