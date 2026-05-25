'use client'

import { useEffect, useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { Loader2 } from 'lucide-react'
import { getStripe } from '@/lib/stripe'
import StripePaymentForm from '@/components/StripePaymentForm'

interface StripeCheckoutSectionProps {
  amount: number
  orderId: string
  metadata?: Record<string, string>
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

export default function StripeCheckoutSection({
  amount,
  orderId,
  metadata = {},
  onSuccess,
  onError,
}: StripeCheckoutSectionProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function createIntent() {
      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            currency: 'eur',
            metadata: { orderId, ...metadata },
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Zahlung konnte nicht vorbereitet werden')
        }

        if (!cancelled) {
          setClientSecret(data.clientSecret)
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Stripe konnte nicht geladen werden'
        if (!cancelled) {
          setError(message)
          onError(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    createIntent()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- metadata/onError intentionally omitted
  }, [amount, orderId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Zahlung wird vorbereitet...</span>
      </div>
    )
  }

  if (error || !clientSecret) {
    return <p className="text-red-400 text-sm">{error || 'Kartenzahlung ist nicht verfügbar.'}</p>
  }

  const stripePromise = getStripe()
  if (!stripePromise) {
    return (
      <p className="text-red-400 text-sm">
        Kartenzahlung ist nicht konfiguriert. Bitte STRIPE_SECRET_KEY und NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in Vercel setzen.
      </p>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#a855f7',
            colorBackground: '#1a1a2e',
            colorText: '#ffffff',
          },
        },
      }}
    >
      <StripePaymentForm
        clientSecret={clientSecret}
        amount={amount}
        orderId={orderId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  )
}
