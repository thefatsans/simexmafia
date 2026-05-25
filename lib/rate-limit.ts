import { prisma } from '@/lib/prisma'

export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  if (!prisma) {
    return { allowed: true }
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + windowMs)

  try {
    const existing = await prisma.rateLimitEntry.findUnique({ where: { key } })

    if (!existing || existing.expiresAt.getTime() <= now.getTime()) {
      await prisma.rateLimitEntry.upsert({
        where: { key },
        create: { key, count: 1, expiresAt },
        update: { count: 1, expiresAt },
      })
      return { allowed: true }
    }

    if (existing.count >= maxAttempts) {
      const retryAfterSec = Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000)
      return { allowed: false, retryAfterSec: Math.max(1, retryAfterSec) }
    }

    await prisma.rateLimitEntry.update({
      where: { key },
      data: { count: existing.count + 1 },
    })

    return { allowed: true }
  } catch (error) {
    console.warn('[RateLimit] Fallback allow:', error)
    return { allowed: true }
  }
}
