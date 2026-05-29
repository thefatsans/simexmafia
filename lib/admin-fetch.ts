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

const inflightGetRequests = new Map<string, Promise<Response>>()

export function adminFetch(
  path: string,
  user: Pick<User, 'id' | 'email'>,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const url = adminApiUrl(path, user)

  if (method === 'GET') {
    const existing = inflightGetRequests.get(url)
    if (existing) return existing
  }

  const request = fetch(url, {
    ...init,
    credentials: 'include',
    cache: method === 'GET' ? 'default' : 'no-store',
  }).finally(() => {
    if (method === 'GET') {
      inflightGetRequests.delete(url)
    }
  })

  if (method === 'GET') {
    inflightGetRequests.set(url, request)
  }

  return request
}
