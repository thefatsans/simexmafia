import { verifySession, SESSION_COOKIE_NAME } from '@/lib/session-token'
import { isAdmin as isAdminByEmail } from '@/data/admin'
import { cookies } from 'next/headers'

export function getServerAdminSession() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value
  const payload = verifySession(token)
  if (!payload) return null
  if (!payload.isAdmin && !isAdminByEmail(payload.email)) {
    return null
  }
  return payload
}
