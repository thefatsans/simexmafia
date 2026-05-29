import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { userHasPurchasedProduct } from '@/lib/reviews/verify-purchase'

// GET /api/reviews/eligibility?productId=xxx
export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get('productId')
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const authResult = await getAuthenticatedUser(request)
    if (authResult?.error) return authResult.error
    if (!authResult?.user) {
      return NextResponse.json({
        canReview: false,
        hasPurchased: false,
        hasReviewed: false,
        reason: 'not_authenticated',
      })
    }

    if (!prisma) {
      return NextResponse.json({
        canReview: false,
        hasPurchased: false,
        hasReviewed: false,
        reason: 'database_unavailable',
      })
    }

    const userId = authResult.user.id
    const [hasPurchased, existingReview] = await Promise.all([
      userHasPurchasedProduct(userId, productId),
      prisma.review.findFirst({
        where: { userId, productId },
        select: { id: true },
      }),
    ])

    const hasReviewed = !!existingReview
    const canReview = hasPurchased && !hasReviewed

    let reason: string | null = null
    if (!hasPurchased) reason = 'purchase_required'
    else if (hasReviewed) reason = 'already_reviewed'

    return NextResponse.json({
      canReview,
      hasPurchased,
      hasReviewed,
      reason,
    })
  } catch (error: unknown) {
    console.error('Error checking review eligibility:', error)
    return NextResponse.json({ error: 'Failed to check eligibility' }, { status: 500 })
  }
}
