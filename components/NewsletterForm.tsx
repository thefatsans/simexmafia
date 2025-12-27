'use client'

import { useState } from 'react'
import { Mail, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NewsletterFormProps {
  variant?: 'inline' | 'compact'
  showTitle?: boolean
}

export default function NewsletterForm({ variant = 'inline', showTitle = true }: NewsletterFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

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

    // Save to localStorage
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

    // Redirect to confirmation after 1.5 seconds
    setTimeout(() => {
      router.push('/newsletter/confirmation')
    }, 1500)
  }

  if (isSuccess) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center space-x-2 text-green-400">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">Erfolgreich abonniert!</span>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            placeholder="Ihre E-Mail-Adresse"
            className={`w-full px-4 py-2 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors ${
              error ? 'border-red-500' : 'border-purple-500/30'
            }`}
            disabled={isSubmitting}
          />
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-all whitespace-nowrap"
        >
          {isSubmitting ? '...' : 'Abonnieren'}
        </button>
      </form>
    )
  }

  return (
    <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
      {showTitle && (
        <div className="flex items-center space-x-3 mb-4">
          <Mail className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-white">Newsletter abonnieren</h3>
        </div>
      )}
      <p className="text-gray-400 text-sm mb-4">
        Erhalten Sie exklusive Angebote, Neuigkeiten und Updates direkt in Ihr Postfach!
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            placeholder="Ihre E-Mail-Adresse"
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
    </div>
  )
}







