import { prisma } from '@/lib/prisma'
import { mapCashoutForUser } from '@/lib/goofycoins/map-cashout'

export async function loadUserCashouts(userId: string, limit = 50) {
  if (!prisma || !userId) return []

  const items = await prisma.goofyCoinCashout.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 50),
  })

  return items.map(mapCashoutForUser)
}
