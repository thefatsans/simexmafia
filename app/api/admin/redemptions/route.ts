import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'

const VALID_STATUS = new Set(['pending', 'fulfilled', 'all'])

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

    const where: Record<string, unknown> = {
      source: 'sack',
      isRedeemed: true,
    }

    if (status === 'pending') {
      where.redemptionStatus = 'pending'
    } else if (status === 'fulfilled') {
      where.redemptionStatus = 'fulfilled'
    } else {
      where.redemptionStatus = { in: ['pending', 'fulfilled'] }
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        product: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { redeemedAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        userId: item.userId,
        productId: item.productId,
        productName: item.product?.name ?? 'Unbekannt',
        productImage: item.product?.image ?? null,
        sourceId: item.sourceId,
        notes: item.notes,
        isRedeemed: item.isRedeemed,
        redeemedAt: item.redeemedAt?.toISOString() ?? null,
        redemptionCode: item.redemptionCode,
        redemptionStatus: item.redemptionStatus,
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
    console.error('[Admin Redemptions GET]', error)
    return NextResponse.json(
      { error: 'Einlöse-Anfragen konnten nicht geladen werden' },
      { status: 500 }
    )
  }
}
