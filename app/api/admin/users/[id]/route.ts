import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { isAdmin as isAdminByEmail } from '@/data/admin'

// GET single user with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!prisma) return NextResponse.json({ error: 'Database not available' }, { status: 503 })

  try {
    const { id } = await params
    const u = await prisma.user.findUnique({
      where: { id },
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
        avatar: true,
        joinDate: true,
        createdAt: true,
        updatedAt: true,
        referralCode: true,
        _count: { select: { orders: true, reviews: true, inventoryItems: true } },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            total: true,
            status: true,
            paymentMethod: true,
            discountCode: true,
            createdAt: true,
          },
        },
      },
    })

    if (!u) return NextResponse.json({ error: 'User nicht gefunden.' }, { status: 404 })

    const { _count, orders, ...rest } = u
    return NextResponse.json({
      user: {
        ...rest,
        isAdmin: rest.isAdmin || isAdminByEmail(rest.email),
        orderCount: _count.orders,
        reviewCount: _count.reviews,
        inventoryCount: _count.inventoryItems,
        recentOrders: orders.map((o) => ({
          ...o,
          total: Number(o.total),
          createdAt: o.createdAt.toISOString(),
        })),
        createdAt: rest.createdAt.toISOString(),
        updatedAt: rest.updatedAt.toISOString(),
        joinDate: rest.joinDate.toISOString(),
      },
    })
  } catch (error) {
    console.error('[Admin User GET]', error)
    return NextResponse.json({ error: 'Abfrage fehlgeschlagen' }, { status: 500 })
  }
}

// PATCH – update editable fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!prisma) return NextResponse.json({ error: 'Database not available' }, { status: 503 })

  try {
    const { id } = await params
    const body = await request.json()

    // Prevent editing yourself as admin
    if (auth.user?.id === id && typeof body.isAdmin === 'boolean' && !body.isAdmin) {
      return NextResponse.json(
        { error: 'Du kannst dir selbst nicht die Admin-Rechte entziehen.' },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (typeof body.firstName === 'string' && body.firstName.trim()) {
      data.firstName = body.firstName.trim()
    }
    if (typeof body.lastName === 'string' && body.lastName.trim()) {
      data.lastName = body.lastName.trim()
    }
    if (typeof body.isAdmin === 'boolean') data.isAdmin = body.isAdmin
    if (typeof body.emailVerified === 'boolean') data.emailVerified = body.emailVerified
    if (typeof body.goofyCoins === 'number' && body.goofyCoins >= 0) {
      data.goofyCoins = Math.round(body.goofyCoins)
    }
    if (typeof body.tier === 'string' && ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].includes(body.tier)) {
      data.tier = body.tier
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nichts zu aktualisieren.' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
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
        createdAt: true,
        _count: { select: { orders: true } },
      },
    })

    const { _count, ...rest } = updated
    return NextResponse.json({
      user: {
        ...rest,
        isAdmin: rest.isAdmin || isAdminByEmail(rest.email),
        orderCount: _count.orders,
        createdAt: rest.createdAt.toISOString(),
      },
    })
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'User nicht gefunden.' }, { status: 404 })
    }
    console.error('[Admin User PATCH]', error)
    return NextResponse.json({ error: 'Update fehlgeschlagen' }, { status: 500 })
  }
}

// DELETE user and all related data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!prisma) return NextResponse.json({ error: 'Database not available' }, { status: 503 })

  try {
    const { id } = await params

    if (auth.user?.id === id) {
      return NextResponse.json(
        { error: 'Du kannst deinen eigenen Account nicht löschen.' },
        { status: 400 }
      )
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { email: true, isAdmin: true },
    })
    if (!target) {
      return NextResponse.json({ error: 'User nicht gefunden.' }, { status: 404 })
    }
    if (target.isAdmin || isAdminByEmail(target.email)) {
      return NextResponse.json(
        { error: 'Admin-Accounts können nicht gelöscht werden.' },
        { status: 403 }
      )
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'User nicht gefunden.' }, { status: 404 })
    }
    console.error('[Admin User DELETE]', error)
    return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })
  }
}
