import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireResourceOwnership } from '@/lib/api-auth'

// GET /api/cart?userId=xxx - Warenkorb abrufen
export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({
        error: 'Database connection error',
        message: 'Please check DATABASE_URL and run migrations',
      }, { status: 503 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const authResult = await requireResourceOwnership(request, userId)
    if (authResult?.error) {
      return authResult.error
    }

    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: authResult.user.id },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(cartItems)
  } catch (error: any) {
    console.error('[Cart API] Error fetching cart:', error)
    return NextResponse.json({
      error: 'Failed to fetch cart',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }, { status: 500 })
  }
}

// POST /api/cart - Artikel zum Warenkorb hinzufügen
export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({
        error: 'Database connection error',
        message: 'Please check DATABASE_URL and run migrations',
      }, { status: 503 })
    }

    const body = await request.json()
    const { userId, productId, quantity = 1 } = body

    if (!userId || !productId) {
      return NextResponse.json({ error: 'userId and productId are required' }, { status: 400 })
    }

    const authResult = await requireResourceOwnership(request, userId, body)
    if (authResult?.error) {
      return authResult.error
    }

    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: authResult.user.id,
        productId,
      },
    })

    let cartItem
    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
        include: {
          product: {
            include: {
              seller: true,
            },
          },
        },
      })
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId: authResult.user.id,
          productId,
          quantity,
        },
        include: {
          product: {
            include: {
              seller: true,
            },
          },
        },
      })
    }

    return NextResponse.json(cartItem, { status: 201 })
  } catch (error: any) {
    console.error('[Cart API] Error adding to cart:', error)
    return NextResponse.json({
      error: 'Failed to add to cart',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }, { status: 500 })
  }
}

// DELETE /api/cart - Warenkorb leeren
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const authResult = await requireResourceOwnership(request, userId)
    if (authResult?.error) {
      return authResult.error
    }

    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await prisma.cartItem.deleteMany({
      where: { userId: authResult.user.id },
    })

    return NextResponse.json({ message: 'Cart cleared successfully' })
  } catch (error: any) {
    console.error('[Cart API] Error clearing cart:', error)
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 })
  }
}
