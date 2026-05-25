import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'

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

    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      orders24h,
      orders7d,
      orders30d,
      revenueAgg,
      revenue30Agg,
      newUsers24h,
      newUsers7d,
      newUsers30d,
      sackOpens24h,
      sackOpens7d,
      coinTxs24h,
      coinTxs7d,
      productCount,
      sellerCount,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'completed' } }),
      prisma.order.count({ where: { createdAt: { gte: since24h } } }),
      prisma.order.count({ where: { createdAt: { gte: since7d } } }),
      prisma.order.count({ where: { createdAt: { gte: since30d } } }),
      prisma.order.aggregate({
        where: { status: 'completed' },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { status: 'completed', completedAt: { gte: since30d } },
        _sum: { total: true },
      }),
      prisma.user.count({ where: { createdAt: { gte: since24h } } }),
      prisma.user.count({ where: { createdAt: { gte: since7d } } }),
      prisma.user.count({ where: { createdAt: { gte: since30d } } }),
      prisma.sackOpen.count({ where: { createdAt: { gte: since24h } } }),
      prisma.sackOpen.count({ where: { createdAt: { gte: since7d } } }),
      prisma.coinTransaction.count({ where: { createdAt: { gte: since24h } } }),
      prisma.coinTransaction.count({ where: { createdAt: { gte: since7d } } }),
      prisma.product.count(),
      prisma.seller.count(),
    ])

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
        last24h: orders24h,
        last7d: orders7d,
        last30d: orders30d,
      },
      revenue: {
        total: revenueAgg._sum.total ?? 0,
        last30d: revenue30Agg._sum.total ?? 0,
      },
      users: {
        new24h: newUsers24h,
        new7d: newUsers7d,
        new30d: newUsers30d,
      },
      sackOpens: {
        last24h: sackOpens24h,
        last7d: sackOpens7d,
      },
      coinTransactions: {
        last24h: coinTxs24h,
        last7d: coinTxs7d,
      },
      catalog: {
        products: productCount,
        sellers: sellerCount,
      },
      integrations: {
        resendConfigured: Boolean(process.env.RESEND_API_KEY),
        paypalConfigured: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
        stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
        turnstileConfigured: Boolean(process.env.TURNSTILE_SECRET_KEY),
        discordInvite: Boolean(process.env.DISCORD_INVITE_URL),
      },
    })
  } catch (err: any) {
    console.error('[Admin Dashboard] Error:', err)
    return NextResponse.json(
      { error: 'Failed to load dashboard', details: err?.message },
      { status: 500 }
    )
  }
}
