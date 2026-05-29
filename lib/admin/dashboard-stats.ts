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

  const [statsRows, recentOrders] = await Promise.all([
    prisma.$queryRaw<DashboardStatsRow[]>(Prisma.sql`
      SELECT
        (SELECT COUNT(*)::int FROM "Order") AS total_orders,
        (SELECT COUNT(*)::int FROM "Order" WHERE status = 'pending') AS pending_orders,
        (SELECT COUNT(*)::int FROM "Order" WHERE status = 'completed') AS completed_orders,
        (SELECT COUNT(*)::int FROM "Order" WHERE "createdAt" >= ${since24h}) AS orders_24h,
        (SELECT COUNT(*)::int FROM "Order" WHERE "createdAt" >= ${since7d}) AS orders_7d,
        (SELECT COUNT(*)::int FROM "Order" WHERE "createdAt" >= ${since30d}) AS orders_30d,
        (SELECT COALESCE(SUM(total), 0)::float FROM "Order" WHERE status = 'completed') AS revenue_total,
        (SELECT COALESCE(SUM(total), 0)::float FROM "Order" WHERE status = 'completed' AND "completedAt" >= ${since30d}) AS revenue_30d,
        (SELECT COUNT(*)::int FROM "User" WHERE "createdAt" >= ${since24h}) AS users_24h,
        (SELECT COUNT(*)::int FROM "User" WHERE "createdAt" >= ${since7d}) AS users_7d,
        (SELECT COUNT(*)::int FROM "User" WHERE "createdAt" >= ${since30d}) AS users_30d,
        (SELECT COUNT(*)::int FROM "SackOpen" WHERE "createdAt" >= ${since24h}) AS sack_opens_24h,
        (SELECT COUNT(*)::int FROM "SackOpen" WHERE "createdAt" >= ${since7d}) AS sack_opens_7d,
        (SELECT COUNT(*)::int FROM "CoinTransaction" WHERE "createdAt" >= ${since24h}) AS coin_txs_24h,
        (SELECT COUNT(*)::int FROM "CoinTransaction" WHERE "createdAt" >= ${since7d}) AS coin_txs_7d,
        (SELECT COUNT(*)::int FROM "Product" WHERE name NOT LIKE '[ARCHIV]%') AS product_count,
        (SELECT COUNT(*)::int FROM "Seller") AS seller_count,
        (SELECT COUNT(*)::int FROM "InventoryItem" WHERE source = 'sack' AND "isRedeemed" = true AND "redemptionStatus" = 'pending') AS pending_redemptions,
        (SELECT COUNT(*)::int FROM "ContactRequest" WHERE status = 'pending') AS pending_contact_requests
    `),
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

  return { stats: statsRows[0], recentOrders }
}
