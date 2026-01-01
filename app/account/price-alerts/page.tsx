'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, BellOff, ArrowLeft, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { usePriceAlerts, PriceAlert } from '@/hooks/usePriceAlerts'
import ProductCard from '@/components/ProductCard'

export default function PriceAlertsPage() {
  const { alerts, removeAlert, checkPriceDrops } = usePriceAlerts()
  const [notifications, setNotifications] = useState<PriceAlert[]>([])

  useEffect(() => {
    // Check for price drops on mount
    const newNotifications = checkPriceDrops()
    if (newNotifications.length > 0) {
      setNotifications(newNotifications)
    }
  }, [checkPriceDrops])

  const activeAlerts = alerts.filter((a) => !a.notified)
  const triggeredAlerts = alerts.filter((a) => a.notified)

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Konto
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Preisalarme</h1>
          <p className="text-gray-400">Verwalten Sie Ihre Preisalarme und erhalten Sie Benachrichtigungen bei Preisänderungen</p>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-3">
            {notifications.map((alert) => (
              <div
                key={alert.id}
                className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-start space-x-4"
              >
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-green-400 font-semibold mb-1">Preisalarm ausgelöst!</h3>
                  <p className="text-gray-300 text-sm">
                    <strong>{alert.product.name}</strong> ist jetzt für nur{' '}
                    <strong className="text-green-400">€{alert.currentPrice.toFixed(2)}</strong> verfügbar!
                    <br />
                    Ihr Zielpreis war: €{alert.targetPrice.toFixed(2)}
                  </p>
                  <Link
                    href={`/products/${alert.product.id}`}
                    className="inline-block mt-3 text-purple-400 hover:text-purple-300 text-sm font-medium"
                  >
                    Jetzt ansehen →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Alerts */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
            <Bell className="w-6 h-6 text-yellow-400" />
            <span>Aktive Alarmen ({activeAlerts.length})</span>
          </h2>

          {activeAlerts.length > 0 ? (
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Product Image */}
                    <div className="relative w-full md:w-32 h-32 bg-gradient-to-br from-purple-900/50 to-yellow-900/50 rounded-lg overflow-hidden flex-shrink-0">
                      {alert.product.image ? (
                        <Image
                          src={alert.product.image}
                          alt={alert.product.name}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl">🎮</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <Link href={`/products/${alert.product.id}`}>
                        <h3 className="text-white font-semibold text-lg mb-2 hover:text-purple-400 transition-colors">
                          {alert.product.name}
                        </h3>
                      </Link>
                      <p className="text-gray-400 text-sm mb-4">{alert.product.platform}</p>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Aktueller Preis</p>
                          <p className="text-white font-bold text-lg">€{alert.currentPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Zielpreis</p>
                          <p className="text-yellow-400 font-bold text-lg">€{alert.targetPrice.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 text-sm">
                          Erstellt: {new Date(alert.createdAt).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col justify-between">
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Entfernen</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 text-center">
              <BellOff className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">Keine aktiven Preisalarme</p>
              <p className="text-gray-500 text-sm">
                Richten Sie einen Preisalarm ein, um benachrichtigt zu werden, wenn ein Produkt günstiger wird.
              </p>
            </div>
          )}
        </div>

        {/* Triggered Alerts */}
        {triggeredAlerts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span>Ausgelöste Alarmen ({triggeredAlerts.length})</span>
            </h2>
            <div className="space-y-4">
              {triggeredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-fortnite-dark border border-green-500/20 rounded-lg p-6"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative w-full md:w-32 h-32 bg-gradient-to-br from-purple-900/50 to-yellow-900/50 rounded-lg overflow-hidden flex-shrink-0">
                      {alert.product.image ? (
                        <Image
                          src={alert.product.image}
                          alt={alert.product.name}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl">🎮</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Link href={`/products/${alert.product.id}`}>
                        <h3 className="text-white font-semibold text-lg mb-2 hover:text-purple-400 transition-colors">
                          {alert.product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                          Preisalarm ausgelöst!
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Neuer Preis</p>
                          <p className="text-green-400 font-bold text-lg">€{alert.currentPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Zielpreis</p>
                          <p className="text-yellow-400 font-bold text-lg">€{alert.targetPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between">
                      <Link
                        href={`/products/${alert.product.id}`}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors text-center mb-2"
                      >
                        Jetzt ansehen
                      </Link>
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-4 py-2 rounded-lg transition-colors"
                      >
                        Entfernen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}














