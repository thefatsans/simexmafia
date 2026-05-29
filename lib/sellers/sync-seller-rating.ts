import { prisma } from '@/lib/prisma'
import { SIMEXMAFIA_SELLER_ID } from '@/lib/sellers'

/** Berechnet Verkäufer-Rating aus allen Produkt-Reviews seiner Produkte. */
export async function syncSellerRatingFromReviews(sellerId: string): Promise<void> {
  if (!prisma) return

  const reviews = await prisma.review.findMany({
    where: {
      product: { sellerId },
    },
    select: { rating: true },
  })

  if (reviews.length === 0) {
    await prisma.seller.update({
      where: { id: sellerId },
      data: { rating: 0, reviewCount: 0 },
    })
    return
  }

  const avgRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

  await prisma.seller.update({
    where: { id: sellerId },
    data: {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    },
  })
}

export async function syncSellerRatingForProduct(productId: string): Promise<void> {
  if (!prisma) return

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellerId: true },
  })

  if (!product?.sellerId) return
  await syncSellerRatingFromReviews(product.sellerId)
}
