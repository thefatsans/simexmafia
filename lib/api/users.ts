// Client-side API functions for user operations

export async function getUserFromAPI(userId: string): Promise<any> {
  try {
    const response = await fetch(`/api/users?id=${userId}`, {
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



