import { createHash, randomInt } from 'crypto'

const PEPPER = process.env.PASSWORD_RESET_SECRET || process.env.EMAIL_VERIFY_SECRET || 'simexmafia-password-reset'

export function generatePasswordResetCode(): string {
  return String(randomInt(100000, 1000000))
}

export function hashPasswordResetCode(code: string): string {
  const normalized = code.replace(/\D/g, '').trim()
  return createHash('sha256').update(`${PEPPER}:${normalized}`).digest('hex')
}

export function passwordResetExpiresAt(minutes = 30): Date {
  return new Date(Date.now() + minutes * 60 * 1000)
}

export function isPasswordResetCodeValid(
  inputCode: string,
  storedHash: string | null | undefined,
  expiresAt: Date | null | undefined
): boolean {
  if (!storedHash || !expiresAt) return false
  if (expiresAt.getTime() < Date.now()) return false
  const normalized = inputCode.replace(/\D/g, '').trim()
  if (normalized.length !== 6) return false
  return hashPasswordResetCode(normalized) === storedHash
}
