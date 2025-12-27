'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, CheckCircle } from 'lucide-react'
import { Product } from '@/types'
import { usePriceAlerts } from '@/hooks/usePriceAlerts'

interface PriceAlertButtonProps {
  product: Product
  variant?: 'default' | 'compact'
}

export default function PriceAlertButton({ product, variant = 'default' }: PriceAlertButtonProps) {
  const { addAlert, removeAlert, hasAlert, getAlert } = usePriceAlerts()
  const [showModal, setShowModal] = useState(false)
  const [targetPrice, setTargetPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const hasActiveAlert = hasAlert(product.id)
  const alert = getAlert(product.id)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showModal])

  const handleToggleAlert = () => {
    if (hasActiveAlert) {
      removeAlert(alert!.id)
      setSuccess(false)
    } else {
      setShowModal(true)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(targetPrice)
    
    if (isNaN(price) || price <= 0) {
      return
    }

    if (price >= product.price) {
      window.alert('Der Zielpreis muss niedriger als der aktuelle Preis sein.')
      return
    }

    setIsSubmitting(true)
    addAlert(product, price)
    setIsSubmitting(false)
    setShowModal(false)
    setTargetPrice('')
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={handleToggleAlert}
          className={`p-2 rounded-lg transition-colors ${
            hasActiveAlert
              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
          }`}
          title={hasActiveAlert ? 'Preisalarm entfernen' : 'Preisalarm einrichten'}
        >
          {hasActiveAlert ? (
            <Bell className="w-4 h-4 fill-current" />
          ) : (
            <BellOff className="w-4 h-4" />
          )}
        </button>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowModal(false)}>
            <div className="bg-fortnite-dark border border-purple-500/30 rounded-lg p-6 max-w-md w-full mx-4 relative z-[101]" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-white font-semibold text-lg mb-4">Preisalarm einrichten</h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-300 text-sm mb-2">
                    Zielpreis (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={product.price}
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-full px-4 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder={`Max. €${product.price.toFixed(2)}`}
                    required
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    Aktueller Preis: €{product.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Alarm einrichten
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={handleToggleAlert}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          hasActiveAlert
            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30'
            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30'
        }`}
      >
        {success ? (
          <>
            <CheckCircle className="w-5 h-5" />
            <span>Alarm eingerichtet!</span>
          </>
        ) : hasActiveAlert ? (
          <>
            <Bell className="w-5 h-5 fill-current" />
            <span>Alarm aktiv (€{alert?.targetPrice.toFixed(2)})</span>
          </>
        ) : (
          <>
            <BellOff className="w-5 h-5" />
            <span>Preisalarm einrichten</span>
          </>
        )}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowModal(false)}>
          <div className="bg-fortnite-dark border border-purple-500/30 rounded-lg p-6 max-w-md w-full mx-4 relative z-[101]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg mb-4">Preisalarm einrichten</h3>
            <p className="text-gray-400 text-sm mb-4">
              Wir benachrichtigen Sie, wenn der Preis von <strong className="text-white">{product.name}</strong> auf oder unter Ihren Zielpreis fällt.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">
                  Zielpreis (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={product.price}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full px-4 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder={`Max. €${product.price.toFixed(2)}`}
                  required
                />
                <p className="text-gray-400 text-xs mt-1">
                  Aktueller Preis: €{product.price.toFixed(2)}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Alarm einrichten
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

