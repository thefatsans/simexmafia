import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/cart?userId=xxx - Warenkorb abrufen
export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      console.error('[Cart API] Prisma not available for GET request')
      return NextResponse.json({ 
        error: 'Database connection error',
        message: 'Please check DATABASE_URL and run migrations'
      }, { status: 503 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('[Cart API] Fetching cart for user:', userId)

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
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

    console.log('[Cart API] Found cart items:', cartItems.length)
    return NextResponse.json(cartItems)
  } catch (error: any) {
    console.error('[Cart API] Error fetching cart:', error)
    console.error('[Cart API] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json({ 
      error: 'Failed to fetch cart',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// POST /api/cart - Artikel zum Warenkorb hinzufügen
export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      console.error('[Cart API] Prisma not available for POST request')
      return NextResponse.json({ 
        error: 'Database connection error',
        message: 'Please check DATABASE_URL and run migrations'
      }, { status: 503 })
    }

    const body = await request.json()
    const { userId, productId, quantity = 1 } = body

    console.log('[Cart API] Adding to cart:', { userId, productId, quantity })

    if (!userId || !productId) {
      return NextResponse.json({ error: 'userId and productId are required' }, { status: 400 })
    }

    // Prüfe ob User existiert, falls nicht erstelle einen
    let user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      console.log(`[Cart API] User ${userId} not found, creating...`)
      user = await prisma.user.create({
        data: {
          id: userId,
          email: `user-${userId}@example.com`,
          firstName: 'User',
          lastName: userId,
          goofyCoins: 0,
          totalSpent: 0,
        },
      })
      console.log(`[Cart API] User ${userId} created successfully`)
    }

    // Prüfe ob Produkt existiert
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      console.error('[Cart API] Product not found:', productId)
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Prüfe ob Artikel bereits im Warenkorb ist
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId,
        productId,
      },
    })

    let cartItem
    if (existingItem) {
      // Aktualisiere Menge
      console.log('[Cart API] Updating existing cart item:', existingItem.id)
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
      // Erstelle neuen Eintrag
      console.log('[Cart API] Creating new cart item')
      cartItem = await prisma.cartItem.create({
        data: {
          userId,
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

    console.log('[Cart API] Cart item saved successfully:', cartItem.id)
    return NextResponse.json(cartItem, { status: 201 })
  } catch (error: any) {
    console.error('[Cart API] Error adding to cart:', error)
    console.error('[Cart API] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    })
    return NextResponse.json({ 
      error: 'Failed to add to cart',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    await prisma.cartItem.deleteMany({
      where: { userId },
    })

    return NextResponse.json({ message: 'Cart cleared successfully' })
  } catch (error: any) {
    console.error('Error clearing cart:', error)
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 })
  }
}









