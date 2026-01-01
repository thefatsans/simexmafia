import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/wishlist?userId=xxx - Wunschliste abrufen
export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      console.error('[Wishlist API] Prisma not available for GET request')
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

    const wishlistItems = await prisma.wishlistItem.findMany({
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

    return NextResponse.json(wishlistItems)
  } catch (error: any) {
    console.error('[Wishlist API] Error fetching wishlist:', error)
    console.error('[Wishlist API] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json({ 
      error: 'Failed to fetch wishlist',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// POST /api/wishlist - Artikel zur Wunschliste hinzufügen
export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      console.error('[Wishlist API] Prisma not available for POST request')
      return NextResponse.json({ 
        error: 'Database connection error',
        message: 'Please check DATABASE_URL and run migrations'
      }, { status: 503 })
    }

    const body = await request.json()
    const { userId, productId } = body

    if (!userId || !productId) {
      return NextResponse.json({ error: 'userId and productId are required' }, { status: 400 })
    }

    // Prüfe ob User existiert, falls nicht erstelle einen
    let user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      console.log(`[Wishlist API] User ${userId} not found, creating...`)
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
      console.log(`[Wishlist API] User ${userId} created successfully`)
    }

    // Prüfe ob Produkt existiert
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      console.error('[Wishlist API] Product not found:', productId)
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
    })

    console.log('[Wishlist API] Wishlist item created successfully:', wishlistItem.id)
    return NextResponse.json(wishlistItem, { status: 201 })
  } catch (error: any) {
    // Wenn Artikel bereits in Wunschliste, ignoriere Fehler
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Item already in wishlist' }, { status: 409 })
    }
    console.error('[Wishlist API] Error adding to wishlist:', error)
    console.error('[Wishlist API] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json({ 
      error: 'Failed to add to wishlist',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// DELETE /api/wishlist - Artikel aus Wunschliste entfernen
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const productId = searchParams.get('productId')

    if (!userId || !productId) {
      return NextResponse.json({ error: 'userId and productId are required' }, { status: 400 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    await prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    })

    return NextResponse.json({ message: 'Item removed from wishlist' })
  } catch (error: any) {
    console.error('Error removing from wishlist:', error)
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
  }
}









