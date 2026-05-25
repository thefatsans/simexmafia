'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import { Mail, Search, RefreshCw, Trash2 } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

type ContactStatus = 'pending' | 'in-progress' | 'resolved'

interface ContactRequest {
  id: string
  name: string
  email: string
  category: string
  subject: string
  message: string
  status: ContactStatus
  response: string | null
  createdAt: string
  updatedAt: string
}

const STATUS_OPTIONS: Array<{ value: '' | ContactStatus; label: string }> = [
  { value: '', label: 'Alle' },
  { value: 'pending', label: 'Offen' },
  { value: 'in-progress', label: 'In Bearbeitung' },
  { value: 'resolved', label: 'Erledigt' },
]

const STATUS_LABEL: Record<ContactStatus, string> = {
  pending: 'Offen',
  'in-progress': 'In Bearbeitung',
  resolved: 'Erledigt',
}

const STATUS_STYLE: Record<ContactStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  'in-progress': 'bg-blue-500/20 text-blue-400',
  resolved: 'bg-green-500/20 text-green-400',
}

export default function AdminContactRequestsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { showSuccess, showError } = useToast()
  const [requests, setRequests] = useState<ContactRequest[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | ContactStatus>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300)
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

  const loadRequests = useCallback(async () => {
    if (!user || !isAdmin(user.email)) return
    setIsRefreshing(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('q', debouncedSearch)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/admin/contact-requests?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Fehler ${res.status}`)
      }
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (err) {
      console.error('[Admin ContactRequests]', err)
      showError(err instanceof Error ? err.message : 'Anfragen konnten nicht geladen werden')
    } finally {
      setIsRefreshing(false)
    }
  }, [user, debouncedSearch, statusFilter, showError])

  useEffect(() => {
    if (!authLoading && user && isAdmin(user.email)) {
      loadRequests()
    }
  }, [authLoading, user, loadRequests])

  const updateStatus = async (req: ContactRequest, status: ContactStatus) => {
    try {
      const res = await fetch(`/api/admin/contact-requests/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Fehler ${res.status}`)
      }
      const data = await res.json()
      setRequests((prev) => prev.map((r) => (r.id === req.id ? data.request : r)))
      showSuccess(`Status: ${STATUS_LABEL[status]}`)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Update fehlgeschlagen')
    }
  }

  const handleDelete = async (req: ContactRequest) => {
    if (!confirm(`Anfrage von ${req.name} löschen?`)) return
    try {
      const res = await fetch(`/api/admin/contact-requests/${req.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Fehler ${res.status}`)
      }
      setRequests((prev) => prev.filter((r) => r.id !== req.id))
      showSuccess('Anfrage gelöscht')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen')
    }
  }

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

  return (
    <div className="min-h-screen bg-fortnite-darker py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Kontaktanfragen</h1>
            <p className="text-gray-400 mt-1">{requests.length} Einträge</p>
          </div>
          <button
            type="button"
            onClick={() => loadRequests()}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-fortnite-dark border border-purple-500/30 text-white rounded-lg hover:border-purple-500/60 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Aktualisieren
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Nach Name, E-Mail oder Betreff suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-fortnite-dark border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | ContactStatus)}
            className="w-full px-4 py-3 bg-fortnite-dark border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {requests.length === 0 && !isRefreshing ? (
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 text-center">
            <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Keine Kontaktanfragen gefunden</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <Mail className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <h3 className="text-white font-semibold text-lg break-words">{request.subject}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${STATUS_STYLE[request.status]}`}>
                        {STATUS_LABEL[request.status]}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm break-words">
                      Von: {request.name} (
                      <a href={`mailto:${request.email}`} className="text-purple-400 hover:underline">
                        {request.email}
                      </a>
                      ) • {request.category}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(request.createdAt).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="bg-fortnite-darker rounded-lg p-4 mb-4">
                  <p className="text-gray-300 whitespace-pre-wrap break-words">{request.message}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`mailto:${request.email}?subject=${encodeURIComponent(`Re: ${request.subject}`)}`}
                    className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded text-sm transition-colors"
                  >
                    Antworten
                  </a>
                  {request.status !== 'in-progress' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(request, 'in-progress')}
                      className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded text-sm transition-colors"
                    >
                      In Bearbeitung
                    </button>
                  )}
                  {request.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(request, 'resolved')}
                      className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded text-sm transition-colors"
                    >
                      Erledigt
                    </button>
                  )}
                  {request.status !== 'pending' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(request, 'pending')}
                      className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 rounded text-sm transition-colors"
                    >
                      Wieder öffnen
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(request)}
                    className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded text-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
