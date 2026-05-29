import { fetchDashboardStats } from '@/lib/admin/dashboard-stats'

export interface AdminDashboardData {
  generatedAt: string
  orders: {
    total: number
    pending: number
    completed: number
    last24h: number
    last7d: number
    last30d: number
  }
  revenue: { total: number; last30d: number }
  users: { new24h: number; new7d: number; new30d: number }
  sackOpens: { last24h: number; last7d: number }
  coinTransactions: { last24h: number; last7d: number }
  catalog: { products: number; sellers: number }
  redemptions: { pending: number }
  contactRequests: { pending: number }
  recentOrders: Array<{
    id: string
    total: number
    status: string
    createdAt: string
  }>
  integrations: {
    resendConfigured: boolean
    paypalConfigured: boolean
    stripeConfigured: boolean
    turnstileConfigured: boolean
    discordInvite: boolean
  }
}

const DASHBOARD_CACHE_MS = 30_000
let dashboardCache: { data: AdminDashboardData; ts: number } | null = null

function startOf(daysAgo: number): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d
}

export async function loadAdminDashboardData(): Promise<AdminDashboardData> {
  if (dashboardCache && Date.now() - dashboardCache.ts < DASHBOARD_CACHE_MS) {
    return dashboardCache.data
  }

  const since24h = startOf(1)
  const since7d = startOf(7)
  const since30d = startOf(30)

  const { stats, recentOrders } = await fetchDashboardStats(since24h, since7d, since30d)

  const payload: AdminDashboardData = {
    generatedAt: new Date().toISOString(),
    orders: {
      total: stats.total_orders,
      pending: stats.pending_orders,
      completed: stats.completed_orders,
      last24h: stats.orders_24h,
      last7d: stats.orders_7d,
      last30d: stats.orders_30d,
    },
    revenue: {
      total: stats.revenue_total ?? 0,
      last30d: stats.revenue_30d ?? 0,
    },
    users: {
      new24h: stats.users_24h,
      new7d: stats.users_7d,
      new30d: stats.users_30d,
    },
    sackOpens: {
      last24h: stats.sack_opens_24h,
      last7d: stats.sack_opens_7d,
    },
    coinTransactions: {
      last24h: stats.coin_txs_24h,
      last7d: stats.coin_txs_7d,
    },
    catalog: {
      products: stats.product_count,
      sellers: stats.seller_count,
    },
    redemptions: {
      pending: stats.pending_redemptions,
    },
    contactRequests: {
      pending: stats.pending_contact_requests,
    },
    recentOrders: recentOrders.map((order) => ({
      ...order,
      createdAt:
        order.createdAt instanceof Date
          ? order.createdAt.toISOString()
          : String(order.createdAt),
    })),
    integrations: {
      resendConfigured: Boolean(process.env.RESEND_API_KEY),
      paypalConfigured: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      turnstileConfigured: Boolean(process.env.TURNSTILE_SECRET_KEY),
      discordInvite: Boolean(process.env.DISCORD_INVITE_URL),
    },
  }

  dashboardCache = { data: payload, ts: Date.now() }
  return payload
}
