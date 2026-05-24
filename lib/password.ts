import { createHash } from 'crypto'

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false

  const hash = hashPassword(password)
  if (hash === storedHash) return true

  // Legacy: plain-text passwords from early localStorage migration
  if (storedHash === password) return true

  return false
}
