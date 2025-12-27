'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import { getOrders, updateOrderStatus, Order } from '@/data/payments'
import { Search, Filter, CheckCircle, XCircle, Clock, Package } from 'lucide-react'

export default function AdminOrdersPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true)
      return // Wait for auth to load
    }
    
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    if (!isAdmin(user.email)) {
      router.push('/account')
      return
    }
    
    loadOrders()
    setIsLoading(false)
  }, [user, router, authLoading])

  const loadOrders = async () => {
    const allOrders = await getOrders()
    setOrders(allOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ))
  }

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    updateOrderStatus(orderId, newStatus)
    loadOrders()
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
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

  return (
    <div className="min-h-screen bg-fortnite-darker py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-8">Bestellverwaltung</h1>

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
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">
                        {item.name} (x{item.quantity})
                      </span>
                      <span className="text-gray-400">€{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
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
                </div>
                <div className="flex items-center space-x-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'processing')}
                      className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-lg transition-colors"
                    >
                      In Bearbeitung
                    </button>
                  )}
                  {order.status === 'processing' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'completed')}
                      className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-lg transition-colors"
                    >
                      Abschließen
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Keine Bestellungen gefunden</p>
          </div>
        )}
      </div>
    </div>
  )
}

