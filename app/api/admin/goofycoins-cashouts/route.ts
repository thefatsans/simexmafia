import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'

const VALID_STATUS = new Set(['pending', 'completed', 'rejected', 'all'])

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const status = request.nextUrl.searchParams.get('status')?.trim() || 'pending'
    if (!VALID_STATUS.has(status)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 })
    }

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
      take: 200,
    })

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        userId: item.userId,
        variant: item.variant,
        coinsAmount: item.coinsAmount,
        euroAmount: item.euroAmount,
        status: item.status,
        fullName: item.fullName,
        email: item.email,
        phone: item.phone,
        iban: item.iban,
        address: item.address,
        notes: item.notes,
        adminNotes: item.adminNotes,
        processedAt: item.processedAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
        user: item.user
          ? {
              id: item.user.id,
              email: item.user.email,
              firstName: item.user.firstName,
              lastName: item.user.lastName,
            }
          : null,
      })),
      total: items.length,
    })
  } catch (error) {
    console.error('[Admin GoofyCoin Cashouts GET]', error)
    return NextResponse.json({ error: 'Umtausch-Anfragen konnten nicht geladen werden' }, { status: 500 })
  }
}
