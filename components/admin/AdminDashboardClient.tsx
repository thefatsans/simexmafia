'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminGate } from '@/hooks/useAdminGate'
import { 
  Package, ShoppingCart, Users, Tag, Mail, 
  TrendingUp, DollarSign, Gift, BarChart3,
  Settings, LogOut
} from 'lucide-react'
import AdminLoading from '@/components/admin/AdminLoading'
import { adminFetch } from '@/lib/admin-fetch'
import type { AdminDashboardData } from '@/lib/admin/load-dashboard'

type DashboardData = AdminDashboardData

export default function AdminDashboardClient({
  initialData = null,
}: {
  initialData?: DashboardData | null
}) {
  const router = useRouter()
  const { logout } = useAuth()
  const { user, isLoading: gateLoading, isReady } = useAdminGate()
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(initialData)

  useEffect(() => {
    if (initialData) {
      setData(initialData)
      setIsLoading(false)
    }
  }, [initialData])

  useEffect(() => {
    if (!isReady || !user || initialData) return

    let cancelled = false

    const loadStats = async () => {
      try {
        const dashRes = await adminFetch('/api/admin/dashboard', user)
        if (!dashRes.ok) {
          const body = await dashRes.json().catch(() => ({}))
          throw new Error(body.error || `Dashboard error: ${dashRes.status}`)
        }
        const dashboard = (await dashRes.json()) as DashboardData
        if (!cancelled) setData(dashboard)
      } catch (err: unknown) {
        console.error('Error loading dashboard:', err)
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Dashboard konnte nicht geladen werden.'
          setError(message)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadStats()

    return () => {
      cancelled = true
    }
  }, [isReady, user, initialData])

  if (gateLoading && !initialData) {
    return <AdminLoading label="Dashboard wird geladen..." />
  }

  if (isReady && isLoading && !data && !error) {
    return <AdminLoading label="Dashboard wird geladen..." />
  }

  if (!isReady || !user) {
    return null
  }

  const recentOrders = data?.recentOrders ?? []
  const totalRevenue = data?.revenue?.total ?? 0
  const totalRevenue30d = data?.revenue?.last30d ?? 0
  const totalOrders = data?.orders?.total ?? 0
  const pendingOrders = data?.orders?.pending ?? 0
  const completedOrders = data?.orders?.completed ?? 0
  const orders24h = data?.orders?.last24h ?? 0
  const orders7d = data?.orders?.last7d ?? 0
  const newUsers7d = data?.users?.new7d ?? 0
  const sackOpens7d = data?.sackOpens?.last7d ?? 0
  const pendingRedemptions = data?.redemptions?.pending ?? 0
  const pendingContactRequests = data?.contactRequests?.pending ?? 0

  const dashboardStats = [
    {
      label: 'Gesamtumsatz',
      value: `€${totalRevenue.toFixed(2)}`,
      subtitle: `€${totalRevenue30d.toFixed(2)} in 30 Tagen`,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      label: 'Bestellungen gesamt',
      value: totalOrders.toString(),
      subtitle: `${orders7d} in 7 Tagen · ${orders24h} heute`,
      icon: ShoppingCart,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      label: 'Offene Bestellungen',
      value: pendingOrders.toString(),
      subtitle: `${completedOrders} abgeschlossen`,
      icon: BarChart3,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
    },
    {
      label: 'Offene Sack-Einlösungen',
      value: pendingRedemptions.toString(),
      subtitle: 'Keys in Sack-Einlösungen vergeben',
      icon: Gift,
      color: pendingRedemptions > 0 ? 'text-orange-400' : 'text-gray-400',
      bgColor: pendingRedemptions > 0 ? 'bg-orange-500/20' : 'bg-gray-500/20',
      href: '/admin/redemptions',
      highlight: pendingRedemptions > 0,
    },
    {
      label: 'Offene Kontaktanfragen',
      value: pendingContactRequests.toString(),
      subtitle: 'Unbeantwortete Anfragen',
      icon: Mail,
      color: pendingContactRequests > 0 ? 'text-yellow-400' : 'text-gray-400',
      bgColor: pendingContactRequests > 0 ? 'bg-yellow-500/20' : 'bg-gray-500/20',
      href: '/admin/contact-requests',
      highlight: pendingContactRequests > 0,
    },
    {
      label: 'Säcke (7 Tage)',
      value: sackOpens7d.toString(),
      subtitle: `${data?.sackOpens?.last24h ?? 0} in 24h`,
      icon: Gift,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20',
    },
    {
      label: 'Neue Nutzer (7 Tage)',
      value: newUsers7d.toString(),
      subtitle: `${data?.users?.new24h ?? 0} in 24h`,
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    {
      label: 'Coin-Transaktionen (7 Tage)',
      value: (data?.coinTransactions?.last7d ?? 0).toString(),
      subtitle: `${data?.coinTransactions?.last24h ?? 0} in 24h`,
      icon: TrendingUp,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
    },
  ]

  const integrations = data?.integrations

  const quickActions = [
    {
      title: 'Produkte verwalten',
      description: 'Produkte hinzufügen, bearbeiten oder löschen',
      icon: Package,
      href: '/admin/products',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Shop-Bestellungen',
      description: 'Stripe-Käufe – Status setzen und Produkt-Keys eintragen',
      icon: ShoppingCart,
      href: '/admin/orders',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Sack-Einlösungen',
      description: 'Offene Sack-Gewinne einlösen und Keys versenden',
      icon: Gift,
      href: '/admin/redemptions',
      color: 'from-pink-500 to-rose-500',
      badgeCount: pendingRedemptions,
      highlight: pendingRedemptions > 0,
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
      badgeCount: pendingContactRequests,
      highlight: pendingContactRequests > 0,
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
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        {pendingContactRequests > 0 && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/40 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-yellow-200 text-sm sm:text-base">
              <strong>{pendingContactRequests}</strong>{' '}
              {pendingContactRequests === 1
                ? 'Kontaktanfrage wartet'
                : 'Kontaktanfragen warten'}{' '}
              auf Bearbeitung.
            </p>
            <Link
              href="/admin/contact-requests"
              className="inline-flex items-center justify-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg text-sm transition-colors shrink-0"
            >
              Zu Kontaktanfragen
            </Link>
          </div>
        )}
        {pendingRedemptions > 0 && (
          <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/40 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-orange-200 text-sm sm:text-base">
              <strong>{pendingRedemptions}</strong>{' '}
              {pendingRedemptions === 1
                ? 'Sack-Einlösung wartet'
                : 'Sack-Einlösungen warten'}{' '}
              auf einen Produkt-Key.
            </p>
            <Link
              href="/admin/redemptions"
              className="inline-flex items-center justify-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm transition-colors shrink-0"
            >
              Jetzt bearbeiten
            </Link>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon
            const cardClass = `bg-fortnite-dark border rounded-lg p-6 hover:border-purple-500/50 transition-all text-left w-full ${
              (stat as { highlight?: boolean }).highlight
                ? 'border-orange-500/50 ring-1 ring-orange-500/30'
                : 'border-purple-500/20'
            }`
            const content = (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-gray-500 text-xs mt-1">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`${stat.bgColor} p-4 rounded-lg`}>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            )
            const href = (stat as { href?: string }).href
            if (href) {
              return (
                <Link key={index} href={href} className={cardClass}>
                  {content}
                </Link>
              )
            }
            return (
              <div key={index} className={cardClass}>
                {content}
              </div>
            )
          })}
        </div>

        {integrations && (
          <div className="mb-8 bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Integrationen</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
              {[
                { key: 'resendConfigured', label: 'Resend (E-Mail)' },
                { key: 'stripeConfigured', label: 'Stripe' },
                { key: 'paypalConfigured', label: 'PayPal Verify' },
                { key: 'turnstileConfigured', label: 'Turnstile' },
                { key: 'discordInvite', label: 'Discord Invite' },
              ].map((row) => {
                const enabled = (integrations as any)[row.key]
                return (
                  <div
                    key={row.key}
                    className={`px-3 py-2 rounded border ${
                      enabled
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                        : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200'
                    }`}
                  >
                    <div className="font-semibold">{row.label}</div>
                    <div className="text-xs mt-1">
                      {enabled ? 'aktiv' : 'fehlt (ENV setzen)'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Schnellzugriff</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              const badgeCount = (action as { badgeCount?: number }).badgeCount ?? 0
              const highlight = (action as { highlight?: boolean }).highlight
              return (
                <Link
                  key={index}
                  href={action.href}
                  className={`bg-gradient-to-r ${action.color} hover:opacity-90 rounded-lg p-6 text-white transition-all transform hover:scale-105 cursor-pointer pointer-events-auto relative block ${
                    highlight ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-fortnite-darker' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <Icon className="w-8 h-8" />
                    {badgeCount > 0 && (
                      <span className="bg-white text-pink-600 text-xs font-bold rounded-full min-w-[22px] h-[22px] px-1.5 flex items-center justify-center">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                  <p className="text-white/80 text-sm">{action.description}</p>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-1">Letzte Aktivitäten</h2>
          <p className="text-gray-500 text-sm mb-6">Letzte Shop-Bestellungen</p>
          <div className="space-y-4">
            {recentOrders.length === 0 && (
              <p className="text-gray-400 text-sm">Keine aktuellen Shop-Bestellungen.</p>
            )}
            {recentOrders.map((order: any) => (
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

