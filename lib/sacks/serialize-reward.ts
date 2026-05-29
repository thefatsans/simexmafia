import type { SackReward } from '@/data/sacks'

/** JSON-safe reward for API responses (avoids non-serializable fields). */
export function serializeSackReward(reward: SackReward) {
  return {
    type: reward.type,
    coins: reward.coins,
    message: reward.message,
    product: reward.product
      ? {
          id: reward.product.id,
          name: reward.product.name,
          description: reward.product.description,
          price: reward.product.price,
          originalPrice: reward.product.originalPrice,
          discount: reward.product.discount,
          image: reward.product.image,
          category: reward.product.category,
          platform: reward.product.platform,
          inStock: reward.product.inStock,
          rating: reward.product.rating,
          reviewCount: reward.product.reviewCount,
          tags: reward.product.tags,
        }
      : undefined,
  }
}
