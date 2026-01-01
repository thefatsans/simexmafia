'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { CheckCircle, Download, Mail, Home, Package } from 'lucide-react'
import SocialShare from '@/components/SocialShare'
import { getOrderById } from '@/data/payments'
import { useEffect, useState } from 'react'
import { Order } from '@/data/payments'
import { getOrdersFromAPI } from '@/lib/api/orders'
import { useAuth } from '@/contexts/AuthContext'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId') || 'ORD-000000'
  const [order, setOrder] = useState<Order | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const loadOrder = async () => {
      if (orderId) {
        try {
          // Try to load from API first
          if (user?.id) {
            const orders = await getOrdersFromAPI(user.id)
            const apiOrder = orders.find(o => o.id === orderId)
            if (apiOrder) {
              setOrder({
                id: apiOrder.id,
                userId: apiOrder.userId,
                items: apiOrder.items,
                subtotal: apiOrder.subtotal,
                serviceFee: apiOrder.serviceFee,
                discount: apiOrder.discount,
                total: apiOrder.total,
                paymentMethod: apiOrder.paymentMethod as Order['paymentMethod'],
                status: apiOrder.status as Order['status'],
                createdAt: apiOrder.createdAt,
                completedAt: apiOrder.completedAt,
                coinsEarned: apiOrder.coinsEarned,
                discountCode: apiOrder.discountCode,
                statusReason: (apiOrder as any).statusReason,
              })
              return
            }
          }
          
          // Fallback to localStorage
          const foundOrder = await getOrderById(orderId)
          setOrder(foundOrder || null)
        } catch (error) {
          console.error('[Confirmation] Error loading order:', error)
          // Fallback to localStorage
          const foundOrder = await getOrderById(orderId)
          setOrder(foundOrder || null)
        }
      }
    }
    loadOrder()
  }, [orderId, user])

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/20 rounded-full mb-6">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Bestellung bestätigt!</h1>
          <p className="text-gray-400 text-lg">
            Vielen Dank für Ihren Kauf. Ihre Bestellung wurde erfolgreich bearbeitet.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Bestelldetails</h2>
            <span className="bg-purple-500/20 text-purple-300 px-4 py-2 rounded-lg font-semibold">
              {orderId}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-purple-500/20">
              <span className="text-gray-400">Bestelldatum</span>
              <span className="text-white">{new Date().toLocaleDateString('de-DE', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-purple-500/20">
              <span className="text-gray-400">Zahlungsmethode</span>
              <span className="text-white">
                {order ? (
                  order.paymentMethod === 'credit-card' ? 'Kreditkarte' : 
                  order.paymentMethod === 'cash' ? 'Barzahlung' :
                  order.paymentMethod === 'paypal' ? 'PayPal' : 
                  order.paymentMethod
                ) : 'Kreditkarte'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-purple-500/20">
              <span className="text-gray-400">Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                order?.status === 'completed' 
                  ? 'bg-green-500/20 text-green-400' 
                  : order?.status === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {order?.status === 'completed' ? 'Abgeschlossen' : order?.status === 'pending' ? 'Ausstehend' : order?.status || 'Abgeschlossen'}
              </span>
            </div>
            {order?.coinsEarned && order.coinsEarned > 0 && (
              <div className="flex items-center justify-between py-3 border-b border-purple-500/20">
                <span className="text-gray-400">GoofyCoins verdient</span>
                <span className="text-yellow-400 font-semibold">+{order.coinsEarned}</span>
              </div>
            )}
            {order && (
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-400">Gesamtbetrag</span>
                <span className="text-white font-bold text-xl">€{order.total.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Was kommt als Nächstes?</h2>
          <div className="space-y-4">
            {order?.paymentMethod === 'cash' ? (
              <>
                <div className="flex items-start space-x-4">
                  <div className="bg-yellow-500/20 p-3 rounded-lg">
                    <Package className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Barzahlung bei Abholung</h3>
                    <p className="text-gray-400 text-sm">
                      Ihre Bestellung wurde erstellt. Bitte zahlen Sie den Betrag von <strong className="text-white">€{order?.total.toFixed(2)}</strong> bei der Abholung. 
                      Sie erhalten eine Bestätigungs-E-Mail mit weiteren Informationen zur Abholung.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-500/20 p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Überprüfen Sie Ihre E-Mail</h3>
                    <p className="text-gray-400 text-sm">
                      Wir haben Ihnen eine Bestätigungs-E-Mail mit Ihren Bestelldetails und Informationen zur Abholung gesendet.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500/20 p-3 rounded-lg">
                    <Package className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Wichtiger Hinweis</h3>
                    <p className="text-gray-400 text-sm">
                      Ihre Bestellung wird erst nach erfolgreicher Zahlung bei der Abholung aktiviert. 
                      Die digitalen Keys werden Ihnen nach Zahlungseingang zur Verfügung gestellt.
                    </p>
                  </div>
                </div>
              </>
            ) : order?.paymentMethod === 'paypal' ? (
              <>
                {order?.status === 'processing' || order?.status === 'pending' ? (
                  <>
                    <div className="flex items-start space-x-4">
                      <div className="bg-yellow-500/20 p-3 rounded-lg">
                        <Package className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">Zahlung wird bearbeitet</h3>
                        <p className="text-gray-400 text-sm">
                          Ihre PayPal-Zahlung wurde erhalten und wird derzeit überprüft. 
                          Sobald die Zahlung bestätigt wurde, erhalten Sie Zugriff auf Ihre digitalen Keys.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="bg-purple-500/20 p-3 rounded-lg">
                        <Mail className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">Überprüfen Sie Ihre E-Mail</h3>
                        <p className="text-gray-400 text-sm">
                          Wir haben Ihnen eine Bestätigungs-E-Mail mit Ihren Bestelldetails gesendet.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start space-x-4">
                      <div className="bg-green-500/20 p-3 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">PayPal-Zahlung erfolgreich</h3>
                        <p className="text-gray-400 text-sm">
                          Ihre PayPal-Zahlung wurde erfolgreich verarbeitet. Ihre Bestellung wird nun bearbeitet.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="bg-purple-500/20 p-3 rounded-lg">
                        <Mail className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">Überprüfen Sie Ihre E-Mail</h3>
                        <p className="text-gray-400 text-sm">
                          Wir haben Ihnen eine Bestätigungs-E-Mail mit Ihren Bestelldetails und digitalen Keys gesendet.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="bg-purple-500/20 p-3 rounded-lg">
                        <Download className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">Zugriff auf Ihre Produkte</h3>
                        <p className="text-gray-400 text-sm">
                          Ihre digitalen Keys sind in Ihrem Konto verfügbar. Sie können auch Ihre E-Mail für sofortigen Zugriff überprüfen.
                        </p>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-500/20 p-3 rounded-lg">
                    <Package className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Wichtiger Hinweis</h3>
                    <p className="text-gray-400 text-sm">
                      Bitte beachten Sie, dass Rückerstattungen nur verarbeitet werden, bevor Sie den digitalen Key einlösen. 
                      Nach der Aktivierung kann das Produkt nicht zurückerstattet werden.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-500/20 p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Überprüfen Sie Ihre E-Mail</h3>
                    <p className="text-gray-400 text-sm">
                      Wir haben Ihnen eine Bestätigungs-E-Mail mit Ihren Bestelldetails und digitalen Keys gesendet.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-500/20 p-3 rounded-lg">
                    <Download className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Zugriff auf Ihre Produkte</h3>
                    <p className="text-gray-400 text-sm">
                      Ihre digitalen Keys sind in Ihrem Konto verfügbar. Sie können auch Ihre E-Mail für sofortigen Zugriff überprüfen.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-500/20 p-3 rounded-lg">
                    <Package className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Wichtiger Hinweis</h3>
                    <p className="text-gray-400 text-sm">
                      Bitte beachten Sie, dass Rückerstattungen nur verarbeitet werden, bevor Sie den digitalen Key einlösen. 
                      Nach der Aktivierung kann das Produkt nicht zurückerstattet werden.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Share Purchase */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 mb-8">
          <h3 className="text-white font-semibold mb-4 text-center">Teilen Sie Ihren Kauf!</h3>
          <div className="flex justify-center">
            <SocialShare
              url="/"
              title="Ich habe gerade bei SimexMafia eingekauft! 🎮"
              description={`Bestellung ${orderId} erfolgreich abgeschlossen. Entdecke auch die besten Gaming-Deals!`}
              size="lg"
              variant="horizontal"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/account/orders"
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50 text-center"
          >
            Bestellhistorie anzeigen
          </Link>
          <Link
            href="/"
            className="flex-1 bg-fortnite-dark border-2 border-purple-500/50 hover:border-purple-500 text-white font-semibold px-8 py-4 rounded-lg transition-all text-center flex items-center justify-center space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Zurück zur Startseite</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-lg">Lade Bestätigung...</p>
        </div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}


