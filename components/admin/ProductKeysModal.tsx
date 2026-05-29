'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Product } from '@/types'
import { X, Key, Loader2, Copy, Trash2, Check } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { User } from '@/types/user'
import { adminFetch } from '@/lib/admin-fetch'

type KeyStatus = 'available' | 'used' | 'all'

type ProductKeyRow = {
  id: string
  code: string
  usedAt: string | null
  orderItemId: string | null
  createdAt: string
}

interface ProductKeysModalProps {
  product: Product
  user: Pick<User, 'id' | 'email'>
  onClose: () => void
  onSaved: (stockCount: number) => void
}

export default function ProductKeysModal({
  product,
  user,
  onClose,
  onSaved,
}: ProductKeysModalProps) {
  const { showSuccess, showError } = useToast()
  const [keysText, setKeysText] = useState('')
  const [available, setAvailable] = useState(0)
  const [used, setUsed] = useState(0)
  const [total, setTotal] = useState(0)
  const [keys, setKeys] = useState<ProductKeyRow[]>([])
  const [statusFilter, setStatusFilter] = useState<KeyStatus>('available')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [listTotal, setListTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const limit = 50

  const loadKeys = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        list: '1',
        status: statusFilter,
        page: String(page),
        limit: String(limit),
      })
      const res = await adminFetch(
        `/api/admin/products/${product.id}/keys?${params}`,
        user
      )
      if (!res.ok) {
        throw new Error('Keys konnten nicht geladen werden')
      }
      const data = await res.json()
      setAvailable(data.stats?.available ?? data.available ?? 0)
      setUsed(data.stats?.used ?? data.used ?? 0)
      setTotal(data.stats?.total ?? data.total ?? 0)
      setKeys(data.keys ?? [])
      setListTotal(data.pagination?.total ?? 0)
      setSelectedIds(new Set())
    } catch (error) {
      console.error(error)
      showError('Bestand konnte nicht geladen werden')
    } finally {
      setIsLoading(false)
    }
  }, [product.id, user, statusFilter, page])

  useEffect(() => {
    loadKeys()
  }, [loadKeys])

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  const filteredKeys = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return keys
    return keys.filter(
      (k) =>
        k.code.toLowerCase().includes(q) ||
        k.orderItemId?.toLowerCase().includes(q)
    )
  }, [keys, searchQuery])

  const toggleSelect = (id: string, isAvailable: boolean) => {
    if (!isAvailable) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllAvailable = () => {
    const availableOnPage = filteredKeys.filter((k) => !k.usedAt)
    const allSelected = availableOnPage.every((k) => selectedIds.has(k.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const k of availableOnPage) {
        if (allSelected) next.delete(k.id)
        else next.add(k.id)
      }
      return next
    })
  }

  const copyKey = async (key: ProductKeyRow) => {
    try {
      await navigator.clipboard.writeText(key.code)
      setCopiedId(key.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      showError('Kopieren fehlgeschlagen')
    }
  }

  const handleSave = async () => {
    if (!keysText.trim()) {
      showError('Bitte mindestens einen Key einfügen')
      return
    }

    setIsSaving(true)
    try {
      const res = await adminFetch(`/api/admin/products/${product.id}/keys`, user, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: keysText }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Speichern fehlgeschlagen')
      }

      setKeysText('')
      onSaved(data.stats?.available ?? data.available ?? 0)
      showSuccess(
        `${data.added} Key(s) hinzugefügt${data.skipped ? `, ${data.skipped} übersprungen` : ''}`
      )
      await loadKeys()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Fehler beim Speichern'
      showError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (keyIds: string[]) => {
    if (keyIds.length === 0) return
    if (
      !confirm(
        keyIds.length === 1
          ? 'Diesen verfügbaren Key wirklich löschen?'
          : `${keyIds.length} verfügbare Keys wirklich löschen?`
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await adminFetch(`/api/admin/products/${product.id}/keys`, user, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyIds }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Löschen fehlgeschlagen')
      }

      onSaved(data.stats?.available ?? 0)
      showSuccess(
        `${data.deleted} gelöscht${data.skipped ? `, ${data.skipped} übersprungen (verkauft)` : ''}`
      )
      await loadKeys()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Fehler beim Löschen'
      showError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(listTotal / limit))
  const availableOnPage = filteredKeys.filter((k) => !k.usedAt)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-fortnite-dark border border-purple-500/30 rounded-xl w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-purple-500/20 shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <Key className="w-5 h-5 text-purple-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white">Keys verwalten</h2>
              <p className="text-gray-400 text-sm truncate">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-purple-500/10 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-400">{available}</p>
              <p className="text-xs text-gray-400">Verfügbar</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-2xl font-bold text-blue-400">{used}</p>
              <p className="text-xs text-gray-400">Verkauft</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <p className="text-2xl font-bold text-purple-400">{total}</p>
              <p className="text-xs text-gray-400">Gesamt</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Neue Keys einfügen (eine Zeile = ein Key)
            </label>
            <textarea
              value={keysText}
              onChange={(e) => setKeysText(e.target.value)}
              rows={4}
              placeholder="XXXX-XXXX-XXXX"
              className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono text-sm"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSaving ? 'Speichern…' : 'Keys hinzufügen'}</span>
              </button>
            </div>
          </div>

          <div className="border-t border-purple-500/20 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex rounded-lg overflow-hidden border border-purple-500/30">
                {(['available', 'used', 'all'] as KeyStatus[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      statusFilter === tab
                        ? 'bg-purple-500/30 text-white'
                        : 'bg-fortnite-darker text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab === 'available' ? 'Verfügbar' : tab === 'used' ? 'Verkauft' : 'Alle'}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Key suchen…"
                className="px-3 py-1.5 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 sm:w-48"
              />
            </div>

            {statusFilter === 'available' && selectedIds.size > 0 && (
              <div className="mb-3 flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                <span className="text-red-200 text-sm">{selectedIds.size} ausgewählt</span>
                <button
                  type="button"
                  onClick={() => handleDelete([...selectedIds])}
                  disabled={isDeleting}
                  className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm font-medium disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Ausgewählte löschen
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Lade Keys…
              </div>
            ) : filteredKeys.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Keine Keys in dieser Ansicht.</p>
            ) : (
              <div className="border border-purple-500/20 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-fortnite-darker">
                    <tr>
                      {statusFilter !== 'used' && (
                        <th className="px-3 py-2 w-8">
                          {availableOnPage.length > 0 && (
                            <input
                              type="checkbox"
                              checked={
                                availableOnPage.length > 0 &&
                                availableOnPage.every((k) => selectedIds.has(k.id))
                              }
                              onChange={toggleSelectAllAvailable}
                              className="rounded border-purple-500/50"
                            />
                          )}
                        </th>
                      )}
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">Key</th>
                      <th className="px-3 py-2 text-left text-gray-400 font-medium">Status</th>
                      <th className="px-3 py-2 text-left text-gray-400 font-medium hidden sm:table-cell">
                        Hinzugefügt
                      </th>
                      <th className="px-3 py-2 text-right text-gray-400 font-medium w-24">
                        Aktion
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {filteredKeys.map((key) => {
                      const isAvailable = !key.usedAt
                      return (
                        <tr key={key.id} className="hover:bg-purple-500/5">
                          {statusFilter !== 'used' && (
                            <td className="px-3 py-2">
                              {isAvailable ? (
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(key.id)}
                                  onChange={() => toggleSelect(key.id, isAvailable)}
                                  className="rounded border-purple-500/50"
                                />
                              ) : null}
                            </td>
                          )}
                          <td className="px-3 py-2 font-mono text-white text-xs break-all">
                            {key.code}
                          </td>
                          <td className="px-3 py-2">
                            {isAvailable ? (
                              <span className="text-green-400 text-xs">Verfügbar</span>
                            ) : (
                              <span className="text-blue-400 text-xs" title={key.orderItemId ?? ''}>
                                Verkauft
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-400 text-xs hidden sm:table-cell">
                            {new Date(key.createdAt).toLocaleDateString('de-DE')}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => copyKey(key)}
                                className="p-1.5 text-gray-400 hover:text-white rounded"
                                title="Kopieren"
                              >
                                {copiedId === key.id ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                              {isAvailable && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete([key.id])}
                                  disabled={isDeleting}
                                  className="p-1.5 text-gray-400 hover:text-red-400 rounded disabled:opacity-50"
                                  title="Löschen"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 text-sm text-gray-400">
                <span>
                  Seite {page} von {totalPages} ({listTotal} Keys)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || isLoading}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 rounded border border-purple-500/30 disabled:opacity-40 hover:bg-purple-500/10"
                  >
                    Zurück
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages || isLoading}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 rounded border border-purple-500/30 disabled:opacity-40 hover:bg-purple-500/10"
                  >
                    Weiter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-purple-500/20 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  )
}
