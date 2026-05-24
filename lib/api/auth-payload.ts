import type { User } from '@/types/user'

/** Payload sent to API routes so localStorage users can be synced to the database. */
export function getAuthPayload(user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'goofyCoins' | 'avatar'>) {
  return {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    goofyCoins: user.goofyCoins,
    avatar: user.avatar,
  }
}

export function getAuthQueryParams(user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>) {
  const params = new URLSearchParams({
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  })
  return params.toString()
}
