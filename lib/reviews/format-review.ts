export function formatReviewUserName(user?: {
  firstName?: string | null
  lastName?: string | null
} | null): string {
  if (!user?.firstName?.trim()) {
    return 'Kunde'
  }
  const first = user.firstName.trim()
  const lastInitial = user.lastName?.trim()?.charAt(0)
  return lastInitial ? `${first} ${lastInitial}.` : first
}

export function mapReviewFromDb(r: {
  id: string
  productId: string
  userId: string
  rating: number
  title: string
  comment: string
  verifiedPurchase: boolean
  helpful: number
  createdAt: Date | string
  user?: {
    firstName?: string | null
    lastName?: string | null
  } | null
}) {
  return {
    id: r.id,
    productId: r.productId,
    userId: r.userId,
    userName: formatReviewUserName(r.user),
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    date: new Date(r.createdAt).toISOString().split('T')[0],
    verifiedPurchase: r.verifiedPurchase,
    helpful: r.helpful,
  }
}
