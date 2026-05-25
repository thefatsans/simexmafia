'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import {
  Users,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Shield,
  Trash2,
  Edit,
  X,
  Eye,
  ChevronRight,
  Coins,
  ShoppingCart,
  Star,
} from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

interface AdminUserRow {
  id: string
  email: string
  firstName: string
  lastName: string
  goofyCoins: number
  totalSpent: number
  tier: string
  emailVerified: boolean
  isAdmin: boolean
  createdAt: string
  orderCount: number
}

interface AdminUserDetail extends AdminUserRow {
  avatar: string | null
  joinDate: string
  updatedAt: string
  reviewCount: number
  inventoryCount: number
  referralCode: string | null
  recentOrders: Array<{
    id: string
    total: number
    status: string
    paymentMethod: string
    discountCode: string | null
    createdAt: string
  }>
}

const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']

const TIER_COLOR: Record<string, string> = {
  Bronze: 'text-amber-600',
  Silver: 'text-gray-400',
  Gold: 'text-yellow-400',
  Platinum: 'text-cyan-400',
  Diamond: 'text-blue-400',
}

const ORDER_STATUS_STYLE: Record<string, string> = {
  completed: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  processing: 'bg-blue-500/20 text-blue-400',
  failed: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-gray-500/20 text-gray-400',
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { showSuccess, showError } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Detail drawer
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', goofyCoins: 0, tier: 'Bronze' })

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    if (authLoading) { setIsLoading(true); return }
    if (!user) { router.push('/auth/login'); return }
    if (!isAdmin(user.email)) { router.push('/account'); return }
    setIsLoading(false)
  }, [user, router, authLoading])

  const loadUsers = useCallback(async () => {
    if (!user || !isAdmin(user.email)) return
    setIsRefreshing(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (debouncedQuery) params.set('q', debouncedQuery)
      const res = await fetch(`/api/admin/users?${params}`, { credentials: 'include', cache: 'no-store' })
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || `Fehler ${res.status}`) }
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benutzer konnten nicht geladen werden.')
      setUsers([])
    } finally {
      setIsRefreshing(false)
    }
  }, [user, debouncedQuery])

  useEffect(() => {
    if (!authLoading && user && isAdmin(user.email)) loadUsers()
  }, [authLoading, user, loadUsers])

  const openDetail = async (u: AdminUserRow) => {
    setIsLoadingDetail(true)
    setSelectedUser(null)
    setIsEditMode(false)
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { credentials: 'include' })
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || `Fehler ${res.status}`) }
      const data = await res.json()
      setSelectedUser(data.user)
      setEditForm({
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        goofyCoins: data.user.goofyCoins,
        tier: data.user.tier,
      })
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Benutzer konnten nicht geladen werden.')
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedUser) return
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          goofyCoins: Number(editForm.goofyCoins),
          tier: editForm.tier,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { showError(data.error || `Fehler ${res.status}`); return }
      setSelectedUser((prev) => prev ? { ...prev, ...data.user } : prev)
      setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, ...data.user } : u))
      setIsEditMode(false)
      showSuccess('Benutzer aktualisiert')
    } catch (err) {
      showError('Speichern fehlgeschlagen')
    }
  }

  const handleToggleAdmin = async (u: AdminUserDetail) => {
    const newVal = !u.isAdmin
    if (!confirm(newVal ? `${u.email} zum Admin machen?` : `Admin-Rechte von ${u.email} entziehen?`)) return
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isAdmin: newVal }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { showError(data.error || `Fehler ${res.status}`); return }
      setSelectedUser((prev) => prev ? { ...prev, isAdmin: newVal } : prev)
      setUsers((prev) => prev.map((row) => row.id === u.id ? { ...row, isAdmin: newVal } : row))
      showSuccess(newVal ? 'Admin-Rechte vergeben' : 'Admin-Rechte entzogen')
    } catch { showError('Update fehlgeschlagen') }
  }

  const handleToggleVerified = async (u: AdminUserDetail) => {
    const newVal = !u.emailVerified
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emailVerified: newVal }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { showError(data.error || `Fehler ${res.status}`); return }
      setSelectedUser((prev) => prev ? { ...prev, emailVerified: newVal } : prev)
      setUsers((prev) => prev.map((row) => row.id === u.id ? { ...row, emailVerified: newVal } : row))
      showSuccess(newVal ? 'E-Mail als verifiziert markiert' : 'E-Mail-Verifizierung entfernt')
    } catch { showError('Update fehlgeschlagen') }
  }

  const handleDelete = async (u: AdminUserDetail) => {
    if (!confirm(`Benutzer "${u.email}" und alle zugehörigen Daten (Bestellungen, Bewertungen, Inventar) wirklich löschen? Diese Aktion ist nicht rückgängig zu machen.`)) return
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { showError(data.error || `Fehler ${res.status}`); return }
      setSelectedUser(null)
      setUsers((prev) => prev.filter((row) => row.id !== u.id))
      setTotal((t) => Math.max(0, t - 1))
      showSuccess('Benutzer gelöscht')
    } catch { showError('Löschen fehlgeschlagen') }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fortnite-darker">
        <div className="text-white">Lädt...</div>
      </div>
    )
  }

  if (!user || !isAdmin(user.email)) return null

  return (
    <div className="min-h-screen bg-fortnite-darker py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Benutzerverwaltung</h1>
            <p className="text-gray-400 mt-1">{total} Benutzer in der Datenbank</p>
          </div>
          <button
            type="button"
            onClick={() => loadUsers()}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Aktualisieren
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Nach E-Mail oder Name suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-fortnite-dark border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {users.length === 0 && !isRefreshing && !error ? (
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {debouncedQuery ? 'Keine Benutzer für diese Suche gefunden.' : 'Noch keine Benutzer registriert.'}
            </p>
          </div>
        ) : (
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-purple-500/20 text-gray-400 uppercase text-xs">
                    <th className="px-4 py-3">E-Mail</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Verifiziert</th>
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">Bestellungen</th>
                    <th className="px-4 py-3">Coins</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Registriert</th>
                    <th className="px-4 py-3 text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">{u.email}</td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{u.firstName} {u.lastName}</td>
                      <td className="px-4 py-3">
                        {u.emailVerified
                          ? <span className="inline-flex items-center gap-1 text-green-400"><CheckCircle className="w-4 h-4" />Ja</span>
                          : <span className="inline-flex items-center gap-1 text-amber-400"><XCircle className="w-4 h-4" />Nein</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {u.isAdmin
                          ? <span className="inline-flex items-center gap-1 text-purple-400"><Shield className="w-4 h-4" />Ja</span>
                          : <span className="text-gray-500">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-gray-300">{u.orderCount}</td>
                      <td className="px-4 py-3 text-yellow-300">{u.goofyCoins.toLocaleString()}</td>
                      <td className={`px-4 py-3 font-medium ${TIER_COLOR[u.tier] || 'text-gray-300'}`}>{u.tier}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openDetail(u)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 rounded text-xs transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Verwalten
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > users.length && (
              <p className="px-4 py-3 text-gray-500 text-xs border-t border-purple-500/20">
                Zeige {users.length} von {total} — Suche verfeinern für mehr Treffer.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {(selectedUser || isLoadingDetail) && (
        <div className="fixed inset-0 z-50 flex">
          {/* backdrop */}
          <div className="flex-1 bg-black/60" onClick={() => { setSelectedUser(null); setIsEditMode(false) }} />

          {/* panel */}
          <div className="w-full max-w-lg bg-fortnite-dark border-l border-purple-500/30 overflow-y-auto flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 flex-shrink-0">
              <h2 className="text-lg font-bold text-white">
                {isLoadingDetail ? 'Lädt…' : (selectedUser?.email || '')}
              </h2>
              <button
                type="button"
                onClick={() => { setSelectedUser(null); setIsEditMode(false) }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingDetail && (
              <div className="flex-1 flex items-center justify-center text-gray-400">Lädt…</div>
            )}

            {selectedUser && !isLoadingDetail && (
              <div className="flex-1 px-6 py-4 space-y-6">
                {/* Stats strip */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-fortnite-darker rounded-lg p-3 text-center">
                    <ShoppingCart className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                    <div className="text-xl font-bold text-white">{selectedUser.orderCount}</div>
                    <div className="text-xs text-gray-400">Bestellungen</div>
                  </div>
                  <div className="bg-fortnite-darker rounded-lg p-3 text-center">
                    <Coins className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                    <div className="text-xl font-bold text-white">{selectedUser.goofyCoins.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">GoofyCoins</div>
                  </div>
                  <div className="bg-fortnite-darker rounded-lg p-3 text-center">
                    <Star className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <div className={`text-xl font-bold ${TIER_COLOR[selectedUser.tier] || 'text-white'}`}>{selectedUser.tier}</div>
                    <div className="text-xs text-gray-400">€{Number(selectedUser.totalSpent).toFixed(2)}</div>
                  </div>
                </div>

                {/* Status badges */}
                <div className="flex gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${selectedUser.emailVerified ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {selectedUser.emailVerified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {selectedUser.emailVerified ? 'E-Mail verifiziert' : 'E-Mail nicht verifiziert'}
                  </span>
                  {selectedUser.isAdmin && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  )}
                </div>

                {/* Edit form */}
                {isEditMode ? (
                  <div className="bg-fortnite-darker rounded-lg p-4 space-y-3 border border-purple-500/20">
                    <h3 className="text-white font-semibold text-sm">Benutzer bearbeiten</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Vorname</label>
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                          className="w-full px-3 py-2 bg-fortnite-dark border border-purple-500/30 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Nachname</label>
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                          className="w-full px-3 py-2 bg-fortnite-dark border border-purple-500/30 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">GoofyCoins</label>
                      <input
                        type="number"
                        min={0}
                        value={editForm.goofyCoins}
                        onChange={(e) => setEditForm({ ...editForm, goofyCoins: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-fortnite-dark border border-purple-500/30 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Tier</label>
                      <select
                        value={editForm.tier}
                        onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                        className="w-full px-3 py-2 bg-fortnite-dark border border-purple-500/30 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                      >
                        {TIERS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => setIsEditMode(false)} className="flex-1 px-3 py-2 bg-fortnite-dark border border-purple-500/30 text-white rounded text-sm hover:border-purple-500/60">Abbrechen</button>
                      <button type="button" onClick={handleSaveEdit} className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded text-sm font-semibold">Speichern</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-fortnite-darker rounded-lg p-4 space-y-2 border border-purple-500/20 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">ID</span>
                      <span className="text-gray-300 font-mono text-xs truncate max-w-[200px]">{selectedUser.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Registriert</span>
                      <span className="text-gray-300">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bewertungen</span>
                      <span className="text-gray-300">{selectedUser.reviewCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Inventar</span>
                      <span className="text-gray-300">{selectedUser.inventoryCount} Items</span>
                    </div>
                    {selectedUser.referralCode && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Referral-Code</span>
                        <span className="text-gray-300 font-mono text-xs">{selectedUser.referralCode}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {!isEditMode && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditMode(true)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 rounded text-sm transition-colors"
                    >
                      <Edit className="w-4 h-4" /> Bearbeiten
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleVerified(selectedUser)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded text-sm transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {selectedUser.emailVerified ? 'Verifizierung entfernen' : 'Als verifiziert markieren'}
                    </button>
                    {!selectedUser.isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleToggleAdmin(selectedUser)}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded text-sm transition-colors"
                      >
                        <Shield className="w-4 h-4" /> Admin machen
                      </button>
                    )}
                    {selectedUser.isAdmin && !isAdmin(selectedUser.email) && (
                      <button
                        type="button"
                        onClick={() => handleToggleAdmin(selectedUser)}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded text-sm transition-colors"
                      >
                        <Shield className="w-4 h-4" /> Admin entziehen
                      </button>
                    )}
                    {!selectedUser.isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedUser)}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded text-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Löschen
                      </button>
                    )}
                  </div>
                )}

                {/* Recent orders */}
                {selectedUser.recentOrders.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-3 text-sm">Letzte Bestellungen</h3>
                    <div className="space-y-2">
                      {selectedUser.recentOrders.map((o) => (
                        <div key={o.id} className="bg-fortnite-darker rounded p-3 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <p className="text-gray-300 font-mono truncate">{o.id}</p>
                            <p className="text-gray-500 mt-0.5">
                              {formatDate(o.createdAt)} · {o.paymentMethod}
                              {o.discountCode && <span className="ml-1 text-purple-400">[{o.discountCode}]</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded text-xs ${ORDER_STATUS_STYLE[o.status] || 'bg-gray-500/20 text-gray-400'}`}>
                              {o.status}
                            </span>
                            <span className="text-white font-semibold">€{o.total.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
