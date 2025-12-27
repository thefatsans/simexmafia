import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/orders - Bestellungen abrufen
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    const where: any = {}
    if (userId) where.userId = userId
    if (status) where.status = status

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// POST /api/orders - Neue Bestellung erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      items,
      subtotal,
      serviceFee,
      discount,
      total,
      paymentMethod,
      coinsEarned,
      discountCode,
    } = body

    // Validierung
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Erstelle Bestellung mit Items
    const order = await prisma.order.create({
      data: {
        userId,
        subtotal: parseFloat(subtotal),
        serviceFee: parseFloat(serviceFee || 0.99),
        discount: parseFloat(discount || 0),
        total: parseFloat(total),
        paymentMethod: paymentMethod || 'credit-card',
        coinsEarned: coinsEarned ? parseInt(coinsEarned) : 0,
        discountCode: discountCode || null,
        status: 'pending',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || item.id,
            type: item.type || 'product',
            name: item.name,
            price: parseFloat(item.price),
            quantity: parseInt(item.quantity || 1),
            metadata: item.metadata || null,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Update User: GoofyCoins und totalSpent
    if (coinsEarned > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          goofyCoins: {
            increment: coinsEarned,
          },
          totalSpent: {
            increment: parseFloat(total),
          },
        },
      })

      // Erstelle Coin Transaction
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user) {
        await prisma.coinTransaction.create({
          data: {
            userId,
            type: 'earned',
            amount: coinsEarned,
            balance: user.goofyCoins + coinsEarned,
            description: `Earned from order ${order.id}`,
            orderId: order.id,
          },
        })
      }
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}





