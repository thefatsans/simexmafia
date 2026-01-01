'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/contexts/ToastContext'
import { getOrderById, updateOrderStatus } from '@/data/payments'
import { getOrdersFromAPI } from '@/lib/api/orders'
import { useAuth } from '@/contexts/AuthContext'

function PayPalCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const { user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'cancelled'>('loading')
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get parameters from PayPal callback
        const paymentId = searchParams.get('paymentId')
        const payerId = searchParams.get('PayerID')
        const token = searchParams.get('token')
        const orderIdParam = searchParams.get('orderId')
        const amount = searchParams.get('amount')
        const statusParam = searchParams.get('status')
        const cancel = searchParams.get('cancel')

        console.log('[PayPal Callback] Received parameters:', {
          paymentId,
          payerId,
          token,
          orderId: orderIdParam,
          amount,
          status: statusParam,
          cancel
        })

        // Check if payment was cancelled
        if (cancel === 'true' || statusParam === 'cancelled') {
          setStatus('cancelled')
          showError('PayPal-Zahlung wurde abgebrochen')
          // Clean up localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('pendingPayPalOrderId')
            localStorage.removeItem('pendingPayPalAmount')
          }
          setTimeout(() => {
            router.push('/checkout')
          }, 3000)
          return
        }

        // Get orderId from URL or localStorage (PayPal.me doesn't support query params)
        let finalOrderId = orderIdParam
        let finalAmount = amount
        if (!finalOrderId && typeof window !== 'undefined') {
          // Try to get from localStorage (fallback for PayPal.me)
          const storedOrderId = localStorage.getItem('pendingPayPalOrderId')
          const storedAmount = localStorage.getItem('pendingPayPalAmount')
          if (storedOrderId) {
            finalOrderId = storedOrderId
            localStorage.removeItem('pendingPayPalOrderId')
          }
          if (storedAmount) {
            finalAmount = storedAmount
            localStorage.removeItem('pendingPayPalAmount')
          }
        }

        if (!finalOrderId) {
          setStatus('error')
          showError('Bestell-ID nicht gefunden. Bitte kontaktieren Sie uns.')
          setTimeout(() => {
            router.push('/account/orders')
          }, 3000)
          return
        }

        setOrderId(finalOrderId)

        // Verify payment with backend
        try {
          const response = await fetch(`/api/payments/paypal/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: finalOrderId,
              paymentId,
              payerId,
              token,
              amount,
              userId: user?.id,
            }),
          })

          const data = await response.json()

          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Zahlungsverifizierung fehlgeschlagen')
          }

          // Update order status to processing (admin will set to completed after verifying payment)
          try {
            if (user?.id) {
              await getOrdersFromAPI(user.id)
            }
            // Try to update order status via API
            const updateResponse = await fetch(`/api/orders/${finalOrderId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                status: 'processing',
                userId: user?.id,
              }),
            })

            if (updateResponse.ok) {
              console.log('[PayPal Callback] Order status updated to processing')
            }
          } catch (error) {
            console.error('[PayPal Callback] Error updating order status:', error)
            // Continue anyway - admin can update manually
          }

          setStatus('success')
          showSuccess('PayPal-Zahlung erfolgreich! Die Bestellung wird bearbeitet.')
          
          // Redirect to confirmation page after 2 seconds
          setTimeout(() => {
            router.push(`/checkout/confirmation?orderId=${finalOrderId}`)
          }, 2000)
        } catch (error: any) {
          console.error('[PayPal Callback] Verification error:', error)
          setStatus('error')
          showError(error.message || 'Fehler bei der Zahlungsverifizierung')
          setTimeout(() => {
            router.push(`/checkout/confirmation?orderId=${finalOrderId}`)
          }, 3000)
        }
      } catch (error: any) {
        console.error('[PayPal Callback] Error:', error)
        setStatus('error')
        showError('Ein Fehler ist aufgetreten. Bitte kontaktieren Sie uns.')
        setTimeout(() => {
          router.push('/account/orders')
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams, router, showSuccess, showError, user])

  return (
    <div className="min-h-screen py-20 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Zahlung wird verarbeitet...</h1>
            <p className="text-gray-400">Bitte warten Sie, während wir Ihre PayPal-Zahlung überprüfen.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/20 rounded-full mb-6">
              <CheckCircle className="w-16 h-16 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Zahlung erfolgreich!</h1>
            <p className="text-gray-400 mb-6">
              Ihre PayPal-Zahlung wurde erfolgreich verarbeitet. Sie werden zur Bestätigungsseite weitergeleitet...
            </p>
            {orderId && (
              <Link
                href={`/checkout/confirmation?orderId=${orderId}`}
                className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-lg transition-all"
              >
                Zur Bestätigung
              </Link>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-24 h-24 bg-red-500/20 rounded-full mb-6">
              <XCircle className="w-16 h-16 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Zahlung fehlgeschlagen</h1>
            <p className="text-gray-400 mb-6">
              Es gab ein Problem bei der Verarbeitung Ihrer PayPal-Zahlung. Bitte kontaktieren Sie uns, wenn das Problem weiterhin besteht.
            </p>
            {orderId && (
              <Link
                href={`/checkout/confirmation?orderId=${orderId}`}
                className="inline-block bg-fortnite-dark border-2 border-purple-500/50 hover:border-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-all"
              >
                Bestellung anzeigen
              </Link>
            )}
          </>
        )}

        {status === 'cancelled' && (
          <>
            <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-500/20 rounded-full mb-6">
              <XCircle className="w-16 h-16 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Zahlung abgebrochen</h1>
            <p className="text-gray-400 mb-6">
              Sie haben die PayPal-Zahlung abgebrochen. Ihre Bestellung wurde nicht abgeschlossen.
            </p>
            <Link
              href="/checkout"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-lg transition-all"
            >
              Zurück zur Kasse
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function PayPalCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-6" />
          <p className="text-gray-400">Lade...</p>
        </div>
      </div>
    }>
      <PayPalCallbackContent />
    </Suspense>
  )
}

