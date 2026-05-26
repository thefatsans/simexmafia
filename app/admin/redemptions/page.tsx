'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import { Gift, RefreshCw, Key, CheckCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import AdminLoading from '@/components/admin/AdminLoading'
import LoadingSpinner from '@/components/LoadingSpinner'

type RedemptionStatus = 'pending' | 'fulfilled'

interface RedemptionItem {
  id: string
  userId: string
  productId: string
  productName: string
  productImage: string | null
  sourceId: string | null
  notes: string | null
  isRedeemed: boolean
  redeemedAt: string | null
  redemptionCode: string | null
  redemptionStatus: string | null
  createdAt: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
  } | null
}

export default function AdminRedemptionsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { showSuccess, showError } = useToast()
  const [items, setItems] = useState<RedemptionItem[]>([])
  const [statusFilter, setStatusFilter] = useState<RedemptionStatus>('pending')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fulfillingId, setFulfillingId] = useState<string | null>(null)
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true)
      return
    }
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (!isAdmin(user.email)) {
      router.push('/account')
      return
    }
    setIsLoading(false)
  }, [user, router, authLoading])

  const loadItems = useCallback(async () => {
    if (!user || !isAdmin(user.email)) return
    setIsRefreshing(true)
    try {
      const res = await fetch(`/api/admin/redemptions?status=${statusFilter}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Fehler ${res.status}`)
      }
      const data = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Laden fehlgeschlagen')
      setItems([])
    } finally {
      setIsRefreshing(false)
    }
  }, [user, statusFilter, showError])

  useEffect(() => {
    if (!isLoading && user && isAdmin(user.email)) {
      loadItems()
    }
  }, [isLoading, user, statusFilter, loadItems])

  const handleFulfill = async (item: RedemptionItem) => {
    const code = (keyInputs[item.id] || '').trim()
    if (!code) {
      showError('Bitte einen Produkt-Key eingeben')
      return
    }
    setFulfillingId(item.id)
    try {
      const res = await fetch(`/api/admin/redemptions/${item.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemptionCode: code }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || `Fehler ${res.status}`)
      }
      if (data.warning) {
        showError(data.warning)
      } else {
        showSuccess(`Key an ${item.user?.email ?? 'Nutzer'} gesendet`)
      }
      setKeyInputs((prev) => {
        const next = { ...prev }
        delete next[item.id]
        return next
      })
      await loadItems()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
    } finally {
      setFulfillingId(null)
    }
  }

  if (isLoading || authLoading) {
    return <AdminLoading label="Einlösungen werden geladen..." />
  }

  if (!user || !isAdmin(user.email)) {
    return null
  }

  return (
    <div className="min-h-screen bg-fortnite-darker py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Sack-Einlösungen</h1>
            <p className="text-gray-400 mt-1 max-w-2xl">
              Gewinne aus Säcken – hier trägst du den Key ein und der Nutzer erhält eine E-Mail.
            </p>
            <a
              href="/admin/orders"
              className="inline-block mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Shop-Bestellungen →
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="px-4 py-2 bg-fortnite-dark border border-purple-500/30 text-gray-300 rounded-lg hover:text-white transition-colors text-sm"
            >
              ← Dashboard
            </a>
            <button
              type="button"
              onClick={() => loadItems()}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-fortnite-dark border border-purple-500/30 text-white rounded-lg hover:border-purple-500/60 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Aktualisieren
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-purple-500/20">
          {(
            [
              { value: 'pending' as const, label: 'Offen' },
              { value: 'fulfilled' as const, label: 'Erledigt' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
                statusFilter === tab.value
                  ? 'text-purple-400 border-purple-400'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isRefreshing && items.length === 0 ? (
          <LoadingSpinner size="lg" centered label="Anfragen werden geladen..." />
        ) : items.length === 0 ? (
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 text-center">
            <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {statusFilter === 'pending'
                ? 'Keine offenen Einlöse-Anfragen'
                : 'Keine erledigten Einlöse-Anfragen'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Gift className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <h3 className="text-white font-semibold text-lg">{item.productName}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          item.redemptionStatus === 'fulfilled'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {item.redemptionStatus === 'fulfilled' ? 'Erledigt' : 'Offen'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Nutzer:{' '}
                      <strong className="text-gray-200">
                        {item.user
                          ? `${item.user.firstName} ${item.user.lastName}`
                          : 'Unbekannt'}
                      </strong>
                      {item.user && (
                        <>
                          {' '}
                          (
                          <a
                            href={`mailto:${item.user.email}`}
                            className="text-purple-400 hover:underline"
                          >
                            {item.user.email}
                          </a>
                          )
                        </>
                      )}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Sack: {item.notes || item.sourceId || '—'} • Angefragt:{' '}
                      {item.redeemedAt
                        ? new Date(item.redeemedAt).toLocaleString('de-DE')
                        : '—'}
                    </p>
                    {item.redemptionCode && item.redemptionStatus === 'fulfilled' && (
                      <div className="mt-3 bg-fortnite-darker border border-green-500/30 rounded-lg p-3">
                        <p className="text-green-400 text-xs font-semibold mb-1">Gesendeter Key</p>
                        <code className="text-white font-mono text-sm break-all">
                          {item.redemptionCode}
                        </code>
                      </div>
                    )}
                  </div>

                  {statusFilter === 'pending' && item.redemptionStatus !== 'fulfilled' && (
                    <div className="w-full lg:w-80 flex-shrink-0 space-y-2">
                      <label className="text-gray-400 text-xs block">Produkt-Key</label>
                      <input
                        type="text"
                        value={keyInputs[item.id] || ''}
                        onChange={(e) =>
                          setKeyInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        placeholder="XXXX-XXXX-XXXX"
                        className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleFulfill(item)}
                        disabled={fulfillingId === item.id}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                      >
                        {fulfillingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Key className="w-4 h-4" />
                        )}
                        <span>Key senden & abschließen</span>
                      </button>
                    </div>
                  )}

                  {statusFilter === 'fulfilled' && (
                    <div className="flex items-center text-green-400 text-sm gap-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Abgeschlossen</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
