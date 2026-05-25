'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CreditCard, Lock, Shield, CheckCircle, ArrowLeft, Coins, Banknote, Wallet } from 'lucide-react'
import Link from 'next/link'
import { mockUser } from '@/data/user'
import { calculateCoinsEarned, TIER_INFO } from '@/types/user'
import { useCart } from '@/contexts/CartContext'
import {
  createOrder,
  OrderItem,
  Order,
  confirmStripePayment,
  updateOrderStatus,
} from '@/data/payments'
import { isStripeConfigured, isPayPalEnabled } from '@/lib/payments-config'
import StripeCheckoutSection from '@/components/StripeCheckoutSection'
import { addToInventory } from '@/data/inventory'
import { useToast } from '@/contexts/ToastContext'
import type { DiscountCode } from '@/data/discountCodes'
import { Tag, X, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { sendOrderConfirmationEmail } from '@/lib/email'

export default function CheckoutPage() {
  const router = useRouter()
  const { cartItems, clearCart, getTotalPrice } = useCart()
  const { showSuccess, showError } = useToast()
  const { isAuthenticated, isLoading: authLoading, user, addCoins, subtractCoins, updateUser, syncUserFromDatabase } = useAuth()

  // All hooks must be called before any conditional returns
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Germany',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<DiscountCode | null>(null)
  const [appliedDiscountAmount, setAppliedDiscountAmount] = useState(0)
  const [isApplyingCode, setIsApplyingCode] = useState(false)
  const [discountError, setDiscountError] = useState('')
  const stripeEnabled = isStripeConfigured()
  const paypalEnabled = isPayPalEnabled()
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'credit-card' | 'cash' | 'goofycoins'>(
    stripeEnabled ? 'credit-card' : 'goofycoins'
  )
  const [mounted, setMounted] = useState(false)
  const [stripeOrderId, setStripeOrderId] = useState<string | null>(null)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!paypalEnabled && paymentMethod === 'paypal') {
      setPaymentMethod(stripeEnabled ? 'credit-card' : 'goofycoins')
      setStripeOrderId(null)
    }
  }, [paypalEnabled, paymentMethod, stripeEnabled])
  const [order, setOrder] = useState<Order | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/checkout')
    }
  }, [isAuthenticated, authLoading, router])
  

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Laden...</div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Berechne Subtotal basierend auf dem aktuellen Preis (price ist der reduzierte Preis bei Angeboten)
  const subtotal = cartItems.reduce((total, item) => {
    const itemPrice = item.product.price // price ist bereits der korrekte Preis (mit Rabatt falls vorhanden)
    return total + itemPrice * item.quantity
  }, 0)
  const serviceFee = 0.99
  const userTier = TIER_INFO[user?.tier || mockUser.tier]
  
  // Calculate discount from code (server-validated amount)
  const codeDiscount = appliedDiscountCode ? appliedDiscountAmount : 0
  
  // Calculate tier discount
  const tierDiscount = (subtotal + serviceFee) * (userTier.discount / 100)
  
  // Total discounts
  const totalDiscount = codeDiscount + tierDiscount
  
  const total = subtotal + serviceFee
  const finalTotal = Math.max(0, total - totalDiscount)
  const coinsEarned = calculateCoinsEarned(finalTotal, user?.tier || mockUser.tier)
  
  // GoofyCoins conversion: 1 GoofyCoin = 0.01 EUR (100 GoofyCoins = 1 EUR)
  const GOOFYCOINS_PER_EUR = 100
  const requiredGoofyCoins = Math.ceil(finalTotal * GOOFYCOINS_PER_EUR)
  const canPayWithGoofyCoins = user && user.goofyCoins >= requiredGoofyCoins

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleApplyDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Bitte geben Sie einen Rabattcode ein')
      return
    }

    const orderItems = cartItems.map(item => ({
      id: item.product.id,
      type: 'product',
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
    }))

    setIsApplyingCode(true)
    try {
      const res = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: discountCode.trim(),
          subtotal: subtotal + serviceFee,
          items: orderItems,
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (data.valid && data.discountCode) {
        setAppliedDiscountCode(data.discountCode as DiscountCode)
        setAppliedDiscountAmount(typeof data.discount === 'number' ? data.discount : 0)
        setDiscountError('')
        showSuccess(`Rabattcode "${data.discountCode.code}" angewendet!`)
      } else {
        setDiscountError(data.error || 'Ungültiger Rabattcode')
        setAppliedDiscountCode(null)
        setAppliedDiscountAmount(0)
      }
    } catch (err) {
      console.error('[Checkout] discount validate error:', err)
      setDiscountError('Validierung fehlgeschlagen')
      setAppliedDiscountCode(null)
      setAppliedDiscountAmount(0)
    } finally {
      setIsApplyingCode(false)
    }
  }

  const handleRemoveDiscountCode = () => {
    setAppliedDiscountCode(null)
    setAppliedDiscountAmount(0)
    setDiscountCode('')
    setDiscountError('')
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) newErrors.email = 'E-Mail-Adresse ist erforderlich'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'E-Mail-Adresse ist ungültig'

    if (!formData.firstName) newErrors.firstName = 'Vorname ist erforderlich'
    if (!formData.lastName) newErrors.lastName = 'Nachname ist erforderlich'
    if (!formData.address) newErrors.address = 'Adresse ist erforderlich'
    if (!formData.city) newErrors.city = 'Stadt ist erforderlich'
    if (!formData.postalCode) newErrors.postalCode = 'Postleitzahl ist erforderlich'

    // Keine Kreditkartendaten mehr erforderlich - PayPal wird extern abgewickelt

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsProcessing(true)

    // Erstelle Bestellung - verwende den aktuellen Preis (price ist der reduzierte Preis bei Angeboten)
    const orderItems: OrderItem[] = cartItems.map(item => {
      const itemPrice = item.product.price // price ist bereits der korrekte Preis (mit Rabatt falls vorhanden)
      return {
        id: item.product.id,
        type: 'product',
        name: item.product.name,
        price: itemPrice,
        quantity: item.quantity,
        metadata: {
          productId: item.product.id,
          productName: item.product.name, // Speichere auch den Namen für Fallback-Suche
        },
      }
    })

    // Discount usage is incremented server-side when the order is finalized.

    // GoofyCoins-Zahlung
    if (paymentMethod === 'goofycoins') {
      if (!user || !canPayWithGoofyCoins) {
        showError('Sie haben nicht genügend GoofyCoins für diese Bestellung')
        setIsProcessing(false)
        return
      }

      try {
        console.log('[Checkout] Creating order with GoofyCoins:', {
          userId: user.id,
          itemsCount: orderItems.length,
          total: finalTotal
        })
        const newOrder = await createOrder({
          userId: user.id,
          items: orderItems,
          subtotal,
          serviceFee,
          discount: totalDiscount,
          total: finalTotal,
          paymentMethod: 'goofycoins',
          coinsEarned: 0, // Keine Coins bei GoofyCoins-Zahlung
          discountCode: appliedDiscountCode?.code,
        })
        console.log('[Checkout] Order created:', {
          orderId: newOrder.id,
          userId: newOrder.userId,
          status: newOrder.status
        })

        // WICHTIG: Coins wurden bereits serverseitig abgezogen
        // Synchronisiere User-Balance mit Server
        if (user) {
          await syncUserFromDatabase()
        }

        // WICHTIG: Produkte werden zum Inventar hinzugefügt, aber als "ausstehend" markiert
        // Sie können erst eingelöst werden, wenn die Bestellung "completed" ist
        orderItems.forEach(item => {
          const cartItem = cartItems.find(ci => ci.product.id === item.id)
          if (cartItem) {
            for (let i = 0; i < item.quantity; i++) {
              addToInventory(
                cartItem.product,
                'purchase',
                newOrder.id, // Bestell-ID als sourceId
                'Kauf'
              )
            }
          }
        })

        showSuccess(`Bestellung erfolgreich erstellt! ${requiredGoofyCoins} GoofyCoins wurden abgezogen. Die Bestellung wird bearbeitet.`, 5000)
        clearCart()
        router.push(`/checkout/confirmation?orderId=${newOrder.id}`)
        return
      } catch (error: any) {
        console.error('[Checkout] Error creating order:', error)
        // Wenn Fehler wegen unzureichender Coins, synchronisiere Balance
        if (error.message?.includes('Insufficient GoofyCoins') || error.message?.includes('insufficient')) {
          await syncUserFromDatabase()
          showError('Nicht genug GoofyCoins für diese Bestellung')
        } else {
          showError('Fehler beim Erstellen der Bestellung. Bitte versuchen Sie es erneut.')
        }
        setIsProcessing(false)
        return
      }
    }

    // Barzahlung
    if (paymentMethod === 'cash') {
      console.log('[Checkout] Creating order with Cash:', {
        userId: user?.id || 'user1',
        itemsCount: orderItems.length,
        total: finalTotal
      })
      const newOrder = await createOrder({
        userId: user?.id || 'user1',
        items: orderItems,
        subtotal,
        serviceFee,
        discount: totalDiscount,
        total: finalTotal,
        paymentMethod: 'cash',
        coinsEarned,
        discountCode: appliedDiscountCode?.code,
      })
      console.log('[Checkout] Order created:', {
        orderId: newOrder.id,
        userId: newOrder.userId,
        status: newOrder.status
      })

      // Bei Barzahlung bleibt Status "pending" bis manuell bestätigt
      // Coins werden erst nach Bestätigung der Zahlung hinzugefügt
      // Produkte werden zum Inventar hinzugefügt, aber als "ausstehend" markiert
      orderItems.forEach(item => {
        const cartItem = cartItems.find(ci => ci.product.id === item.id)
        if (cartItem) {
          for (let i = 0; i < item.quantity; i++) {
            addToInventory(
              cartItem.product,
              'purchase',
              newOrder.id, // Bestell-ID als sourceId
              'Kauf'
            )
          }
        }
      })
      
      // Send order confirmation email
      if (user?.email && user?.firstName) {
        sendOrderConfirmationEmail(
          user.email,
          user.firstName,
          newOrder.id,
          finalTotal,
          orderItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          }))
        ).catch((error) => {
          console.error('Error sending order confirmation email:', error)
        })
      }
      
      showSuccess('Bestellung erfolgreich erstellt! Bitte zahlen Sie bei der Abholung. Sie erhalten eine Bestätigungs-E-Mail.', 5000)
      clearCart()
      router.push(`/checkout/confirmation?orderId=${newOrder.id}`)
      return
    }

    // Stripe / Kreditkarte
    if (paymentMethod === 'credit-card') {
      if (!stripeEnabled) {
        showError('Kartenzahlung ist derzeit nicht verfügbar. Bitte Stripe in Vercel konfigurieren.')
        setIsProcessing(false)
        return
      }

      try {
        const newOrder = await createOrder({
          userId: user?.id || 'user1',
          items: orderItems,
          subtotal,
          serviceFee,
          discount: totalDiscount,
          total: finalTotal,
          paymentMethod: 'credit-card',
          coinsEarned,
          discountCode: appliedDiscountCode?.code,
        })

        orderItems.forEach((item) => {
          const cartItem = cartItems.find((ci) => ci.product.id === item.id)
          if (cartItem) {
            for (let i = 0; i < item.quantity; i++) {
              addToInventory(cartItem.product, 'purchase', newOrder.id, 'Kauf')
            }
          }
        })

        setStripeOrderId(newOrder.id)
        setIsProcessing(false)
        return
      } catch (error: unknown) {
        console.error('Stripe checkout error:', error)
        showError('Fehler beim Erstellen der Bestellung')
        setIsProcessing(false)
        return
      }
    }

    if (paymentMethod === 'paypal' && !paypalEnabled) {
      showError('PayPal ist derzeit deaktiviert. Bitte Karte oder GoofyCoins wählen.')
      setIsProcessing(false)
      return
    }

    // PayPal-Zahlung (nur wenn NEXT_PUBLIC_PAYPAL_ENABLED=true)
    if (paymentMethod === 'paypal' && paypalEnabled) {
      try {
        // Erstelle Bestellung
        console.log('[Checkout] Creating order with PayPal:', {
          userId: user?.id || 'user1',
          itemsCount: orderItems.length,
          total: finalTotal
        })
        const newOrder = await createOrder({
          userId: user?.id || 'user1',
          items: orderItems,
          subtotal,
          serviceFee,
          discount: totalDiscount,
          total: finalTotal,
          paymentMethod: 'paypal',
          coinsEarned,
          discountCode: appliedDiscountCode?.code,
        })
        console.log('[Checkout] Order created:', {
          orderId: newOrder.id,
          userId: newOrder.userId,
          status: newOrder.status
        })

        // Hole PayPal-Link aus Environment Variables oder verwende Standard
        const paypalLink = process.env.NEXT_PUBLIC_PAYPAL_PAYMENT_LINK || 'https://paypal.me/SimexMafia'

        // Produkte werden zum Inventar hinzugefügt, aber als "ausstehend" markiert
        // Sie können erst eingelöst werden, wenn die Bestellung "completed" ist
        orderItems.forEach(item => {
          const cartItem = cartItems.find(ci => ci.product.id === item.id)
          if (cartItem) {
            for (let i = 0; i < item.quantity; i++) {
              addToInventory(
                cartItem.product,
                'purchase',
                newOrder.id, // Bestell-ID als sourceId
                'Kauf'
              )
            }
          }
        })

        // Store orderId in localStorage as fallback for callback
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingPayPalOrderId', newOrder.id)
          localStorage.setItem('pendingPayPalAmount', finalTotal.toFixed(2))
        }

        // Build callback URL
        const callbackUrl = `${window.location.origin}/checkout/paypal/callback`
        
        // PayPal.me Links unterstützen keine Query-Parameter, daher verwenden wir den Betrag im Pfad
        // Format: https://paypal.me/Username/Amount
        let paypalLinkWithOrder: string
        if (paypalLink.includes('paypal.me/')) {
          // PayPal.me Link - Betrag im Pfad
          const baseUrl = paypalLink.replace(/\/$/, '') // Entferne trailing slash falls vorhanden
          paypalLinkWithOrder = `${baseUrl}/${finalTotal.toFixed(2)}`
        } else {
          // Normale PayPal Payment Link - Query-Parameter verwenden
          const separator = paypalLink.includes('?') ? '&' : '?'
          paypalLinkWithOrder = `${paypalLink}${separator}orderId=${newOrder.id}&amount=${finalTotal.toFixed(2)}&return=${encodeURIComponent(callbackUrl)}&cancel_return=${encodeURIComponent(callbackUrl + '?cancel=true')}`
        }

        // Send order confirmation email
        if (user?.email && user?.firstName) {
          sendOrderConfirmationEmail(
            user.email,
            user.firstName,
            newOrder.id,
            finalTotal,
            orderItems.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            }))
          ).catch((error) => {
            console.error('Error sending order confirmation email:', error)
          })
        }

        // Weiterleitung zu PayPal
        showSuccess('Weiterleitung zu PayPal...', 2000)
        window.location.href = paypalLinkWithOrder
        return
      } catch (error: any) {
        console.error('PayPal error:', error)
        showError('Fehler beim Initialisieren der Zahlung')
        setIsProcessing(false)
        return
      }
    }
  }

  const handleStripePaymentSuccess = async (paymentIntentId: string) => {
    if (!stripeOrderId) return

    const confirmation = await confirmStripePayment(paymentIntentId)
    if (!confirmation.success) {
      showError(confirmation.error || 'Zahlung konnte nicht bestätigt werden')
      return
    }

    await updateOrderStatus(stripeOrderId, 'completed')

    if (coinsEarned > 0 && user) {
      addCoins(coinsEarned)
      updateUser({ totalSpent: (user.totalSpent || 0) + finalTotal })
    }

    if (user?.email && user?.firstName) {
      sendOrderConfirmationEmail(
        user.email,
        user.firstName,
        stripeOrderId,
        finalTotal,
        cartItems.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        }))
      ).catch((error) => {
        console.error('Error sending order confirmation email:', error)
      })
    }

    showSuccess('Zahlung erfolgreich!', 3000)
    clearCart()
    router.push(`/checkout/confirmation?orderId=${stripeOrderId}`)
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Ihr Warenkorb ist leer</h1>
          <p className="text-gray-400 mb-8">Fügen Sie einige Produkte zu Ihrem Warenkorb hinzu, bevor Sie zur Kasse gehen.</p>
          <Link
            href="/products"
            className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-lg transition-all transform hover:scale-105"
          >
            Produkte durchsuchen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Warenkorb
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Kasse</h1>
          <p className="text-gray-400">Schließen Sie Ihren Kauf sicher ab</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Billing Information */}
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Shield className="w-6 h-6 mr-2 text-purple-400" />
                Rechnungsinformationen
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-gray-300 mb-2">
                    E-Mail-Adresse *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 sm:py-2 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-base sm:text-sm ${
                      errors.email ? 'border-red-500' : 'border-purple-500/30'
                    }`}
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-gray-300 mb-2">
                      Vorname *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 sm:py-2 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-base sm:text-sm ${
                        errors.firstName ? 'border-red-500' : 'border-purple-500/30'
                      }`}
                      placeholder="John"
                    />
                    {errors.firstName && <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-gray-300 mb-2">
                      Nachname *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 sm:py-2 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-base sm:text-sm ${
                        errors.lastName ? 'border-red-500' : 'border-purple-500/30'
                      }`}
                      placeholder="Doe"
                    />
                    {errors.lastName && <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-gray-300 mb-2">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 sm:py-2 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-base sm:text-sm ${
                      errors.address ? 'border-red-500' : 'border-purple-500/30'
                    }`}
                    placeholder="123 Main Street"
                  />
                  {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-gray-300 mb-2">
                      Stadt *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 sm:py-2 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-base sm:text-sm ${
                        errors.city ? 'border-red-500' : 'border-purple-500/30'
                      }`}
                      placeholder="Berlin"
                    />
                    {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label htmlFor="postalCode" className="block text-gray-300 mb-2">
                      Postleitzahl *
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 sm:py-2 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-base sm:text-sm ${
                        errors.postalCode ? 'border-red-500' : 'border-purple-500/30'
                      }`}
                      placeholder="10115"
                    />
                    {errors.postalCode && <p className="text-red-400 text-sm mt-1">{errors.postalCode}</p>}
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-gray-300 mb-2">
                      Land *
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 sm:py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors text-base sm:text-sm"
                    >
                      <option value="Germany">Germany</option>
                      <option value="Austria">Austria</option>
                      <option value="Switzerland">Switzerland</option>
                      <option value="France">France</option>
                      <option value="Netherlands">Netherlands</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <CreditCard className="w-6 h-6 mr-2 text-purple-400" />
                Zahlungsinformationen
              </h2>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-gray-300 mb-3">Zahlungsmethode *</label>
                <div
                  className={`grid grid-cols-1 gap-4 ${
                    stripeEnabled && paypalEnabled
                      ? 'md:grid-cols-2 lg:grid-cols-4'
                      : stripeEnabled
                        ? 'md:grid-cols-2 lg:grid-cols-3'
                        : paypalEnabled
                          ? 'md:grid-cols-3'
                          : 'md:grid-cols-2'
                  }`}
                >
                  {paypalEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('paypal')
                        setStripeOrderId(null)
                      }}
                      className={`p-4 sm:p-3 border-2 rounded-lg transition-all touch-manipulation min-h-[80px] sm:min-h-[auto] ${
                        paymentMethod === 'paypal'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-purple-500/30 bg-fortnite-darker hover:border-purple-500/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Wallet className={`w-5 h-5 ${paymentMethod === 'paypal' ? 'text-purple-400' : 'text-gray-400'}`} />
                        <div className="text-left">
                          <div className={`font-semibold ${paymentMethod === 'paypal' ? 'text-white' : 'text-gray-300'}`}>
                            PayPal
                          </div>
                          <div className="text-xs text-gray-400">Sichere Online-Zahlung</div>
                        </div>
                      </div>
                    </button>
                  )}
                  {stripeEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('credit-card')
                        setStripeOrderId(null)
                      }}
                      className={`p-4 sm:p-3 border-2 rounded-lg transition-all touch-manipulation min-h-[80px] sm:min-h-[auto] ${
                        paymentMethod === 'credit-card'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-purple-500/30 bg-fortnite-darker hover:border-purple-500/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <CreditCard className={`w-5 h-5 ${paymentMethod === 'credit-card' ? 'text-purple-400' : 'text-gray-400'}`} />
                        <div className="text-left">
                          <div className={`font-semibold ${paymentMethod === 'credit-card' ? 'text-white' : 'text-gray-300'}`}>
                            Karte
                          </div>
                          <div className="text-xs text-gray-400">Visa, Mastercard via Stripe</div>
                        </div>
                      </div>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('cash')
                      setStripeOrderId(null)
                    }}
                    className={`p-4 sm:p-3 border-2 rounded-lg transition-all touch-manipulation min-h-[80px] sm:min-h-[auto] ${
                      paymentMethod === 'cash'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-purple-500/30 bg-fortnite-darker hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Banknote className={`w-5 h-5 ${paymentMethod === 'cash' ? 'text-purple-400' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <div className={`font-semibold ${paymentMethod === 'cash' ? 'text-white' : 'text-gray-300'}`}>
                          Barzahlung
                        </div>
                        <div className="text-xs text-gray-400">Zahlung bei Abholung</div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('goofycoins')
                      setStripeOrderId(null)
                    }}
                    disabled={!canPayWithGoofyCoins}
                    className={`p-4 sm:p-3 border-2 rounded-lg transition-all touch-manipulation min-h-[80px] sm:min-h-[auto] ${
                      paymentMethod === 'goofycoins'
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : canPayWithGoofyCoins
                        ? 'border-yellow-500/30 bg-fortnite-darker hover:border-yellow-500/50'
                        : 'border-gray-600/30 bg-fortnite-darker opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Coins className={`w-5 h-5 ${paymentMethod === 'goofycoins' ? 'text-yellow-400' : canPayWithGoofyCoins ? 'text-yellow-400' : 'text-gray-500'}`} />
                      <div className="text-left">
                        <div className={`font-semibold ${paymentMethod === 'goofycoins' ? 'text-white' : canPayWithGoofyCoins ? 'text-gray-300' : 'text-gray-500'}`}>
                          GoofyCoins
                        </div>
                        <div className="text-xs text-gray-400">
                          {canPayWithGoofyCoins 
                            ? `${requiredGoofyCoins.toLocaleString()} Coins`
                            : `Nicht genug (${user?.goofyCoins || 0}/${requiredGoofyCoins})`
                          }
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    <strong>Hinweis:</strong> Bei Barzahlung wird Ihre Bestellung erstellt, aber erst nach Zahlung bei der Abholung aktiviert. 
                    Sie erhalten eine Bestätigungs-E-Mail mit weiteren Informationen.
                  </p>
                </div>
              )}

              {paypalEnabled && paymentMethod === 'paypal' && !stripeOrderId && (
                <div className="space-y-4">
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <p className="text-gray-300 text-sm mb-2">
                      Sie werden nach dem Klick auf &quot;Kauf abschließen&quot; zu PayPal weitergeleitet.
                    </p>
                    <p className="text-gray-400 text-xs">
                      Nach erfolgreicher Zahlung erhalten Sie eine Bestätigungs-E-Mail.
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === 'credit-card' && !stripeOrderId && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
                  <p className="text-gray-300 text-sm">
                    Nach dem Klick auf &quot;Kauf abschließen&quot; geben Sie Ihre Kartendaten sicher über Stripe ein.
                  </p>
                </div>
              )}

              {stripeOrderId && (
                <div className="mb-6">
                  <p className="text-gray-300 text-sm mb-4">
                    Bestellung <span className="text-purple-400">{stripeOrderId}</span> – Kartendaten eingeben:
                  </p>
                  <StripeCheckoutSection
                    amount={finalTotal}
                    orderId={stripeOrderId}
                    onSuccess={handleStripePaymentSuccess}
                    onError={(msg) => showError(msg)}
                  />
                  <button
                    type="button"
                    onClick={() => setStripeOrderId(null)}
                    className="mt-4 text-sm text-gray-400 hover:text-white"
                  >
                    ← Andere Zahlungsmethode
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-6">Bestellübersicht</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-3">
                    <div className="relative w-16 h-16 bg-gradient-to-br from-purple-900/50 to-yellow-900/50 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xl">🎮</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-white font-semibold">€{(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Discount Code Input */}
              <div className="mb-6 border-b border-purple-500/20 pb-4">
                {!appliedDiscountCode ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rabattcode
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => {
                          setDiscountCode(e.target.value.toUpperCase())
                          setDiscountError('')
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleApplyDiscountCode()
                          }
                        }}
                        placeholder="Code eingeben"
                        className="flex-1 px-4 py-3 sm:py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-base sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleApplyDiscountCode}
                        disabled={isApplyingCode}
                        className="px-4 py-3 sm:py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center space-x-2 touch-manipulation min-h-[44px] sm:min-h-[36px] text-base sm:text-sm"
                      >
                        <Tag className="w-4 h-4" />
                        <span>{isApplyingCode ? 'Prüft...' : 'Anwenden'}</span>
                      </button>
                    </div>
                    {discountError && (
                      <p className="text-red-400 text-sm mt-2">{discountError}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Check className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-green-400 font-semibold text-sm">
                            {appliedDiscountCode.code}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {appliedDiscountCode.description || `${appliedDiscountCode.value}${appliedDiscountCode.type === 'percentage' ? '%' : '€'} Rabatt`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveDiscountCode}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-purple-500/20 pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-gray-300">
                  <span>Zwischensumme</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Servicegebühr</span>
                  <span>€{serviceFee.toFixed(2)}</span>
                </div>
                {codeDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Rabattcode ({appliedDiscountCode?.code})</span>
                    <span>-€{codeDiscount.toFixed(2)}</span>
                  </div>
                )}
                {userTier.discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>{mockUser.tier} Tier Rabatt ({userTier.discount}%)</span>
                    <span>-€{tierDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-purple-500/20 pt-2 flex justify-between">
                  <span className="text-white font-bold text-lg">Gesamt</span>
                  <span className="text-white font-bold text-lg">€{finalTotal.toFixed(2)}</span>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-4">
                  <div className="flex items-center space-x-2 text-yellow-400">
                    <Coins className="w-5 h-5" />
                    <span className="text-sm font-semibold">
                      Sie erhalten {coinsEarned} GoofyCoins
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 text-green-400">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-medium">Sicherer Checkout</span>
                </div>
              </div>

              {/* Submit Button */}
              {!stripeOrderId && (
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-4 sm:py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50 flex items-center justify-center space-x-2 touch-manipulation min-h-[56px] sm:min-h-[48px] text-base sm:text-sm"
                >
                  {mounted && isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Wird verarbeitet...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>
                        {paymentMethod === 'credit-card'
                          ? 'Weiter zur Kartenzahlung'
                          : 'Kauf abschließen'}
                      </span>
                    </>
                  )}
                </button>
              )}

              <p className="text-gray-400 text-xs text-center mt-4">
                Durch den Abschluss dieses Kaufs stimmen Sie unseren Allgemeinen Geschäftsbedingungen und der Datenschutzerklärung zu
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

