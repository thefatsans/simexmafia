import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { fetchDashboardStats } from '@/lib/admin/dashboard-stats'

const ADMIN_CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=30',
}

function startOf(daysAgo: number): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const since24h = startOf(1)
    const since7d = startOf(7)
    const since30d = startOf(30)

    const { stats, recentOrders } = await fetchDashboardStats(since24h, since7d, since30d)

    return NextResponse.json(
      {
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
        recentOrders,
        integrations: {
          resendConfigured: Boolean(process.env.RESEND_API_KEY),
          paypalConfigured: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
          stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
          turnstileConfigured: Boolean(process.env.TURNSTILE_SECRET_KEY),
          discordInvite: Boolean(process.env.DISCORD_INVITE_URL),
        },
      },
      { headers: ADMIN_CACHE_HEADERS }
    )
  } catch (err: unknown) {
    console.error('[Admin Dashboard] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to load dashboard', details: message },
      { status: 500 }
    )
  }
}
