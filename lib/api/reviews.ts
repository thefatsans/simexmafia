import { Review } from '@/data/reviews'
import { getAuthPayload, getAuthQueryParams } from '@/lib/api/auth-payload'
import type { User } from '@/types/user'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

type AuthProfile = Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>

export type ReviewEligibility = {
  canReview: boolean
  hasPurchased: boolean
  hasReviewed: boolean
  reason: string | null
}

function mapReview(r: Record<string, unknown>): Review {
  return {
    id: r.id as string,
    productId: r.productId as string,
    userId: r.userId as string,
    userName: (r.userName as string) || 'Kunde',
    rating: r.rating as number,
    title: r.title as string,
    comment: r.comment as string,
    date: r.date as string,
    verifiedPurchase: Boolean(r.verifiedPurchase),
    helpful: (r.helpful as number) || 0,
  }
}

/** Echte Bewertungen aus der Datenbank — kein Mock-Fallback. */
export async function getProductReviewsFromAPI(productId: string): Promise<Review[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/reviews?productId=${encodeURIComponent(productId)}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    if (!Array.isArray(data)) return []
    return data.map(mapReview)
  } catch (error) {
    console.warn('Could not load product reviews:', error)
    return []
  }
}

export async function checkReviewEligibilityAPI(
  productId: string,
  profile: AuthProfile
): Promise<ReviewEligibility> {
  const fallback: ReviewEligibility = {
    canReview: false,
    hasPurchased: false,
    hasReviewed: false,
    reason: 'not_authenticated',
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/reviews/eligibility?${getAuthQueryParams(profile)}&productId=${encodeURIComponent(productId)}`,
      { credentials: 'include', cache: 'no-store' }
    )

    if (!response.ok) {
      return fallback
    }

    return (await response.json()) as ReviewEligibility
  } catch (error) {
    console.warn('Could not check review eligibility:', error)
    return fallback
  }
}

export async function createReviewAPI(
  review: {
    productId: string
    rating: number
    title: string
    comment: string
  },
  profile: AuthProfile
): Promise<Review> {
  const response = await fetch(`${API_BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      ...review,
      ...getAuthPayload(profile as User),
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to create review')
  }

  const data = await response.json()
  return mapReview(data)
}

export async function getUserReviewsFromAPI(profile: AuthProfile): Promise<Review[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/reviews?${getAuthQueryParams(profile)}&userId=${encodeURIComponent(profile.id)}`,
      { credentials: 'include', cache: 'no-store' }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    if (!Array.isArray(data)) return []
    return data.map(mapReview)
  } catch (error) {
    console.warn('Could not load user reviews:', error)
    return []
  }
}
