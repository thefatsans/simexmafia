import { createHmac, timingSafeEqual } from 'crypto'

const DEFAULT_SECRET = 'simexmafia-dev-session-secret-change-in-production'
const SESSION_DEFAULT_DAYS = 30

export interface SessionPayload {
  userId: string
  email: string
  isAdmin?: boolean
  iat: number
  exp: number
}

function getSecret(): string {
  return process.env.SESSION_SECRET?.trim() || DEFAULT_SECRET
}

function base64UrlEncode(data: Buffer | string): string {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(data: string): Buffer {
  const pad = data.length % 4 === 0 ? '' : '='.repeat(4 - (data.length % 4))
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/') + pad
  return Buffer.from(normalized, 'base64')
}

function sign(payload: string): string {
  return base64UrlEncode(createHmac('sha256', getSecret()).update(payload).digest())
}

export interface SignSessionInput {
  userId: string
  email: string
  isAdmin?: boolean
  ttlDays?: number
}

export function signSession(input: SignSessionInput): string {
  const now = Math.floor(Date.now() / 1000)
  const ttlDays = input.ttlDays ?? SESSION_DEFAULT_DAYS
  const payload: SessionPayload = {
    userId: input.userId,
    email: input.email.toLowerCase(),
    isAdmin: input.isAdmin ?? false,
    iat: now,
    exp: now + ttlDays * 24 * 60 * 60,
  }
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload))
  const sig = sign(payloadEncoded)
  return `${payloadEncoded}.${sig}`
}

export function verifySession(token: string | null | undefined): SessionPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payloadEncoded, signature] = parts
  if (!payloadEncoded || !signature) return null

  const expected = sign(payloadEncoded)
  if (expected.length !== signature.length) return null

  let signaturesMatch: boolean
  try {
    signaturesMatch = timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(signature, 'utf8')
    )
  } catch {
    return null
  }
  if (!signaturesMatch) return null

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded).toString('utf8')) as SessionPayload
    if (!payload?.userId || !payload?.email || !payload?.exp) return null
    if (payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export const SESSION_COOKIE_NAME = 'sm_session'
export const SESSION_COOKIE_MAX_AGE_SECONDS = SESSION_DEFAULT_DAYS * 24 * 60 * 60
