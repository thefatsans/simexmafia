import { createHash } from 'crypto'

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export function isDatabaseConnectionError(error: unknown): boolean {
  const code = (error as { code?: string })?.code
  const message = String((error as { message?: string })?.message || error || '')
  return (
    code === 'ECONNREFUSED' ||
    code === 'P1001' ||
    code === 'P1002' ||
    code === 'P1017' ||
    code === 'ETIMEDOUT' ||
    code === 'XX000' ||
    message.includes('ENOTFOUND') ||
    message.includes('tenant/user') ||
    message.includes('connection')
  )
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false

  const hash = hashPassword(password)
  if (hash === storedHash) return true

  // Legacy: plain-text passwords from early localStorage migration
  if (storedHash === password) return true

  return false
}
