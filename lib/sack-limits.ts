import { prisma } from '@/lib/prisma'

/** Max. Sack-Öffnungen pro Tag und verifiziertem Konto (GoofyCoins) */
export const MAX_SACK_OPENS_PER_DAY = 12

export function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function assertSackOpenAllowed(userId: string): Promise<{
  allowed: boolean
  remaining?: number
  error?: string
}> {
  if (!prisma) {
    return { allowed: false, error: 'Datenbank nicht verfügbar' }
  }

  const today = todayDateKey()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerified: true,
      sackOpensDayCount: true,
      sackOpensDayDate: true,
    },
  })

  if (!user) {
    return { allowed: false, error: 'Benutzer nicht gefunden' }
  }

  if (!user.emailVerified) {
    return {
      allowed: false,
      error: 'Bitte bestätige zuerst deine E-Mail-Adresse, um Säcke zu öffnen.',
    }
  }

  const count = user.sackOpensDayDate === today ? user.sackOpensDayCount : 0

  if (count >= MAX_SACK_OPENS_PER_DAY) {
    return {
      allowed: false,
      error: `Tageslimit erreicht (max. ${MAX_SACK_OPENS_PER_DAY} Säcke pro Tag). Morgen geht es weiter.`,
    }
  }

  return {
    allowed: true,
    remaining: MAX_SACK_OPENS_PER_DAY - count,
  }
}

export async function recordSackOpenDayCount(userId: string): Promise<void> {
  if (!prisma) return

  const today = todayDateKey()
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sackOpensDayCount: true, sackOpensDayDate: true },
  })
  if (!user) return

  const count = user.sackOpensDayDate === today ? user.sackOpensDayCount + 1 : 1

  await prisma.user.update({
    where: { id: userId },
    data: {
      sackOpensDayCount: count,
      sackOpensDayDate: today,
    },
  })
}
