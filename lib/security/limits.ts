import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-ip'
import type { NextRequest } from 'next/server'

/** Registrierungen pro IP pro Stunde */
export const REGISTER_HOURLY_LIMIT = 5
/** Registrierungen pro IP pro Tag */
export const REGISTER_DAILY_LIMIT = 3

export const MS_HOUR = 60 * 60 * 1000
export const MS_DAY = 24 * MS_HOUR

export function todayUtcKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function assertRegistrationAllowed(request: NextRequest): Promise<{
  allowed: boolean
  error?: string
}> {
  const ip = getClientIp(request)

  const hourly = await checkRateLimit(
    `register:ip:${ip}:hour`,
    REGISTER_HOURLY_LIMIT,
    MS_HOUR
  )
  if (!hourly.allowed) {
    return {
      allowed: false,
      error: 'Zu viele Registrierungen von dieser Verbindung. Bitte in einer Stunde erneut versuchen.',
    }
  }

  const daily = await checkRateLimit(
    `register:ip:${ip}:day:${todayUtcKey()}`,
    REGISTER_DAILY_LIMIT,
    MS_DAY
  )
  if (!daily.allowed) {
    return {
      allowed: false,
      error: `Tageslimit erreicht (max. ${REGISTER_DAILY_LIMIT} Registrierungen pro Tag). Bitte morgen erneut versuchen.`,
    }
  }

  return { allowed: true }
}

export async function assertDailyRewardClaimAllowed(userId: string): Promise<{
  allowed: boolean
  error?: string
}> {
  const limit = await checkRateLimit(
    `daily-reward:user:${userId}:${todayUtcKey()}`,
    1,
    MS_DAY
  )
  if (!limit.allowed) {
    return { allowed: false, error: 'Daily reward already claimed today' }
  }
  return { allowed: true }
}

export const MAX_PENDING_CASHOUTS = 2
