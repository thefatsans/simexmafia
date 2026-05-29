import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSecureSession } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const authResult = await requireSecureSession(request)
  if (!authResult || authResult.error) {
    return authResult?.error || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const type = request.nextUrl.searchParams.get('type')?.trim() || 'received'

    if (type === 'sent') {
      const gifts = await prisma.sackGift.findMany({
        where: { senderId: authResult.user.id },
        include: {
          recipient: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })

      return NextResponse.json({
        gifts: gifts.map((g) => ({
          id: g.id,
          sackType: g.sackType,
          sackName: g.sackName,
          status: g.status,
          message: g.message,
          createdAt: g.createdAt.toISOString(),
          openedAt: g.openedAt?.toISOString() ?? null,
          recipient: g.recipient
            ? {
                email: g.recipient.email,
                name: `${g.recipient.firstName} ${g.recipient.lastName}`.trim(),
              }
            : null,
        })),
      })
    }

    const gifts = await prisma.sackGift.findMany({
      where: { recipientId: authResult.user.id, status: 'pending' },
      include: {
        sender: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      gifts: gifts.map((g) => ({
        id: g.id,
        sackType: g.sackType,
        sackName: g.sackName,
        status: g.status,
        message: g.message,
        createdAt: g.createdAt.toISOString(),
        sender: g.sender
          ? {
              email: g.sender.email,
              name: `${g.sender.firstName} ${g.sender.lastName}`.trim(),
            }
          : null,
      })),
    })
  } catch (error) {
    console.error('[Sacks Gifts GET]', error)
    return NextResponse.json({ error: 'Geschenke konnten nicht geladen werden' }, { status: 500 })
  }
}
