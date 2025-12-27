'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Lock, Shield, CheckCircle, X, Wallet } from 'lucide-react'
import { PaymentMethod, PaymentDetails, OrderItem, createOrder, processPayment, validatePaymentDetails } from '@/data/payments'
import { calculateCoinsEarned, TIER_INFO } from '@/types/user'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit-card')
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    method: 'credit-card',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const { showSuccess, showError } = useToast()
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const serviceFee = 0.99
  const subtotal = total
  const userTier = TIER_INFO[user?.tier || 'Bronze']
  // Für Säcke: Keine Coins verdienen, da man Coins aus dem Sack gewinnen kann
  // Nur für normale Produktkäufe Coins verdienen
  const isSackPurchase = items.some(item => item.type === 'sack')
  const coinsEarned = isSackPurchase ? 0 : calculateCoinsEarned(subtotal + serviceFee, user?.tier || 'Bronze')
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
    setPaymentDetails({
      method,
    })
    setErrors({})
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '')
    const match = cleaned.match(/.{1,4}/g)
    return match ? match.join(' ') : cleaned
  }

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4)
    }
    return cleaned
  }

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

    // Erstelle Bestellung
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

    // Verarbeite Zahlung
    const result = await processPayment(order, {
      ...paymentDetails,
      method: paymentMethod,
    })

    setIsProcessing(false)

    if (result.success) {
      // Add earned coins to user account (nur für normale Produktkäufe, nicht für Säcke)
      if (coinsEarned > 0 && user && !isSackPurchase) {
        addCoins(coinsEarned)
        // Update totalSpent
        updateUser({ totalSpent: (user.totalSpent || 0) + finalTotal })
      }
      
      showSuccess('Zahlung erfolgreich!', 3000)
      if (onSuccess) {
        onSuccess(result.orderId)
      } else {
        router.push(`/checkout/confirmation?orderId=${result.orderId}`)
      }
    } else {
      showError(result.error || 'Zahlung fehlgeschlagen. Bitte versuchen Sie es erneut.')
    }
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

        {/* Order Summary */}
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

        <form onSubmit={handleSubmit}>
          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-3">Zahlungsmethode:</label>
            <div className="grid grid-cols-2 gap-4">
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
                <div className="text-white font-semibold text-sm">Kreditkarte</div>
              </button>
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
              </button>
            </div>
          </div>

          {/* Payment Details */}
          {paymentMethod === 'credit-card' && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Kartennummer</label>
                <input
                  type="text"
                  name="cardNumber"
                  value={paymentDetails.cardNumber || ''}
                  onChange={(e) => {
                    const formatted = formatCardNumber(e.target.value)
                    setPaymentDetails((prev) => ({ ...prev, cardNumber: formatted }))
                  }}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                {errors.cardNumber && (
                  <p className="text-red-400 text-xs mt-1">{errors.cardNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Karteninhaber</label>
                <input
                  type="text"
                  name="cardName"
                  value={paymentDetails.cardName || ''}
                  onChange={handleInputChange}
                  placeholder="Max Mustermann"
                  className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                {errors.cardName && (
                  <p className="text-red-400 text-xs mt-1">{errors.cardName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Ablaufdatum</label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={paymentDetails.expiryDate || ''}
                    onChange={(e) => {
                      const formatted = formatExpiryDate(e.target.value)
                      setPaymentDetails((prev) => ({ ...prev, expiryDate: formatted }))
                    }}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  {errors.expiryDate && (
                    <p className="text-red-400 text-xs mt-1">{errors.expiryDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    value={paymentDetails.cvv || ''}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  {errors.cvv && (
                    <p className="text-red-400 text-xs mt-1">{errors.cvv}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'paypal' && (
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-2">PayPal-E-Mail</label>
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

          {/* Security Info */}
          <div className="flex items-center space-x-2 mb-6 text-sm text-gray-400">
            <Lock className="w-4 h-4" />
            <span>Ihre Zahlungsdaten werden sicher verschlüsselt übertragen</span>
          </div>

          {/* Submit Button */}
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
                <span>Jetzt bezahlen - €{finalTotal.toFixed(2)}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

