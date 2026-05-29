import { prisma } from '@/lib/prisma'
import { isAdmin as isAdminByEmail } from '@/data/admin'

export async function loadAdminUsers(options: { q?: string; limit?: number; skip?: number } = {}) {
  if (!prisma) {
    return { users: [], total: 0, limit: 0, skip: 0 }
  }

  const q = options.q?.trim() || ''
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100)
  const skip = Math.max(options.skip ?? 0, 0)

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' as const } },
          { firstName: { contains: q, mode: 'insensitive' as const } },
          { lastName: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        goofyCoins: true,
        totalSpent: true,
        tier: true,
        emailVerified: true,
        isAdmin: true,
        joinDate: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  const mapped = users.map(({ _count, createdAt, joinDate, ...u }) => ({
    ...u,
    isAdmin: u.isAdmin || isAdminByEmail(u.email),
    orderCount: _count.orders,
    createdAt: createdAt.toISOString(),
    joinDate: joinDate.toISOString(),
  }))

  return { users: mapped, total, limit, skip }
}
