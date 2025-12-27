'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Star, ThumbsUp, CheckCircle, Edit3 } from 'lucide-react'
import { Review } from '@/data/reviews'

interface ProductReviewsProps {
  reviews: Review[]
  productId: string
}

export default function ProductReviews({ reviews, productId }: ProductReviewsProps) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set())
  
  // Prüfe ob User bereits ein Review geschrieben hat
  const userHasReviewed = isAuthenticated && user 
    ? reviews.some(r => r.userId === user.id)
    : false

  const handleHelpful = (reviewId: string) => {
    setHelpfulReviews((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId)
      } else {
        newSet.add(reviewId)
      }
      return newSet
    })
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: reviews.length > 0
      ? (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100
      : 0,
  }))

  if (reviews.length === 0) {
    return (
      <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 text-center">
        <p className="text-gray-400 mb-4">Noch keine Bewertungen. Seien Sie der Erste, der dieses Produkt bewertet!</p>
        {isAuthenticated && (
          <button
            onClick={() => router.push(`/products/${productId}/review`)}
            className="inline-flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <Edit3 className="w-5 h-5" />
            <span>Bewertung schreiben</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Reviews Summary */}
      <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Kundenbewertungen</h3>
          {isAuthenticated && !userHasReviewed && (
            <button
              onClick={() => router.push(`/products/${productId}/review`)}
              className="inline-flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Bewertung schreiben</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Average Rating */}
          <div>
            <h3 className="text-white font-semibold mb-4">Kundenbewertungen</h3>
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-white">{averageRating.toFixed(1)}</div>
                <div className="flex items-center justify-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-400 text-sm mt-2">{reviews.length} Bewertungen</p>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div>
            <h4 className="text-white font-semibold mb-4">Bewertungsaufteilung</h4>
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-20">
                    <span className="text-gray-400 text-sm">{rating}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-fortnite-darker rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-sm w-12 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white">Alle Bewertungen</h3>
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-white font-semibold">{review.userName}</h4>
                  {review.verifiedPurchase && (
                    <span className="flex items-center space-x-1 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3" />
                      <span>Verifizierter Kauf</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-400 text-sm">{review.date}</span>
                </div>
                <h5 className="text-white font-medium mb-2">{review.title}</h5>
                <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 pt-4 border-t border-purple-500/20">
              <button
                onClick={() => handleHelpful(review.id)}
                className={`flex items-center space-x-2 text-sm transition-colors ${
                  helpfulReviews.has(review.id)
                    ? 'text-purple-400'
                    : 'text-gray-400 hover:text-purple-400'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Hilfreich ({review.helpful + (helpfulReviews.has(review.id) ? 1 : 0)})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


