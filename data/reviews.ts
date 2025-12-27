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

export const mockReviews: Review[] = [
  {
    id: 'review1',
    productId: '1',
    userId: 'user1',
    userName: 'GamingPro123',
    rating: 5,
    title: 'Perfect! Instant delivery',
    comment: 'Got my V-Bucks within seconds of purchase. Key worked perfectly and I was able to use it right away. Highly recommend this seller!',
    date: '2024-12-15',
    verifiedPurchase: true,
    helpful: 23,
  },
  {
    id: 'review2',
    productId: '1',
    userId: 'user2',
    userName: 'FortniteFan',
    rating: 4,
    title: 'Great deal, fast delivery',
    comment: 'Good price compared to Epic Games store. Delivery was quick and the key worked without any issues. Will buy again!',
    date: '2024-12-10',
    verifiedPurchase: true,
    helpful: 15,
  },
  {
    id: 'review3',
    productId: '2',
    userId: 'user3',
    userName: 'CODPlayer',
    rating: 5,
    title: 'Amazing game, great price',
    comment: 'The game is fantastic and the price was much better than Steam. Key activated immediately and I was playing within minutes. Excellent service!',
    date: '2024-12-20',
    verifiedPurchase: true,
    helpful: 42,
  },
  {
    id: 'review4',
    productId: '2',
    userId: 'user4',
    userName: 'FPSMaster',
    rating: 4,
    title: 'Solid purchase',
    comment: 'Game works great, multiplayer is fun. The discount made it worth buying here instead of directly from Steam.',
    date: '2024-12-18',
    verifiedPurchase: true,
    helpful: 8,
  },
  {
    id: 'review5',
    productId: '3',
    userId: 'user5',
    userName: 'PS5Gamer',
    rating: 5,
    title: 'Instant delivery, perfect!',
    comment: 'Received the code immediately after payment. Redeemed it on PSN without any problems. Great seller!',
    date: '2024-12-22',
    verifiedPurchase: true,
    helpful: 31,
  },
]

export const getProductReviews = (productId: string): Review[] => {
  // Get mock reviews
  const reviews = mockReviews.filter(review => review.productId === productId)
  
  // Get user-submitted reviews from localStorage (client-side only)
  if (typeof window !== 'undefined') {
    try {
      const userReviews = JSON.parse(localStorage.getItem('userReviews') || '[]')
      const productUserReviews = userReviews.filter(
        (review: Review) => review.productId === productId
      )
      return [...reviews, ...productUserReviews].sort((a, b) => {
        // Sort by date, newest first
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
    } catch (error) {
      console.error('Error loading user reviews:', error)
    }
  }
  
  return reviews
}

/**
 * Speichert ein Review in localStorage (Fallback wenn API nicht verfügbar)
 */
export const saveReviewToLocalStorage = (review: Review): void => {
  if (typeof window === 'undefined') return
  
  try {
    const userReviews = JSON.parse(localStorage.getItem('userReviews') || '[]')
    userReviews.push(review)
    localStorage.setItem('userReviews', JSON.stringify(userReviews))
  } catch (error) {
    console.error('Error saving review to localStorage:', error)
  }
}


