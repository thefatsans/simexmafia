'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Shield, X, Wallet, CreditCard } from 'lucide-react'
import {
  PaymentMethod,
  PaymentDetails,
  OrderItem,
  Order,
  createOrder,
  validatePaymentDetails,
  confirmStripePayment,
  updateOrderStatus,
} from '@/data/payments'
import { calculateCoinsEarned, TIER_INFO } from '@/types/user'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import { isStripeConfigured } from '@/lib/payments-config'
import StripeCheckoutSection from '@/components/StripeCheckoutSection'

interface PaymentCheckoutProps {
  items: OrderItem[]
  total: number
  onSuccess?: (orderId: string) => void
  onCancel?: () => void
  title?: string
}

export default function PaymentCheckout({
  items,
  total,
  onSuccess,
  onCancel,
  title = 'Zahlung',
}: PaymentCheckoutProps) {
  const router = useRouter()
  const { user, addCoins, updateUser } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal')
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    method: 'paypal',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [stripeOrder, setStripeOrder] = useState<Order | null>(null)
  const { showSuccess, showError } = useToast()
  const stripeEnabled = isStripeConfigured()

  useEffect(() => {
    setMounted(true)
  }, [])

  const serviceFee = 0.99
  const subtotal = total
  const userTier = TIER_INFO[user?.tier || 'Bronze']
  const isSackPurchase = items.some((item) => item.type === 'sack')
  const coinsEarned = isSackPurchase
    ? 0
    : calculateCoinsEarned(subtotal + serviceFee, user?.tier || 'Bronze')
  const discount = (subtotal + serviceFee) * (userTier.discount / 100)
  const finalTotal = subtotal + serviceFee - discount

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPaymentDetails((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method)
    setPaymentDetails({ method })
    setStripeOrder(null)
    setErrors({})
  }

  const redirectToPayPal = (order: Order) => {
    const paypalLink =
      process.env.NEXT_PUBLIC_PAYPAL_PAYMENT_LINK || 'https://paypal.me/SimexMafia'

    if (typeof window !== 'undefined') {
      localStorage.setItem('pendingPayPalOrderId', order.id)
      localStorage.setItem('pendingPayPalAmount', finalTotal.toFixed(2))
    }

    let paypalLinkWithOrder: string
    if (paypalLink.includes('paypal.me/')) {
      const baseUrl = paypalLink.replace(/\/$/, '')
      paypalLinkWithOrder = `${baseUrl}/${finalTotal.toFixed(2)}`
    } else {
      paypalLinkWithOrder = `${paypalLink}?amount=${finalTotal.toFixed(2)}&orderId=${order.id}`
    }

    window.location.href = paypalLinkWithOrder
  }

  const handleStripeSuccess = useCallback(
    async (paymentIntentId: string) => {
      if (!stripeOrder) return

      const confirmation = await confirmStripePayment(paymentIntentId)
      if (!confirmation.success) {
        showError(confirmation.error || 'Zahlung konnte nicht bestätigt werden')
        return
      }

      await updateOrderStatus(stripeOrder.id, 'completed')

      if (coinsEarned > 0 && user && !isSackPurchase) {
        addCoins(coinsEarned)
        updateUser({ totalSpent: (user.totalSpent || 0) + finalTotal })
      }

      showSuccess('Zahlung erfolgreich!', 3000)
      if (onSuccess) {
        onSuccess(stripeOrder.id)
      } else {
        router.push(`/checkout/confirmation?orderId=${stripeOrder.id}`)
      }
    },
    [
      stripeOrder,
      coinsEarned,
      user,
      isSackPurchase,
      finalTotal,
      addCoins,
      updateUser,
      showSuccess,
      showError,
      onSuccess,
      router,
    ]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validatePaymentDetails({
      ...paymentDetails,
      method: paymentMethod,
    })

    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setIsProcessing(true)

    const order = await createOrder({
      userId: user?.id || 'user1',
      items,
      subtotal,
      serviceFee,
      discount,
      total: finalTotal,
      paymentMethod,
      coinsEarned,
    })

    const isGoofyCoinsPurchase = items.some((item) => item.type === 'goofycoins')

    if (paymentMethod === 'credit-card') {
      setStripeOrder(order)
      setIsProcessing(false)
      return
    }

    if ((isSackPurchase || isGoofyCoinsPurchase) && paymentMethod === 'paypal') {
      redirectToPayPal(order)
      return
    }

    if (paymentMethod === 'paypal') {
      redirectToPayPal(order)
      return
    }

    setIsProcessing(false)
    showError('Unbekannte Zahlungsmethode')
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="bg-fortnite-dark border border-purple-500/30 rounded-lg p-8 max-w-2xl w-full relative my-8">
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <h2 className="text-3xl font-bold text-white mb-6">{title}</h2>

        <div className="bg-fortnite-darker rounded-lg p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">Bestellübersicht</h3>
          <div className="space-y-2 mb-4">
            {items.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{item.name}</span>
                <span className="text-white">
                  {item.quantity}x €{item.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-purple-500/20 pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Zwischensumme</span>
              <span className="text-white">€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Servicegebühr</span>
              <span className="text-white">€{serviceFee.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-400">Rabatt ({userTier.discount}%)</span>
                <span className="text-green-400">-€{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-lg font-bold border-t border-purple-500/20 pt-2 mt-2">
              <span className="text-white">Gesamt</span>
              <span className="text-purple-400">€{finalTotal.toFixed(2)}</span>
            </div>
            {coinsEarned > 0 && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-yellow-400">GoofyCoins erhalten</span>
                <span className="text-yellow-400 font-semibold">+{coinsEarned}</span>
              </div>
            )}
          </div>
        </div>

        {stripeOrder ? (
          <div>
            <p className="text-gray-300 text-sm mb-4">
              Bestellung <span className="text-purple-400">{stripeOrder.id}</span> – bitte Kartendaten
              eingeben:
            </p>
            <StripeCheckoutSection
              amount={finalTotal}
              orderId={stripeOrder.id}
              onSuccess={handleStripeSuccess}
              onError={(msg) => showError(msg)}
            />
            <button
              type="button"
              onClick={() => setStripeOrder(null)}
              className="mt-4 text-sm text-gray-400 hover:text-white"
            >
              ← Andere Zahlungsmethode wählen
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-white font-semibold mb-3">Zahlungsmethode:</label>
              <div className={`grid gap-4 ${stripeEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange('paypal')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'paypal'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-purple-500/30 bg-fortnite-darker'
                  }`}
                >
                  <Wallet className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-white font-semibold text-sm">PayPal</div>
                  <div className="text-gray-400 text-xs mt-1">Sichere Online-Zahlung</div>
                </button>
                {stripeEnabled && (
                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('credit-card')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'credit-card'
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-purple-500/30 bg-fortnite-darker'
                    }`}
                  >
                    <CreditCard className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-white font-semibold text-sm">Karte</div>
                    <div className="text-gray-400 text-xs mt-1">Visa, Mastercard, etc.</div>
                  </button>
                )}
              </div>
              {paymentMethod === 'paypal' && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    <strong>Hinweis:</strong> Sie werden nach dem Klick auf &quot;Jetzt bezahlen&quot; zu
                    PayPal weitergeleitet.
                  </p>
                </div>
              )}
              {paymentMethod === 'credit-card' && (
                <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-purple-300 text-sm">
                    <strong>Hinweis:</strong> Im nächsten Schritt geben Sie Ihre Kartendaten sicher über
                    Stripe ein.
                  </p>
                </div>
              )}
            </div>

            {paymentMethod === 'paypal' && (
              <div className="mb-6">
                <label className="block text-gray-300 text-sm mb-2">PayPal-E-Mail (optional)</label>
                <input
                  type="email"
                  name="paypalEmail"
                  value={paymentDetails.paypalEmail || ''}
                  onChange={handleInputChange}
                  placeholder="ihre.email@example.com"
                  className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                {errors.paypalEmail && (
                  <p className="text-red-400 text-xs mt-1">{errors.paypalEmail}</p>
                )}
              </div>
            )}

            {errors.method && <p className="text-red-400 text-sm mb-4">{errors.method}</p>}

            <div className="flex items-center space-x-2 mb-6 text-sm text-gray-400">
              <Lock className="w-4 h-4" />
              <span>Ihre Zahlungsdaten werden sicher verschlüsselt übertragen</span>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              {mounted && isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Wird verarbeitet...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>
                    {paymentMethod === 'credit-card' ? 'Weiter zur Kartenzahlung' : `Jetzt bezahlen - €${finalTotal.toFixed(2)}`}
                  </span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
