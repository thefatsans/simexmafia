import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type DashboardStatsRow = {
  total_orders: number
  pending_orders: number
  completed_orders: number
  orders_24h: number
  orders_7d: number
  orders_30d: number
  revenue_total: number | null
  revenue_30d: number | null
  users_24h: number
  users_7d: number
  users_30d: number
  sack_opens_24h: number
  sack_opens_7d: number
  coin_txs_24h: number
  coin_txs_7d: number
  product_count: number
  seller_count: number
  pending_redemptions: number
  pending_contact_requests: number
}

export async function fetchDashboardStats(since24h: Date, since7d: Date, since30d: Date) {
  if (!prisma) {
    throw new Error('Database not available')
  }

  const [
    orderStatsRows,
    userStatsRows,
    sackStatsRows,
    coinStatsRows,
    productCount,
    sellerCount,
    pendingRedemptions,
    pendingContactRequests,
    recentOrders,
  ] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        total_orders: number
        pending_orders: number
        completed_orders: number
        orders_24h: number
        orders_7d: number
        orders_30d: number
        revenue_total: number | null
        revenue_30d: number | null
      }>
    >(Prisma.sql`
      SELECT
        COUNT(*)::int AS total_orders,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_orders,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_orders,
        COUNT(*) FILTER (WHERE "createdAt" >= ${since24h})::int AS orders_24h,
        COUNT(*) FILTER (WHERE "createdAt" >= ${since7d})::int AS orders_7d,
        COUNT(*) FILTER (WHERE "createdAt" >= ${since30d})::int AS orders_30d,
        COALESCE(SUM(total) FILTER (WHERE status = 'completed'), 0)::float AS revenue_total,
        COALESCE(SUM(total) FILTER (WHERE status = 'completed' AND "completedAt" >= ${since30d}), 0)::float AS revenue_30d
      FROM "Order"
    `),
    prisma.$queryRaw<
      Array<{ users_24h: number; users_7d: number; users_30d: number }>
    >(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE "createdAt" >= ${since24h})::int AS users_24h,
        COUNT(*) FILTER (WHERE "createdAt" >= ${since7d})::int AS users_7d,
        COUNT(*) FILTER (WHERE "createdAt" >= ${since30d})::int AS users_30d
      FROM "User"
    `),
    prisma.$queryRaw<Array<{ sack_opens_24h: number; sack_opens_7d: number }>>(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE "createdAt" >= ${since24h})::int AS sack_opens_24h,
        COUNT(*) FILTER (WHERE "createdAt" >= ${since7d})::int AS sack_opens_7d
      FROM "SackOpen"
    `),
    prisma.$queryRaw<Array<{ coin_txs_24h: number; coin_txs_7d: number }>>(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE "createdAt" >= ${since24h})::int AS coin_txs_24h,
        COUNT(*) FILTER (WHERE "createdAt" >= ${since7d})::int AS coin_txs_7d
      FROM "CoinTransaction"
    `),
    prisma.product.count({ where: { NOT: { name: { startsWith: '[ARCHIV]' } } } }),
    prisma.seller.count(),
    prisma.inventoryItem.count({
      where: { source: 'sack', isRedeemed: true, redemptionStatus: 'pending' },
    }),
    prisma.contactRequest.count({ where: { status: 'pending' } }),
    prisma.order.findMany({
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ])

  const stats: DashboardStatsRow = {
    ...orderStatsRows[0],
    ...userStatsRows[0],
    ...sackStatsRows[0],
    ...coinStatsRows[0],
    product_count: productCount,
    seller_count: sellerCount,
    pending_redemptions: pendingRedemptions,
    pending_contact_requests: pendingContactRequests,
  }

  return { stats, recentOrders }
}
