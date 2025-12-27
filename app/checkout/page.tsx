'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CreditCard, Lock, Shield, CheckCircle, ArrowLeft, Coins, Banknote } from 'lucide-react'
import Link from 'next/link'
import { mockUser } from '@/data/user'
import { calculateCoinsEarned, TIER_INFO } from '@/types/user'
import { useCart } from '@/contexts/CartContext'
import { createOrder, processPayment, OrderItem, PaymentDetails, Order } from '@/data/payments'
import { addToInventory } from '@/data/inventory'
import { useToast } from '@/contexts/ToastContext'
import { validateDiscountCode, calculateDiscount, applyDiscountCode, DiscountCode } from '@/data/discountCodes'
import { Tag, X, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { sendOrderConfirmationEmail } from '@/lib/email'

export default function CheckoutPage() {
  const router = useRouter()
  const { cartItems, clearCart, getTotalPrice } = useCart()
  const { showSuccess, showError } = useToast()
  const { isAuthenticated, isLoading: authLoading, user, addCoins, subtractCoins, updateUser } = useAuth()

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
  const [discountError, setDiscountError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'cash' | 'goofycoins'>('paypal')
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
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

  // Berechne Subtotal basierend auf originalPrice (falls vorhanden)
  const subtotal = cartItems.reduce((total, item) => {
    const itemPrice = item.product.originalPrice || item.product.price
    return total + itemPrice * item.quantity
  }, 0)
  const serviceFee = 0.99
  const userTier = TIER_INFO[user?.tier || mockUser.tier]
  
  // Calculate discount from code
  const codeDiscount = appliedDiscountCode 
    ? calculateDiscount(appliedDiscountCode, subtotal + serviceFee)
    : 0
  
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

  const handleApplyDiscountCode = () => {
    if (!discountCode.trim()) {
      setDiscountError('Bitte geben Sie einen Rabattcode ein')
      return
    }

    const orderItems: OrderItem[] = cartItems.map(item => ({
      id: item.product.id,
      type: 'product',
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
    }))

    const validation = validateDiscountCode(discountCode, subtotal + serviceFee, orderItems)
    
    if (validation.valid && validation.discountCode) {
      setAppliedDiscountCode(validation.discountCode)
      setDiscountError('')
      showSuccess(`Rabattcode "${validation.discountCode.code}" angewendet!`)
    } else {
      setDiscountError(validation.error || 'Ungültiger Rabattcode')
      setAppliedDiscountCode(null)
    }
  }

  const handleRemoveDiscountCode = () => {
    setAppliedDiscountCode(null)
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

    // Erstelle Bestellung - verwende originalPrice falls vorhanden
    const orderItems: OrderItem[] = cartItems.map(item => {
      const itemPrice = item.product.originalPrice || item.product.price
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

    // Apply discount code if used
    if (appliedDiscountCode) {
      applyDiscountCode(appliedDiscountCode.code)
    }

    // GoofyCoins-Zahlung
    if (paymentMethod === 'goofycoins') {
      if (!user || !canPayWithGoofyCoins) {
        showError('Sie haben nicht genügend GoofyCoins für diese Bestellung')
        setIsProcessing(false)
        return
      }

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

      // Subtrahiere GoofyCoins
      const success = subtractCoins(requiredGoofyCoins)
      if (!success) {
        showError('Fehler beim Abziehen der GoofyCoins')
        setIsProcessing(false)
        return
      }

      // Füge Produkte zum Inventar hinzu
      orderItems.forEach(item => {
        const cartItem = cartItems.find(ci => ci.product.id === item.id)
        if (cartItem) {
          for (let i = 0; i < item.quantity; i++) {
            addToInventory(
              cartItem.product,
              'purchase',
              newOrder.id,
              'Kauf'
            )
          }
        }
      })

      showSuccess(`Bestellung erfolgreich! ${requiredGoofyCoins} GoofyCoins wurden abgezogen.`, 5000)
      clearCart()
      router.push(`/checkout/confirmation?orderId=${newOrder.id}`)
      return
    }

    // Barzahlung
    if (paymentMethod === 'cash') {
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

      // Bei Barzahlung bleibt Status "pending" bis manuell bestätigt
      // Coins werden erst nach Bestätigung der Zahlung hinzugefügt
      // Produkte werden noch nicht ins Inventar hinzugefügt
      
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

    // PayPal-Zahlung
    if (paymentMethod === 'paypal') {
      try {
        // Erstelle Bestellung
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

        // Hole PayPal-Link aus Environment Variables
        const paypalLink = process.env.NEXT_PUBLIC_PAYPAL_PAYMENT_LINK || ''
        
        if (!paypalLink) {
          showError('PayPal-Zahlungslink ist nicht konfiguriert. Bitte kontaktieren Sie uns.')
          setIsProcessing(false)
          return
        }

        // Füge Order-ID und Betrag als Parameter zum PayPal-Link hinzu
        const separator = paypalLink.includes('?') ? '&' : '?'
        const paypalLinkWithOrder = `${paypalLink}${separator}orderId=${newOrder.id}&amount=${finalTotal.toFixed(2)}`

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
                    className={`w-full px-4 py-2 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors ${
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
                      className={`w-full px-4 py-2 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors ${
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
                      className={`w-full px-4 py-2 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors ${
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
                    className={`w-full px-4 py-2 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors ${
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
                      className={`w-full px-4 py-2 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors ${
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
                      className={`w-full px-4 py-2 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors ${
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
                      className="w-full px-4 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('paypal')
                    }}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'paypal'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-purple-500/30 bg-fortnite-darker hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard className={`w-5 h-5 ${paymentMethod === 'paypal' ? 'text-purple-400' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <div className={`font-semibold ${paymentMethod === 'paypal' ? 'text-white' : 'text-gray-300'}`}>
                          PayPal
                        </div>
                        <div className="text-xs text-gray-400">Sichere Online-Zahlung</div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('cash')
                    }}
                    className={`p-4 border-2 rounded-lg transition-all ${
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
                    }}
                    disabled={!canPayWithGoofyCoins}
                    className={`p-4 border-2 rounded-lg transition-all ${
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

              {paymentMethod === 'paypal' ? (
                <div className="space-y-4">
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <p className="text-gray-300 text-sm mb-2">
                      Sie werden nach dem Klick auf "Bestellung abschließen" zu PayPal weitergeleitet, um die Zahlung sicher abzuwickeln.
                    </p>
                    <p className="text-gray-400 text-xs">
                      Nach erfolgreicher Zahlung erhalten Sie eine Bestätigungs-E-Mail.
                    </p>
                  </div>
                </div>
              ) : null}
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
                        className="flex-1 px-4 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyDiscountCode}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Tag className="w-4 h-4" />
                        <span>Anwenden</span>
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
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50 flex items-center justify-center space-x-2"
              >
                {mounted && isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Kauf abschließen</span>
                  </>
                )}
              </button>

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

