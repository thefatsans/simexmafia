'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import { getOrders, updateOrderStatus, Order } from '@/data/payments'
import { getOrdersFromAPI, updateOrderStatusAPI } from '@/lib/api/orders'
import { Search, Filter, CheckCircle, XCircle, Clock, Package, Key, Save } from 'lucide-react'

export default function AdminOrdersPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [editingKeys, setEditingKeys] = useState<Record<string, string>>({}) // orderItemId -> key
  const [updatingKeys, setUpdatingKeys] = useState<Set<string>>(new Set()) // orderItemId
  const [statusReasons, setStatusReasons] = useState<Record<string, string>>({}) // orderId -> reason

  useEffect(() => {
    console.log('[Admin Orders] useEffect triggered', { authLoading, user: user?.email })
    
    if (authLoading) {
      console.log('[Admin Orders] Auth still loading...')
      setIsLoading(true)
      return // Wait for auth to load
    }
    
    if (!user) {
      console.log('[Admin Orders] No user, redirecting to login...')
      router.push('/auth/login')
      return
    }
    
    console.log('[Admin Orders] User:', user.email, 'isAdmin:', isAdmin(user.email))
    
    if (!isAdmin(user.email)) {
      console.log('[Admin Orders] User is not admin, redirecting...')
      router.push('/account')
      return
    }
    
    console.log('[Admin Orders] User is admin, loading orders...')
    loadOrders()
    setIsLoading(false)
  }, [user, router, authLoading])

  const loadOrders = async () => {
    try {
      // Versuche zuerst die API zu verwenden (Datenbank)
      try {
        console.log('[Admin Orders] Loading orders from API...')
        // Für Admin: Hole alle Bestellungen (userId wird ignoriert wenn Admin)
        // Verwende eine spezielle Admin-API oder hole alle Bestellungen
        if (!user?.id) {
          throw new Error('User not authenticated')
        }
        const apiOrders = await getOrdersFromAPI(user.id) // API prüft Admin-Rechte serverseitig
        console.log('[Admin Orders] Loaded orders from API:', apiOrders.length)
        
        // Konvertiere API-Format zu Order-Format
        const convertedOrders: Order[] = apiOrders.map((apiOrder: any) => ({
          id: apiOrder.id,
          userId: apiOrder.userId,
          items: apiOrder.items || [],
          subtotal: apiOrder.subtotal,
          serviceFee: apiOrder.serviceFee,
          discount: apiOrder.discount,
          total: apiOrder.total,
          paymentMethod: apiOrder.paymentMethod as any,
          status: apiOrder.status as Order['status'],
          createdAt: apiOrder.createdAt,
          completedAt: apiOrder.completedAt,
          coinsEarned: apiOrder.coinsEarned,
          discountCode: apiOrder.discountCode,
        }))
        
        // Lade statusReason in State für failed/cancelled Bestellungen
        const reasons: Record<string, string> = {}
        apiOrders.forEach((apiOrder: any) => {
          if ((apiOrder.status === 'failed' || apiOrder.status === 'cancelled') && apiOrder.statusReason) {
            reasons[apiOrder.id] = apiOrder.statusReason
          }
        })
        setStatusReasons(reasons)
        
        const sortedOrders = convertedOrders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        console.log('[Admin Orders] Setting orders state from API:', sortedOrders.length, 'orders')
        setOrders(sortedOrders)
        return
      } catch (apiError) {
        console.warn('[Admin Orders] API not available, using localStorage:', apiError)
      }
      
      // Fallback: localStorage
      const allOrders = getOrders()
      console.log('[Admin Orders] Loaded orders from localStorage:', allOrders.length)
      
      const sortedOrders = allOrders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      console.log('[Admin Orders] Setting orders state from localStorage:', sortedOrders.length, 'orders')
      setOrders(sortedOrders)
    } catch (error) {
      console.error('[Admin Orders] Error loading orders:', error)
      setOrders([])
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status'], reason?: string) => {
    try {
      console.log('[Admin Orders] Updating status:', { orderId, newStatus, reason })
      // Versuche zuerst die API zu verwenden
      try {
        await updateOrderStatusAPI(orderId, newStatus, reason, user?.id)
        console.log('[Admin Orders] Order status updated via API')
      } catch (apiError: any) {
        console.error('[Admin Orders] API error:', apiError)
        console.warn('[Admin Orders] API not available, using localStorage:', apiError)
        // Fallback: localStorage
        updateOrderStatus(orderId, newStatus)
      }
      // Lade Bestellungen neu
      await loadOrders()
      // Entferne Grund aus State wenn Status nicht mehr failed/cancelled
      if (newStatus !== 'failed' && newStatus !== 'cancelled') {
        setStatusReasons(prev => {
          const next = { ...prev }
          delete next[orderId]
          return next
        })
      }
    } catch (error: any) {
      console.error('[Admin Orders] Error updating order status:', error)
      alert(`Fehler beim Aktualisieren des Status: ${error.message || 'Unbekannter Fehler'}`)
    }
  }

  const handleKeyUpdate = async (orderId: string, itemId: string, key: string) => {
    setUpdatingKeys(prev => new Set(prev).add(itemId))
    try {
      const response = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: key.trim() || null }),
      })

      if (!response.ok) {
        throw new Error('Failed to update key')
      }

      // Lade Bestellungen neu
      await loadOrders()
      // Entferne aus editingKeys
      setEditingKeys(prev => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })
    } catch (error) {
      console.error('[Admin Orders] Error updating key:', error)
      alert('Fehler beim Speichern des Keys. Bitte versuchen Sie es erneut.')
    } finally {
      setUpdatingKeys(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })
  
  console.log('[Admin Orders] Filtered orders:', {
    totalOrders: orders.length,
    filteredOrders: filteredOrders.length,
    searchQuery,
    statusFilter
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fortnite-darker">
        <div className="text-white">Lädt...</div>
      </div>
    )
  }

  if (!user || !isAdmin(user.email)) {
    return null
  }

  const statusOptions: { value: string; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'Alle', icon: <Package className="w-4 h-4" /> },
    { value: 'pending', label: 'Ausstehend', icon: <Clock className="w-4 h-4" /> },
    { value: 'processing', label: 'In Bearbeitung', icon: <Package className="w-4 h-4" /> },
    { value: 'completed', label: 'Abgeschlossen', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'failed', label: 'Fehlgeschlagen', icon: <XCircle className="w-4 h-4" /> },
  ]

  console.log('[Admin Orders] Rendering component', { ordersCount: orders.length, user: user?.email })
  
  return (
    <div className="min-h-screen bg-fortnite-darker py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Bestellverwaltung</h1>
          <button
            onClick={() => {
              console.log('[Admin Orders] Refresh button clicked')
              loadOrders()
            }}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Package className="w-4 h-4" />
            <span>Aktualisieren</span>
          </button>
        </div>
        
        {/* Debug Info */}
        <div className="mb-4 p-4 bg-fortnite-dark border border-purple-500/20 rounded-lg">
          <p className="text-gray-400 text-sm mb-2">
            <strong>Debug:</strong> {orders.length} Bestellungen geladen | 
            User: {user?.email} | 
            Admin: {isAdmin(user?.email) ? 'Ja' : 'Nein'}
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  const stored = localStorage.getItem('simexmafia-orders')
                  console.log('[Admin Orders] Manual check - localStorage:', stored)
                  const count = stored ? JSON.parse(stored).length : 0
                  alert(`localStorage hat ${count} Bestellungen\n\nDaten:\n${stored || 'Keine Daten'}`)
                }
              }}
              className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded text-xs"
            >
              localStorage prüfen
            </button>
            <button
              onClick={() => {
                console.log('[Admin Orders] Force reload')
                loadOrders()
              }}
              className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded text-xs"
            >
              Neu laden
            </button>
            <button
              onClick={() => {
                // Erstelle eine Testbestellung
                const testOrder = {
                  id: `ORD-TEST-${Date.now()}`,
                  userId: 'test-user-1',
                  items: [{
                    id: 'test-product',
                    type: 'product' as const,
                    name: 'Test Produkt',
                    price: 10,
                    quantity: 1,
                  }],
                  subtotal: 10,
                  serviceFee: 0.99,
                  discount: 0,
                  total: 10.99,
                  paymentMethod: 'goofycoins' as const,
                  status: 'pending' as const,
                  createdAt: new Date().toISOString(),
                }
                
                try {
                  const stored = localStorage.getItem('simexmafia-orders')
                  const orders = stored ? JSON.parse(stored) : []
                  orders.push(testOrder)
                  localStorage.setItem('simexmafia-orders', JSON.stringify(orders))
                  console.log('[Admin Orders] Test order created:', testOrder.id)
                  alert(`Testbestellung erstellt: ${testOrder.id}\n\nJetzt "Neu laden" klicken!`)
                  loadOrders()
                } catch (error) {
                  console.error('[Admin Orders] Error creating test order:', error)
                  alert('Fehler beim Erstellen der Testbestellung: ' + error)
                }
              }}
              className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 rounded text-xs"
            >
              Testbestellung erstellen
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Nach Bestell-ID oder Benutzer-ID suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-fortnite-dark border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                  statusFilter === option.value
                    ? 'bg-purple-500 text-white'
                    : 'bg-fortnite-dark border border-purple-500/30 text-gray-300 hover:border-purple-500/50'
                }`}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold text-lg">Bestellung {order.id}</h3>
                  <p className="text-gray-400 text-sm">
                    {new Date(order.createdAt).toLocaleDateString('de-DE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      order.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : order.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : order.status === 'failed'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="text-white font-bold text-lg">€{order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">Artikel:</p>
                <div className="space-y-3">
                  {order.items.map((item: any, index: number) => {
                    const itemId = item.id || `item-${index}`
                    const currentKey = editingKeys[itemId] !== undefined 
                      ? editingKeys[itemId] 
                      : (item.key || '')
                    const isUpdating = updatingKeys.has(itemId)
                    
                    return (
                      <div key={itemId} className="bg-fortnite-darker border border-purple-500/10 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-300 text-sm">
                            {item.name} (x{item.quantity})
                          </span>
                          <span className="text-gray-400 text-sm">€{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              placeholder="Digital Key hier einfügen..."
                              value={currentKey}
                              onChange={(e) => setEditingKeys(prev => ({ ...prev, [itemId]: e.target.value }))}
                              className="w-full pl-10 pr-3 py-2 bg-fortnite-dark border border-purple-500/30 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                              disabled={isUpdating}
                            />
                          </div>
                          <button
                            onClick={() => handleKeyUpdate(order.id, itemId, currentKey)}
                            disabled={isUpdating || currentKey === (item.key || '')}
                            className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                          >
                            <Save className="w-4 h-4" />
                            <span className="text-xs">{isUpdating ? '...' : 'Speichern'}</span>
                          </button>
                        </div>
                        {item.key && (
                          <p className="text-green-400 text-xs mt-1">Key gespeichert: {item.key.substring(0, 20)}...</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
                <div className="text-sm text-gray-400">
                  <p>Zwischensumme: €{order.subtotal.toFixed(2)}</p>
                  <p>Servicegebühr: €{order.serviceFee.toFixed(2)}</p>
                  {order.discount > 0 && (
                    <p className="text-green-400">Rabatt: -€{order.discount.toFixed(2)}</p>
                  )}
                  {order.discountCode && (
                    <p className="text-purple-400">Code: {order.discountCode}</p>
                  )}
                  <p className="text-gray-500 mt-2">Benutzer-ID: {order.userId}</p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <select
                    value={order.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value as Order['status']
                      // Hole den aktuellen Grund, falls vorhanden
                      const currentReason = statusReasons[order.id] || (order as any).statusReason || ''
                      // Übergebe Grund nur wenn Status failed oder cancelled ist
                      const reason = (newStatus === 'failed' || newStatus === 'cancelled') ? currentReason : undefined
                      await handleStatusUpdate(order.id, newStatus, reason)
                    }}
                    className="px-4 py-2 bg-fortnite-dark border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="pending">Ausstehend</option>
                    <option value="processing">In Bearbeitung</option>
                    <option value="completed">Abgeschlossen</option>
                    <option value="failed">Fehlgeschlagen</option>
                    <option value="cancelled">Storniert</option>
                  </select>
                  {(order.status === 'failed' || order.status === 'cancelled') && (
                    <div className="w-full max-w-xs space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder={`Grund für ${order.status === 'failed' ? 'Fehlgeschlagen' : 'Storniert'}...`}
                          value={statusReasons[order.id] || (order as any).statusReason || ''}
                          onChange={(e) => {
                            setStatusReasons(prev => ({
                              ...prev,
                              [order.id]: e.target.value
                            }))
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const reason = statusReasons[order.id] || (order as any).statusReason || ''
                              if (reason.trim()) {
                                await handleStatusUpdate(order.id, order.status, reason.trim())
                              }
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-fortnite-darker border border-red-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-red-500/50"
                        />
                        <button
                          onClick={async () => {
                            const reason = statusReasons[order.id] || (order as any).statusReason || ''
                            console.log('[Admin Orders] Saving reason:', { orderId: order.id, reason, currentStatus: order.status })
                            if (reason.trim()) {
                              await handleStatusUpdate(order.id, order.status, reason.trim())
                              // Lade Bestellungen neu, um den gespeicherten Grund zu sehen
                              await loadOrders()
                            } else {
                              alert('Bitte geben Sie einen Grund ein.')
                            }
                          }}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-semibold whitespace-nowrap"
                        >
                          Speichern
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Keine Bestellungen gefunden</p>
            {orders.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Es wurden noch keine Bestellungen erstellt. Erstelle eine Testbestellung im Checkout, um sie hier zu sehen.
              </p>
            ) : (
              <p className="text-gray-500 text-sm">
                {orders.length} Bestellung(en) vorhanden, aber keine passen zu den aktuellen Filtern.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

