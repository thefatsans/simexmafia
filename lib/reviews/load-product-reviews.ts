import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { mapReviewFromDb } from '@/lib/reviews/format-review'
import type { Review } from '@/data/reviews'

/** Server-side product reviews — deduplicated per request. */
export const loadProductReviews = cache(async (productId: string): Promise<Review[]> => {
  if (!prisma || !productId) return []

  try {
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return reviews.map(mapReviewFromDb)
  } catch (error) {
    console.warn('[Reviews] loadProductReviews failed:', error)
    return []
  }
})
