import { createHash, randomInt } from 'crypto'

const VERIFY_PEPPER = process.env.EMAIL_VERIFY_SECRET || 'simexmafia-email-verify'

export function generateVerificationCode(): string {
  return String(randomInt(100000, 1000000))
}

export function hashVerificationCode(code: string): string {
  const normalized = code.replace(/\D/g, '').trim()
  return createHash('sha256').update(`${VERIFY_PEPPER}:${normalized}`).digest('hex')
}

export function verificationExpiresAt(minutes = 15): Date {
  return new Date(Date.now() + minutes * 60 * 1000)
}

export function isVerificationCodeValid(
  inputCode: string,
  storedHash: string | null | undefined,
  expiresAt: Date | null | undefined
): boolean {
  if (!storedHash || !expiresAt) return false
  if (expiresAt.getTime() < Date.now()) return false
  const normalized = inputCode.replace(/\D/g, '').trim()
  if (normalized.length !== 6) return false
  return hashVerificationCode(normalized) === storedHash
}
