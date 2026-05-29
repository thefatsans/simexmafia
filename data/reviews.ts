export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  title: string
  comment: string
  date: string
  verifiedPurchase: boolean
  helpful: number
}

/** @deprecated Keine Mock-Bewertungen mehr — nur noch echte DB-Reviews. */
export const getProductReviews = (_productId: string): Review[] => []
