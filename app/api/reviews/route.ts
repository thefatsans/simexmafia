import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { userHasPurchasedProduct } from '@/lib/reviews/verify-purchase'
import { syncProductRatingFromReviews } from '@/lib/reviews/sync-product-rating'
import { syncSellerRatingForProduct } from '@/lib/sellers/sync-seller-rating'
import { mapReviewFromDb } from '@/lib/reviews/format-review'

// GET /api/reviews?productId=xxx — öffentliche Produktbewertungen
// GET /api/reviews?userId=xxx — eigene Bewertungen (Auth erforderlich)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    const userId = searchParams.get('userId')

    if (!productId && !userId) {
      return NextResponse.json(
        { error: 'productId or userId is required' },
        { status: 400 }
      )
    }

    if (!prisma) {
      return NextResponse.json([])
    }

    if (userId) {
      const authResult = await getAuthenticatedUser(request)
      if (authResult?.error) return authResult.error
      if (!authResult?.user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      if (authResult.user.id !== userId && !authResult.user.isAdmin) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const reviews = await prisma.review.findMany({
      where: {
        ...(productId ? { productId } : {}),
        ...(userId ? { userId } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reviews.map(mapReviewFromDb))
  } catch (error: unknown) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// POST /api/reviews — nur für verifizierte Käufer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, rating, title, comment } = body

    if (!productId || !rating || !title || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const parsedRating = parseInt(String(rating), 10)
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const authResult = await getAuthenticatedUser(request, body)
    if (authResult?.error) return authResult.error
    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = authResult.user.id

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const purchased = await userHasPurchasedProduct(userId, productId)
    if (!purchased) {
      return NextResponse.json(
        {
          error: 'Sie können nur Produkte bewerten, die Sie gekauft haben.',
          code: 'PURCHASE_REQUIRED',
        },
        { status: 403 }
      )
    }

    const existingReview = await prisma.review.findFirst({
      where: { userId, productId },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already exists for this product', code: 'ALREADY_REVIEWED' },
        { status: 409 }
      )
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        rating: parsedRating,
        title: String(title).trim(),
        comment: String(comment).trim(),
        verifiedPurchase: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    await syncProductRatingFromReviews(productId)
    await syncSellerRatingForProduct(productId)

    return NextResponse.json(mapReviewFromDb(review), { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
