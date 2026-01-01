'use client'

import Image from 'next/image'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import AnimatedSection from '@/components/AnimatedSection'

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice } = useCart()

  const handleQuantityChange = (productId: string, delta: number) => {
    const item = cartItems.find((item) => item.product.id === productId)
    if (item) {
      const newQuantity = item.quantity + delta
      updateQuantity(productId, Math.max(1, newQuantity))
    }
  }

  const subtotal = getTotalPrice()
  const serviceFee = 0.99
  const total = subtotal + serviceFee

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen py-20 page-transition">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection animationType="fadeInScale">
            <ShoppingCart className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Ihr Warenkorb ist leer</h1>
            <p className="text-gray-400 mb-8">Beginnen Sie mit dem Einkaufen, um Artikel zu Ihrem Warenkorb hinzuzufügen!</p>
            <Link
              href="/products"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-lg smooth-hover"
            >
              Produkte durchsuchen
            </Link>
          </AnimatedSection>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 page-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animationType="fadeInUp">
          <h1 className="text-4xl font-bold text-white mb-8">Warenkorb</h1>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.product.id}
                className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Product Image */}
                  <div className="relative w-full sm:w-32 h-32 bg-gradient-to-br from-purple-900/50 to-yellow-900/50 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="128px"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl">🎮</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <Link href={`/products/${item.product.id}`}>
                      <h3 className="text-white font-semibold text-lg mb-2 hover:text-purple-400 transition-colors">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-gray-400 text-sm mb-2">{item.product.platform}</p>
                    <p className="text-purple-400 text-sm mb-4">Verkauft von: {item.product.seller.name}</p>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuantityChange(item.product.id, -1)}
                          className="bg-fortnite-darker border border-purple-500/30 text-white p-2.5 sm:p-2 rounded hover:bg-purple-500/20 transition-colors touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center"
                        >
                          <Minus className="w-5 h-5 sm:w-4 sm:h-4" />
                        </button>
                        <span className="text-white font-medium w-10 sm:w-8 text-center text-base sm:text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.product.id, 1)}
                          className="bg-fortnite-darker border border-purple-500/30 text-white p-2.5 sm:p-2 rounded hover:bg-purple-500/20 transition-colors touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center"
                        >
                          <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="text-white font-bold text-lg sm:text-base">
                          €{(item.product.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-400 hover:text-red-300 transition-colors touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center p-2.5 sm:p-2"
                          title="Entfernen"
                        >
                          <Trash2 className="w-5 h-5 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-6">Bestellübersicht</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-300">
                  <span>Zwischensumme</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Servicegebühr</span>
                  <span>€{serviceFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-purple-500/20 pt-4 flex justify-between">
                  <span className="text-white font-bold text-lg">Gesamt</span>
                  <span className="text-white font-bold text-lg">€{total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50 flex items-center justify-center space-x-2 mb-4"
              >
                <span>Zur Kasse</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/products"
                className="block text-center text-purple-400 hover:text-purple-300 transition-colors"
              >
                Weiter einkaufen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

