import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const url = request.nextUrl
    const filter = url.searchParams.get('filter')?.trim() || 'all'

    const where: Record<string, unknown> = {}
    if (filter === 'active') where.active = true
    if (filter === 'inactive') where.active = false

    const subscribers = await prisma.newsletter.findMany({
      where,
      orderBy: { subscribedAt: 'desc' },
      take: 1000,
    })

    return NextResponse.json({
      subscribers: subscribers.map((s) => ({
        id: s.id,
        email: s.email,
        active: s.active,
        subscribedAt: s.subscribedAt.toISOString(),
        unsubscribedAt: s.unsubscribedAt ? s.unsubscribedAt.toISOString() : null,
      })),
      total: subscribers.length,
      activeCount: subscribers.filter((s) => s.active).length,
    })
  } catch (error) {
    console.error('[Admin Newsletter GET]', error)
    return NextResponse.json({ error: 'Subscribers konnten nicht geladen werden' }, { status: 500 })
  }
}
