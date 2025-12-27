'use client'

import { useState } from 'react'
import { X, Mail, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NewsletterModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate email
    if (!email.trim()) {
      setError('Bitte geben Sie eine E-Mail-Adresse ein')
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein')
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Save to localStorage (in a real app, this would go to a backend)
    try {
      const subscribers = JSON.parse(localStorage.getItem('newsletter-subscribers') || '[]')
      if (!subscribers.includes(email.toLowerCase().trim())) {
        subscribers.push(email.toLowerCase().trim())
        localStorage.setItem('newsletter-subscribers', JSON.stringify(subscribers))
      }
    } catch (err) {
      console.error('Error saving newsletter subscription:', err)
    }

    setIsSubmitting(false)
    setIsSuccess(true)

    // Close modal after 2 seconds and redirect to confirmation
    setTimeout(() => {
      onClose()
      router.push('/newsletter/confirmation')
    }, 2000)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-fortnite-dark border border-purple-500/30 rounded-lg p-8 max-w-md w-full shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {!isSuccess ? (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
                <Mail className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Newsletter abonnieren
              </h2>
              <p className="text-gray-400 text-sm">
                Erhalten Sie exklusive Angebote, Neuigkeiten und Updates direkt in Ihr Postfach!
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="newsletter-email" className="block text-gray-300 text-sm mb-2">
                  E-Mail-Adresse
                </label>
                <input
                  type="email"
                  id="newsletter-email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder="ihre@email.com"
                  className={`w-full px-4 py-3 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors ${
                    error ? 'border-red-500' : 'border-purple-500/30'
                  }`}
                  disabled={isSubmitting}
                />
                {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-all transform hover:scale-105"
              >
                {isSubmitting ? 'Wird abonniert...' : 'Jetzt abonnieren'}
              </button>

              <p className="text-gray-500 text-xs text-center">
                Durch das Abonnieren stimmen Sie unseren{' '}
                <a href="/privacy" className="text-purple-400 hover:text-purple-300">
                  Datenschutzbestimmungen
                </a>{' '}
                zu.
              </p>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Erfolgreich abonniert!
            </h2>
            <p className="text-gray-400">
              Vielen Dank für Ihr Abonnement. Sie erhalten in Kürze eine Bestätigungs-E-Mail.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

