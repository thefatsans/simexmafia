import { User } from '@/types/user'

/** Admin-API mit Session-Cookie und Legacy-Fallback (userId/email). */
export function adminApiUrl(path: string, user: Pick<User, 'id' | 'email'>): string {
  const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
  url.searchParams.set('userId', user.id)
  if (user.email) {
    url.searchParams.set('email', user.email)
  }
  return url.pathname + url.search
}

export function adminFetch(
  path: string,
  user: Pick<User, 'id' | 'email'>,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase()
  return fetch(adminApiUrl(path, user), {
    ...init,
    credentials: 'include',
    cache: method === 'GET' ? 'default' : 'no-store',
  })
}
