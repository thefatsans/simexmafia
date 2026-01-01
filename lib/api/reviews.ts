import { Review } from '@/data/reviews'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

/**
 * Ruft Reviews für ein Produkt von der API ab
 * Fallback: Verwendet Mock-Daten wenn API nicht verfügbar
 */
export async function getProductReviewsFromAPI(productId: string): Promise<Review[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reviews?productId=${productId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch reviews')
    }

    const data = await response.json()
    
    // Konvertiere Datenbank-Format zu Review-Format
    return data.map((r: any) => ({
      id: r.id,
      productId: r.productId,
      userId: r.userId,
      userName: r.user?.firstName && r.user?.lastName 
        ? `${r.user.firstName} ${r.user.lastName}`
        : r.user?.firstName || 'Anonymer Benutzer',
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      date: new Date(r.createdAt).toISOString().split('T')[0],
      verifiedPurchase: r.verifiedPurchase || false,
      helpful: r.helpful || 0,
    }))
  } catch (error) {
    console.warn('API not available, using fallback:', error)
    // Fallback zu Mock-Daten
    const { getProductReviews } = await import('@/data/reviews')
    return getProductReviews(productId)
  }
}

/**
 * Erstellt ein neues Review über die API
 */
export async function createReviewAPI(review: {
  productId: string
  userId: string
  rating: number
  title: string
  comment: string
  verifiedPurchase?: boolean
}): Promise<Review> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(review),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create review')
    }

    const data = await response.json()
    
    // Konvertiere Datenbank-Format zu Review-Format
    return {
      id: data.id,
      productId: data.productId,
      userId: data.userId,
      userName: data.user?.firstName && data.user?.lastName 
        ? `${data.user.firstName} ${data.user.lastName}`
        : data.user?.firstName || 'Anonymer Benutzer',
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      date: new Date(data.createdAt).toISOString().split('T')[0],
      verifiedPurchase: data.verifiedPurchase || false,
      helpful: data.helpful || 0,
    }
  } catch (error: any) {
    console.error('Error creating review:', error)
    throw error
  }
}

/**
 * Ruft Reviews eines Benutzers von der API ab
 */
export async function getUserReviewsFromAPI(userId: string): Promise<Review[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reviews?userId=${userId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch user reviews')
    }

    const data = await response.json()
    
    // Konvertiere Datenbank-Format zu Review-Format
    return data.map((r: any) => ({
      id: r.id,
      productId: r.productId,
      userId: r.userId,
      userName: r.user?.firstName && r.user?.lastName 
        ? `${r.user.firstName} ${r.user.lastName}`
        : r.user?.firstName || 'Anonymer Benutzer',
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      date: new Date(r.createdAt).toISOString().split('T')[0],
      verifiedPurchase: r.verifiedPurchase || false,
      helpful: r.helpful || 0,
    }))
  } catch (error) {
    console.warn('API not available, using fallback:', error)
    // Fallback zu localStorage
    if (typeof window !== 'undefined') {
      try {
        const userReviews = JSON.parse(localStorage.getItem('userReviews') || '[]')
        return userReviews.filter((r: Review) => r.userId === userId)
      } catch (e) {
        console.error('Error loading user reviews from localStorage:', e)
      }
    }
    return []
  }
}











