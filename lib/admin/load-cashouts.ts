import { prisma } from '@/lib/prisma'
import { mapCashoutForAdmin } from '@/lib/goofycoins/map-cashout'

export type AdminCashoutStatus = 'pending' | 'completed' | 'rejected' | 'all'

export async function loadAdminCashouts(
  status: AdminCashoutStatus = 'pending',
  limit = 200
) {
  if (!prisma) return []

  const where: Record<string, unknown> = {}
  if (status !== 'all') {
    where.status = status
  } else {
    where.status = { in: ['pending', 'completed', 'rejected'] }
  }

  const items = await prisma.goofyCoinCashout.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 200),
  })

  return items.map(mapCashoutForAdmin)
}
