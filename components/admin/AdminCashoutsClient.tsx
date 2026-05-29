'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdminGate } from '@/hooks/useAdminGate'
import { adminFetch } from '@/lib/admin-fetch'
import { Banknote, Building2, CheckCircle, Loader2, RefreshCw, Wallet, XCircle } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import AdminLoading from '@/components/admin/AdminLoading'
import LoadingSpinner from '@/components/LoadingSpinner'

type CashoutStatus = 'pending' | 'completed' | 'rejected'

export interface CashoutItem {
  id: string
  userId: string
  variant: 'cash' | 'bank'
  coinsAmount: number
  euroAmount: number
  status: string
  fullName: string
  email: string
  phone: string | null
  iban: string | null
  address: string | null
  notes: string | null
  adminNotes: string | null
  processedAt: string | null
  createdAt: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
  } | null
}

export default function AdminCashoutsClient({
  initialItems = null,
  initialStatus = 'pending',
}: {
  initialItems?: CashoutItem[] | null
  initialStatus?: CashoutStatus
}) {
  const { user, isLoading: gateLoading, isReady } = useAdminGate()
  const { showSuccess, showError } = useToast()
  const [items, setItems] = useState<CashoutItem[]>(() => initialItems ?? [])
  const [statusFilter, setStatusFilter] = useState<CashoutStatus>(initialStatus)
  const [isLoading, setIsLoading] = useState(!initialItems)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})

  const loadItems = useCallback(async () => {
    if (!user) return
    setIsRefreshing(true)
    try {
      const res = await adminFetch(
        `/api/admin/goofycoins-cashouts?status=${statusFilter}`,
        user
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Fehler ${res.status}`)
      }
      const data = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Laden fehlgeschlagen')
      if (!initialItems) setItems([])
    } finally {
      setIsRefreshing(false)
      setIsLoading(false)
    }
  }, [user, statusFilter, showError, initialItems])

  const [hasUsedInitial, setHasUsedInitial] = useState(Boolean(initialItems))

  useEffect(() => {
    if (!isReady || !user) return
    if (initialItems && statusFilter === initialStatus && !hasUsedInitial) {
      setHasUsedInitial(true)
      setIsLoading(false)
      return
    }
    void loadItems()
  }, [isReady, user, statusFilter, loadItems, initialItems, initialStatus, hasUsedInitial])

  const handleAction = async (item: CashoutItem, action: 'complete' | 'reject') => {
    if (!user) return
    setProcessingId(item.id)
    try {
      const res = await adminFetch(`/api/admin/goofycoins-cashouts/${item.id}`, user, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminNotes: adminNotes[item.id]?.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || `Fehler ${res.status}`)
      }
      showSuccess(
        action === 'complete'
          ? `Auszahlung über ${item.euroAmount.toFixed(2)}€ abgeschlossen`
          : `Anfrage abgelehnt – Coins zurückerstattet`
      )
      setAdminNotes((prev) => {
        const next = { ...prev }
        delete next[item.id]
        return next
      })
      await loadItems()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Aktion fehlgeschlagen')
    } finally {
      setProcessingId(null)
    }
  }

  if (gateLoading) {
    return <AdminLoading label="Umtausch-Anfragen werden geladen..." />
  }

  if (!isReady || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-fortnite-darker py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">GoofyCoins Umtausch</h1>
            <p className="text-gray-400 mt-1 max-w-2xl">
              Bargeld- und Echtgeld-Auszahlungen bearbeiten.
            </p>
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
              { value: 'completed' as const, label: 'Abgeschlossen' },
              { value: 'rejected' as const, label: 'Abgelehnt' },
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

        {isLoading || (isRefreshing && items.length === 0) ? (
          <LoadingSpinner size="lg" centered label="Anfragen werden geladen..." />
        ) : items.length === 0 ? (
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 text-center">
            <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Keine Anfragen in dieser Kategorie</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const VariantIcon = item.variant === 'cash' ? Banknote : Building2
              return (
                <div
                  key={item.id}
                  className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <VariantIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <h3 className="text-white font-semibold text-lg">
                          {item.euroAmount.toFixed(2)}€ ·{' '}
                          {item.variant === 'cash' ? 'Bargeld' : 'Echtgeld'}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            item.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : item.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {item.status === 'completed'
                            ? 'Abgeschlossen'
                            : item.status === 'rejected'
                            ? 'Abgelehnt'
                            : 'Offen'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {item.coinsAmount.toLocaleString()} Coins · {item.fullName} (
                        <a href={`mailto:${item.email}`} className="text-purple-400 hover:underline">
                          {item.email}
                        </a>
                        )
                      </p>
                      {item.phone && (
                        <p className="text-gray-500 text-sm mt-1">Tel: {item.phone}</p>
                      )}
                      {item.iban && (
                        <p className="text-gray-300 text-sm mt-2 font-mono bg-fortnite-darker rounded p-2">
                          IBAN: {item.iban}
                        </p>
                      )}
                      {item.address && (
                        <p className="text-gray-300 text-sm mt-2">Adresse: {item.address}</p>
                      )}
                      {item.notes && (
                        <p className="text-gray-500 text-sm mt-1">Notiz: {item.notes}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-2">
                        Angefragt: {new Date(item.createdAt).toLocaleString('de-DE')}
                        {item.processedAt &&
                          ` · Bearbeitet: ${new Date(item.processedAt).toLocaleString('de-DE')}`}
                      </p>
                      {item.adminNotes && (
                        <p className="text-gray-400 text-xs mt-1 italic">Admin: {item.adminNotes}</p>
                      )}
                    </div>

                    {statusFilter === 'pending' && item.status === 'pending' && (
                      <div className="w-full lg:w-80 flex-shrink-0 space-y-2">
                        <label className="text-gray-400 text-xs block">Admin-Notiz (optional)</label>
                        <input
                          type="text"
                          value={adminNotes[item.id] || ''}
                          onChange={(e) =>
                            setAdminNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          placeholder="Interne Notiz"
                          className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleAction(item, 'complete')}
                          disabled={processingId === item.id}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                        >
                          {processingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Auszahlung bestätigen
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(item, 'reject')}
                          disabled={processingId === item.id}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/80 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Ablehnen & Coins zurück
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
