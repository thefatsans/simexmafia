import { prisma } from '@/lib/prisma'

export async function syncProductRatingFromReviews(productId: string): Promise<void> {
  if (!prisma) return

  const reviews = await prisma.review.findMany({
    where: { productId },
    select: { rating: true },
  })

  if (reviews.length === 0) {
    await prisma.product.update({
      where: { id: productId },
      data: { rating: 0, reviewCount: 0 },
    })
    return
  }

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    },
  })
}
