import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reviews?productId=xxx - Reviews für ein Produkt abrufen
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    const userId = searchParams.get('userId')

    const where: any = {}
    if (productId) where.productId = productId
    if (userId) where.userId = userId

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(reviews)
  } catch (error: any) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// POST /api/reviews - Neues Review erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, userId, rating, title, comment, verifiedPurchase } = body

    // Validierung
    if (!productId || !userId || !rating || !title || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Prüfe ob User bereits ein Review für dieses Produkt hat
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId,
      },
    })

    if (existingReview) {
      return NextResponse.json({ error: 'Review already exists for this product' }, { status: 409 })
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        rating: parseInt(rating),
        title,
        comment,
        verifiedPurchase: verifiedPurchase || false,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    })

    // Aktualisiere Produkt-Bewertung
    const productReviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    })

    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: avgRating,
        reviewCount: productReviews.length,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error: any) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}





