'use client'

import { useState, useEffect } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { Loader2, Shield, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

interface StripePaymentFormProps {
  clientSecret: string
  amount: number
  orderId: string
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

export default function StripePaymentForm({
  clientSecret,
  amount,
  orderId,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { showError, showSuccess } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!stripe) {
      return
    }

    const clientSecretParam = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    )

    if (!clientSecretParam) {
      return
    }

    stripe.retrievePaymentIntent(clientSecretParam).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          setMessage('Zahlung erfolgreich!')
          showSuccess('Zahlung erfolgreich!')
          onSuccess(paymentIntent.id)
          break
        case 'processing':
          setMessage('Ihre Zahlung wird verarbeitet.')
          break
        case 'requires_payment_method':
          setMessage('Ihre Zahlung wurde nicht verarbeitet. Bitte versuchen Sie es erneut.')
          showError('Zahlung fehlgeschlagen. Bitte versuchen Sie es erneut.')
          onError('Zahlung fehlgeschlagen')
          break
        default:
          setMessage('Etwas ist schiefgelaufen.')
          showError('Ein Fehler ist aufgetreten.')
          onError('Unbekannter Fehler')
          break
      }
    })
  }, [stripe, onSuccess, onError, showSuccess, showError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setMessage(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation?orderId=${orderId}`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setMessage(error.message || 'Ein Fehler ist aufgetreten.')
      showError(error.message || 'Zahlung fehlgeschlagen')
      onError(error.message || 'Zahlung fehlgeschlagen')
      setIsProcessing(false)
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage('Zahlung erfolgreich!')
      showSuccess('Zahlung erfolgreich!')
      onSuccess(paymentIntent.id)
      setIsProcessing(false)
    } else {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {message && (
        <div
          className={`flex items-center space-x-2 p-4 rounded-lg ${
            message.includes('erfolgreich')
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {message.includes('erfolgreich') ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span className="text-sm">{message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
      >
        {mounted && isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Wird verarbeitet...</span>
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            <span>Jetzt bezahlen - €{amount.toFixed(2)}</span>
          </>
        )}
      </button>

      <div className="flex items-center space-x-2 text-sm text-gray-400">
        <Shield className="w-4 h-4" />
        <span>Ihre Zahlungsdaten werden sicher von Stripe verarbeitet</span>
      </div>
    </form>
  )
}





