'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import { Users, Search, RefreshCw, CheckCircle, XCircle, Shield } from 'lucide-react'

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
  joinDate: string
  createdAt: string
  orderCount: number
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

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

  const loadUsers = useCallback(async () => {
    if (!user || !isAdmin(user.email)) return

    setIsRefreshing(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (debouncedQuery) params.set('q', debouncedQuery)

      const res = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Fehler ${res.status}`)
      }

      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total ?? 0)
    } catch (err: unknown) {
      console.error('[Admin Users]', err)
      setError(err instanceof Error ? err.message : 'Benutzer konnten nicht geladen werden.')
      setUsers([])
      setTotal(0)
    } finally {
      setIsRefreshing(false)
    }
  }, [user, debouncedQuery])

  useEffect(() => {
    if (!authLoading && user && isAdmin(user.email)) {
      loadUsers()
    }
  }, [authLoading, user, loadUsers])

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fortnite-darker">
        <div className="text-white">Lädt...</div>
      </div>
    )
  }

  if (!user || !isAdmin(user.email)) {
    return null
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  return (
    <div className="min-h-screen bg-fortnite-darker py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Benutzerverwaltung</h1>
            <p className="text-gray-400 mt-1">
              {total} {total === 1 ? 'Benutzer' : 'Benutzer'} in der Datenbank
            </p>
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

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Nach E-Mail oder Name suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-fortnite-dark border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
            {error}
            <span className="block mt-1 text-gray-400">
              Tipp: Als Admin einloggen (E-Mail mit „admin“ oder admin@simexmafia.de) und Session-Cookie aktiv.
            </span>
          </div>
        )}

        {users.length === 0 && !isRefreshing && !error ? (
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {debouncedQuery
                ? 'Keine Benutzer für diese Suche gefunden.'
                : 'Noch keine Benutzer registriert.'}
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
                    <th className="px-4 py-3">E-Mail bestätigt</th>
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">Bestellungen</th>
                    <th className="px-4 py-3">GoofyCoins</th>
                    <th className="px-4 py-3">Registriert</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-white font-medium">{u.email}</td>
                      <td className="px-4 py-3 text-gray-300">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="px-4 py-3">
                        {u.emailVerified ? (
                          <span className="inline-flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-4 h-4" /> Ja
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400">
                            <XCircle className="w-4 h-4" /> Nein
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.isAdmin ? (
                          <span className="inline-flex items-center gap-1 text-purple-400">
                            <Shield className="w-4 h-4" /> Ja
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{u.orderCount}</td>
                      <td className="px-4 py-3 text-gray-300">{u.goofyCoins}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {formatDate(u.createdAt)}
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
    </div>
  )
}
