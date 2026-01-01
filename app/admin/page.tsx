'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import { 
  Package, ShoppingCart, Users, Tag, Mail, 
  TrendingUp, DollarSign, Gift, BarChart3,
  Settings, LogOut
} from 'lucide-react'
import { getOrders } from '@/data/payments'
import { getSackHistory } from '@/data/sackHistory'
import { getInventory } from '@/data/inventory'
import { getDiscountCodes } from '@/data/discountCodes'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, logout, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    orders: [] as any[],
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    sackHistory: [] as any[],
    inventory: [] as any[],
    discountCodes: [] as any[],
  })

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true)
      return // Wait for auth to load
    }
    
    if (!user) {
      console.log('No user, redirecting to login')
      router.push('/auth/login')
      return
    }
    
    const userIsAdmin = isAdmin(user.email)
    console.log('Checking admin access:', { email: user.email, isAdmin: userIsAdmin })
    
    if (!userIsAdmin) {
      console.log('User is not admin, redirecting to account')
      router.push('/account')
      return
    }
    
    console.log('User is admin, showing dashboard')
    
    // Load statistics
    const loadStats = () => {
      try {
        // getOrders() ist synchron, kein await nötig
        const orders = getOrders()
        console.log('[Admin Dashboard] Loaded orders:', orders.length)
        const sackHistory = getSackHistory()
        const inventory = getInventory()
        const discountCodes = getDiscountCodes()

        const totalRevenue = orders
          .filter((o: any) => o.status === 'completed')
          .reduce((sum: number, o: any) => sum + o.total, 0)

        const totalOrders = orders.length
        const pendingOrders = orders.filter((o: any) => o.status === 'pending' || o.status === 'processing').length

        setStats({
          orders,
          totalRevenue,
          totalOrders,
          pendingOrders,
          sackHistory,
          inventory,
          discountCodes,
        })
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading stats:', error)
        setIsLoading(false)
      }
    }

    loadStats()
  }, [user, router, authLoading])

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

  // Calculate statistics from state
  const { orders, totalRevenue, totalOrders, pendingOrders, sackHistory, inventory, discountCodes } = stats

  const totalSacksOpened = sackHistory?.length || 0
  const totalItemsWon = inventory?.length || 0
  const activeDiscountCodes = discountCodes?.filter((c: any) => c.isActive).length || 0

  const dashboardStats = [
    {
      label: 'Gesamtumsatz',
      value: `€${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      label: 'Bestellungen',
      value: totalOrders.toString(),
      icon: ShoppingCart,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      label: 'Offene Bestellungen',
      value: pendingOrders.toString(),
      icon: BarChart3,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
    },
    {
      label: 'Säcke geöffnet',
      value: totalSacksOpened.toString(),
      icon: Gift,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20',
    },
    {
      label: 'Items gewonnen',
      value: totalItemsWon.toString(),
      icon: Package,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    {
      label: 'Aktive Rabattcodes',
      value: activeDiscountCodes.toString(),
      icon: Tag,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
    },
  ]

  const quickActions = [
    {
      title: 'Produkte verwalten',
      description: 'Produkte hinzufügen, bearbeiten oder löschen',
      icon: Package,
      href: '/admin/products',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Bestellungen',
      description: 'Bestellungen anzeigen und verwalten',
      icon: ShoppingCart,
      href: '/admin/orders',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Benutzer',
      description: 'Benutzerkonten verwalten',
      icon: Users,
      href: '/admin/users',
      color: 'from-green-500 to-teal-500',
    },
    {
      title: 'Rabattcodes',
      description: 'Rabattcodes erstellen und verwalten',
      icon: Tag,
      href: '/admin/discount-codes',
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Kontaktanfragen',
      description: 'Kontaktanfragen anzeigen und bearbeiten',
      icon: Mail,
      href: '/admin/contact-requests',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      title: 'Newsletter',
      description: 'Newsletter-Abonnenten und Kampagnen verwalten',
      icon: Mail,
      href: '/admin/newsletter',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      title: 'E-Mails versenden',
      description: 'E-Mails an Benutzer oder Newsletter-Abonnenten senden',
      icon: Mail,
      href: '/admin/emails',
      color: 'from-green-500 to-emerald-500',
    },
  ]

  return (
    <div className="min-h-screen bg-fortnite-darker">
      {/* Header */}
      <div className="bg-fortnite-dark border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400 mt-1">Willkommen zurück, {user.firstName}</p>
            </div>
            <button
              onClick={() => {
                logout()
                router.push('/')
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-4 rounded-lg`}>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Schnellzugriff</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <div
                  key={index}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Navigating to:', action.href)
                    window.location.href = action.href
                  }}
                  className={`bg-gradient-to-r ${action.color} hover:opacity-90 rounded-lg p-6 text-white transition-all transform hover:scale-105 cursor-pointer pointer-events-auto`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                  <p className="text-white/80 text-sm">{action.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Letzte Aktivitäten</h2>
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-fortnite-darker rounded-lg border border-purple-500/10"
              >
                <div>
                  <p className="text-white font-semibold">Bestellung {order.id}</p>
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
                <div className="text-right">
                  <p className="text-white font-semibold">€{order.total.toFixed(2)}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      order.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : order.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

