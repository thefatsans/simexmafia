'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Star, CheckCircle, ShoppingBag } from 'lucide-react'
import { getProductFromAPI } from '@/lib/api/products'
import {
  checkReviewEligibilityAPI,
  createReviewAPI,
} from '@/lib/api/reviews'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import { Product } from '@/types'
import { LoadingPage } from '@/components/LoadingSpinner'

export default function WriteReviewPage() {
  const router = useRouter()
  const params = useParams()
  const { showSuccess, showError } = useToast()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [eligibilityChecked, setEligibilityChecked] = useState(false)

  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    comment: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/products/${productId}/review`)
    }
  }, [isAuthenticated, authLoading, router, productId])

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const load = async () => {
      setIsLoading(true)
      try {
        const data = await getProductFromAPI(productId)
        if (!data) {
          setProduct(null)
          return
        }
        setProduct(data)

        const eligibility = await checkReviewEligibilityAPI(productId, user)
        setHasPurchased(eligibility.hasPurchased)
        setHasReviewed(eligibility.hasReviewed)
      } catch (error) {
        console.error('Error loading review page:', error)
      } finally {
        setIsLoading(false)
        setEligibilityChecked(true)
      }
    }
    load()
  }, [productId, isAuthenticated, user])

  if (isLoading || authLoading) {
    return <LoadingPage label="Produkt wird geladen..." />
  }

  if (!product) {
    return (
      <div className="min-h-screen py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Produkt nicht gefunden</h1>
          <Link href="/products" className="text-purple-400 hover:text-purple-300">
            Zurück zu Produkten
          </Link>
        </div>
      </div>
    )
  }

  if (eligibilityChecked && !hasPurchased) {
    return (
      <div className="min-h-screen py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={`/products/${productId}`}
            className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Produkt
          </Link>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-8 text-center">
            <ShoppingBag className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Kauf erforderlich</h1>
            <p className="text-gray-400 mb-6">
              Sie können nur Produkte bewerten, die Sie erfolgreich gekauft haben.
            </p>
            <Link
              href={`/products/${productId}`}
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-lg transition-all"
            >
              Zum Produkt
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (hasReviewed) {
    return (
      <div className="min-h-screen py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={`/products/${productId}`}
            className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Produkt
          </Link>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Sie haben dieses Produkt bereits bewertet
            </h1>
            <p className="text-gray-400 mb-6">
              Sie können jedes Produkt nur einmal bewerten.
            </p>
            <Link
              href={`/products/${productId}`}
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-lg transition-all"
            >
              Zum Produkt zurückkehren
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleRatingClick = (rating: number) => {
    setFormData({ ...formData, rating })
    if (errors.rating) {
      setErrors({ ...errors, rating: '' })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, name: '' })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (formData.rating === 0) {
      newErrors.rating = 'Bitte wählen Sie eine Bewertung aus'
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Bitte geben Sie einen Titel ein'
    }
    if (!formData.comment.trim()) {
      newErrors.comment = 'Bitte geben Sie einen Kommentar ein'
    }
    if (formData.comment.trim().length < 10) {
      newErrors.comment = 'Der Kommentar muss mindestens 10 Zeichen lang sein'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !user) {
      if (!user) showError('Bitte melden Sie sich an, um eine Bewertung zu schreiben')
      return
    }

    setIsSubmitting(true)

    try {
      await createReviewAPI(
        {
          productId,
          rating: formData.rating,
          title: formData.title.trim(),
          comment: formData.comment.trim(),
        },
        user
      )

      showSuccess('Bewertung erfolgreich veröffentlicht!')
      router.push(`/products/${productId}?reviewSubmitted=true`)
    } catch (error: unknown) {
      console.error('Error creating review:', error)
      const message = error instanceof Error ? error.message : 'Fehler beim Erstellen der Bewertung'
      showError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={`/products/${productId}`}
            className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Produkt
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Bewertung schreiben</h1>
          <p className="text-gray-400">Teilen Sie Ihre Erfahrung mit {product.name}</p>
        </div>

        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative w-20 h-20 bg-gradient-to-br from-purple-900/50 to-yellow-900/50 rounded-lg overflow-hidden flex-shrink-0">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl">🎮</span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{product.name}</h2>
              <p className="text-gray-400">{product.platform}</p>
              <span className="inline-block bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded mt-2">
                <CheckCircle className="w-3 h-3 inline mr-1" />
                Verifizierter Kauf
              </span>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8"
        >
          <div className="mb-6">
            <label className="block text-white font-semibold mb-3">Ihre Bewertung *</label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleRatingClick(rating)}
                  className={`transition-all ${
                    formData.rating >= rating
                      ? 'text-yellow-400 scale-110'
                      : 'text-gray-600 hover:text-yellow-400'
                  }`}
                >
                  <Star
                    className={`w-10 h-10 ${formData.rating >= rating ? 'fill-current' : ''}`}
                  />
                </button>
              ))}
            </div>
            {errors.rating && <p className="text-red-400 text-sm mt-2">{errors.rating}</p>}
          </div>

          <div className="mb-6">
            <label htmlFor="title" className="block text-white font-semibold mb-2">
              Titel der Bewertung *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              maxLength={100}
              className={`w-full px-4 py-2 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors ${
                errors.title ? 'border-red-500' : 'border-purple-500/30'
              }`}
              placeholder="z.B. Schnelle Lieferung, alles top!"
            />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
          </div>

          <div className="mb-6">
            <label htmlFor="comment" className="block text-white font-semibold mb-2">
              Ihre Bewertung *
            </label>
            <textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={handleInputChange}
              rows={8}
              maxLength={1000}
              className={`w-full px-4 py-2 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none ${
                errors.comment ? 'border-red-500' : 'border-purple-500/30'
              }`}
              placeholder="Was hat Ihnen gefallen? Wie war die Lieferung?"
            />
            {errors.comment && <p className="text-red-400 text-sm mt-1">{errors.comment}</p>}
            <p className="text-gray-500 text-xs mt-1">{formData.comment.length}/1000 Zeichen</p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-lg transition-all transform hover:scale-105"
            >
              {isSubmitting ? 'Wird übermittelt...' : 'Bewertung veröffentlichen'}
            </button>
            <Link href={`/products/${productId}`} className="text-gray-400 hover:text-white transition-colors">
              Abbrechen
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
