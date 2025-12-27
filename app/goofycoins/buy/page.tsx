'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { goofyCoinsPackages, GoofyCoinsPackage, calculateTotalCoins, calculatePricePerCoin } from '@/data/goofyCoinsPackages'
import { mockUser } from '@/data/user'
import { OrderItem, createOrder, processPayment, PaymentDetails } from '@/data/payments'
import PaymentCheckout from '@/components/PaymentCheckout'
import { useToast } from '@/contexts/ToastContext'
import { Coins, ShoppingCart, Check, Sparkles, CreditCard, Zap, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function BuyGoofyCoinsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user, addCoins } = useAuth()
  
  // All hooks must be called before any conditional returns
  const [selectedPackage, setSelectedPackage] = useState<GoofyCoinsPackage | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPaymentCheckout, setShowPaymentCheckout] = useState(false)
  const { showSuccess: showToastSuccess, showError: showToastError } = useToast()
  
  // Get userCoins from AuthContext
  const userCoins = user?.goofyCoins || 0

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/goofycoins/buy')
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

  const handlePurchase = (pkg: GoofyCoinsPackage) => {
    setSelectedPackage(pkg)
  }

  const handleConfirmPurchase = () => {
    if (!selectedPackage) return
    setShowPaymentCheckout(true)
  }

  const handlePaymentSuccess = (orderId: string) => {
    if (!selectedPackage) return

    // Nach erfolgreicher Zahlung, füge Coins hinzu via AuthContext
    const totalCoins = calculateTotalCoins(selectedPackage)
    addCoins(totalCoins)
    setShowSuccess(true)
    setShowPaymentCheckout(false)
    setSelectedPackage(null)
    
    // Toast-Benachrichtigung
    showToastSuccess(`${totalCoins} GoofyCoins wurden Ihrem Konto hinzugefügt!`, 5000)

    // Nach 3 Sekunden Erfolgs-Modal schließen
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">GoofyCoins kaufen</h1>
          <p className="text-xl text-gray-400 mb-6">
            Kaufe GoofyCoins und öffne mehr Säcke!
          </p>
          <div className="flex items-center justify-center space-x-4">
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-6 py-3">
              <div className="flex items-center space-x-2">
                <Coins className="w-6 h-6 text-yellow-400" />
                <span className="text-yellow-400 font-semibold text-xl">{userCoins}</span>
                <span className="text-gray-400">GoofyCoins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {goofyCoinsPackages.map((pkg) => {
            const totalCoins = calculateTotalCoins(pkg)
            const pricePerCoin = calculatePricePerCoin(pkg)
            
            return (
              <div
                key={pkg.id}
                className={`bg-fortnite-dark border rounded-lg p-6 hover:border-purple-500/50 transition-all relative overflow-hidden group ${
                  pkg.popular
                    ? 'border-purple-500/50 ring-2 ring-purple-500/30'
                    : pkg.bestValue
                    ? 'border-yellow-500/50 ring-2 ring-yellow-500/30'
                    : 'border-purple-500/20'
                }`}
              >
                {/* Badges */}
                {pkg.popular && (
                  <div className="absolute top-4 right-4 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    BELIEBT
                  </div>
                )}
                {pkg.bestValue && (
                  <div className="absolute top-4 right-4 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    BESTES ANGEBOT
                  </div>
                )}

                {/* Glow Effect */}
                {(pkg.popular || pkg.bestValue) && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity">
                    <div
                      className="absolute inset-0"
                      style={{
                        background: pkg.popular
                          ? 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)'
                          : 'radial-gradient(circle, rgba(234, 179, 8, 0.4) 0%, transparent 70%)',
                      }}
                    />
                  </div>
                )}

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="text-6xl mb-4 text-center">{pkg.icon}</div>

                  {/* Name */}
                  <h3 className="text-2xl font-bold text-white mb-2 text-center">{pkg.name}</h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-4 text-center min-h-[40px]">{pkg.description}</p>

                  {/* Coins */}
                  <div className="bg-fortnite-darker rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Coins className="w-6 h-6 text-yellow-400" />
                      <span className="text-3xl font-bold text-yellow-400">{pkg.coins}</span>
                      <span className="text-gray-400">GoofyCoins</span>
                    </div>
                    {pkg.bonus && pkg.bonus > 0 && (
                      <div className="flex items-center justify-center space-x-2">
                        <Sparkles className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-semibold">+{pkg.bonus} Bonus</span>
                        <span className="text-gray-500 text-sm">= {totalCoins} gesamt</span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-white mb-1">€{pkg.price.toFixed(2)}</div>
                    <div className="text-xs text-gray-400">
                      €{pricePerCoin.toFixed(4)} pro Coin
                    </div>
                  </div>

                  {/* Buy Button */}
                  <button
                    onClick={() => handlePurchase(pkg)}
                    className={`w-full font-semibold px-4 py-3 rounded-lg transition-all transform hover:scale-105 ${
                      pkg.popular
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                        : pkg.bestValue
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                    }`}
                  >
                    Jetzt kaufen
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Warum GoofyCoins kaufen?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <Zap className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">Sofort verfügbar</h3>
                <p className="text-gray-400 text-sm">
                  Ihre GoofyCoins werden sofort nach dem Kauf gutgeschrieben
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Sparkles className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">Bonus-Coins</h3>
                <p className="text-gray-400 text-sm">
                  Größere Pakete enthalten Bonus-Coins - mehr für Ihr Geld!
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <ShoppingCart className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">Säcke öffnen</h3>
                <p className="text-gray-400 text-sm">
                  Verwenden Sie GoofyCoins, um Säcke zu öffnen und tolle Belohnungen zu gewinnen
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Modal */}
        {selectedPackage && !showPaymentCheckout && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-fortnite-dark border border-purple-500/30 rounded-lg p-8 max-w-md w-full relative">
              <button
                onClick={() => setSelectedPackage(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{selectedPackage.icon}</div>
                <h2 className="text-3xl font-bold text-white mb-2">{selectedPackage.name}</h2>
                <p className="text-gray-400">{selectedPackage.description}</p>
              </div>

              {/* Package Details */}
              <div className="bg-fortnite-darker rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">GoofyCoins:</span>
                    <span className="text-white font-semibold">{selectedPackage.coins}</span>
                  </div>
                  {selectedPackage.bonus && selectedPackage.bonus > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Bonus:</span>
                      <span className="text-green-400 font-semibold">+{selectedPackage.bonus}</span>
                    </div>
                  )}
                  <div className="border-t border-purple-500/20 pt-3 flex items-center justify-between">
                    <span className="text-white font-semibold">Gesamt:</span>
                    <span className="text-yellow-400 font-bold text-xl">
                      {calculateTotalCoins(selectedPackage)} GoofyCoins
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Preis:</span>
                    <span className="text-white font-bold text-xl">€{selectedPackage.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Purchase Button */}
              <button
                onClick={handleConfirmPurchase}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Zur Zahlung - €{selectedPackage.price.toFixed(2)}</span>
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Durch den Kauf stimmen Sie unseren AGB zu
              </p>
            </div>
          </div>
        )}

        {/* Payment Checkout Modal */}
        {showPaymentCheckout && selectedPackage && (
          <PaymentCheckout
            items={[
              {
                id: selectedPackage.id,
                type: 'goofycoins',
                name: selectedPackage.name,
                price: selectedPackage.price,
                quantity: 1,
                metadata: {
                  packageId: selectedPackage.id,
                  coins: selectedPackage.coins,
                  bonus: selectedPackage.bonus || 0,
                  totalCoins: calculateTotalCoins(selectedPackage),
                },
              },
            ]}
            total={selectedPackage.price}
            title={`${selectedPackage.name} kaufen`}
            onSuccess={handlePaymentSuccess}
            onCancel={() => {
              setShowPaymentCheckout(false)
            }}
          />
        )}

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-fortnite-dark border border-green-500/30 rounded-lg p-8 max-w-md w-full relative animate-[fadeInScale_0.5s_ease-out]">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-12 h-12 text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Kauf erfolgreich!</h2>
                <p className="text-gray-400 mb-6">
                  Ihre GoofyCoins wurden Ihrem Konto gutgeschrieben
                </p>
                <div className="bg-fortnite-darker rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center space-x-2">
                    <Coins className="w-6 h-6 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold text-xl">{userCoins}</span>
                    <span className="text-gray-400">GoofyCoins</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Verstanden
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

