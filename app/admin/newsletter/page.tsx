'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import {
  Mail,
  Users,
  Send,
  Trash2,
  Search,
  X,
  CheckCircle,
  RefreshCw,
} from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import AdminLoading from '@/components/admin/AdminLoading'

type Tab = 'subscribers' | 'campaigns'

interface Subscriber {
  id: string
  email: string
  active: boolean
  subscribedAt: string
  unsubscribedAt: string | null
}

interface RecentSend {
  subject: string
  successCount: number
  errorCount: number
  total: number
  sentAt: string
}

const RECENT_SENDS_KEY = 'simexmafia-newsletter-recent-sends'
const MAX_RECENT = 20

function loadRecentSends(): RecentSend[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_SENDS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

function saveRecentSend(entry: RecentSend) {
  if (typeof window === 'undefined') return
  try {
    const existing = loadRecentSends()
    const next = [entry, ...existing].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_SENDS_KEY, JSON.stringify(next))
  } catch (err) {
    console.warn('[Newsletter] saveRecentSend failed', err)
  }
}

export default function NewsletterPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { showSuccess, showError } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('subscribers')
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [recentSends, setRecentSends] = useState<RecentSend[]>([])

  const [campaignSubject, setCampaignSubject] = useState('')
  const [campaignMessage, setCampaignMessage] = useState('')
  const [onlyActive, setOnlyActive] = useState(true)
  const [isSending, setIsSending] = useState(false)

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
    setRecentSends(loadRecentSends())
  }, [user, router, authLoading])

  const loadSubscribers = useCallback(async () => {
    if (!user || !isAdmin(user.email)) return
    setIsRefreshing(true)
    try {
      const params = new URLSearchParams()
      params.set('filter', filter)
      const res = await fetch(`/api/admin/newsletter?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Fehler ${res.status}`)
      }
      const data = await res.json()
      setSubscribers(data.subscribers || [])
    } catch (err) {
      console.error('[Admin Newsletter]', err)
      showError(err instanceof Error ? err.message : 'Subscribers konnten nicht geladen werden')
    } finally {
      setIsRefreshing(false)
    }
  }, [user, filter, showError])

  useEffect(() => {
    if (!authLoading && user && isAdmin(user.email)) {
      loadSubscribers()
    }
  }, [authLoading, user, loadSubscribers])

  const toggleActive = async (sub: Subscriber) => {
    try {
      const res = await fetch(`/api/admin/newsletter/${sub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !sub.active }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Fehler ${res.status}`)
      }
      await loadSubscribers()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Update fehlgeschlagen')
    }
  }

  const handleDelete = async (sub: Subscriber) => {
    if (!confirm(`Abonnent ${sub.email} wirklich löschen?`)) return
    try {
      const res = await fetch(`/api/admin/newsletter/${sub.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Fehler ${res.status}`)
      }
      showSuccess('Abonnent gelöscht')
      setSubscribers((prev) => prev.filter((s) => s.id !== sub.id))
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen')
    }
  }

  const handleSendCampaign = async () => {
    if (!campaignSubject.trim() || !campaignMessage.trim()) {
      showError('Bitte Betreff und Nachricht ausfüllen.')
      return
    }
    if (!confirm('Kampagne jetzt versenden?')) return

    setIsSending(true)
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject: campaignSubject.trim(),
          message: campaignMessage,
          onlyActive,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showError(data.error || `Fehler ${res.status}`)
        return
      }

      showSuccess(`Versendet: ${data.successCount}/${data.total}`)
      saveRecentSend({
        subject: campaignSubject.trim(),
        successCount: data.successCount || 0,
        errorCount: data.errorCount || 0,
        total: data.total || 0,
        sentAt: new Date().toISOString(),
      })
      setRecentSends(loadRecentSends())
      setCampaignSubject('')
      setCampaignMessage('')
    } catch (err) {
      console.error('[Newsletter Send]', err)
      showError('Versand fehlgeschlagen')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading || authLoading) {
    return <AdminLoading label="Newsletter wird geladen..." />
  }

  if (!user || !isAdmin(user.email)) {
    return null
  }

  const filteredSubscribers = subscribers.filter((sub) =>
    sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalCount = subscribers.length
  const activeCount = subscribers.filter((s) => s.active).length
  const inactiveCount = totalCount - activeCount

  return (
    <div className="min-h-screen bg-fortnite-darker">
      <div className="bg-fortnite-dark border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold text-white">Newsletter-Verwaltung</h1>
              <p className="text-gray-400 mt-1">Abonnenten und Kampagnen verwalten</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadSubscribers()}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-fortnite-darker border border-purple-500/30 text-white rounded-lg hover:border-purple-500/60 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Aktualisieren
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded-lg transition-colors"
              >
                Zurück
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Gesamt</p>
                <p className="text-3xl font-bold text-white">{totalCount}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Aktiv</p>
                <p className="text-3xl font-bold text-white">{activeCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Abgemeldet</p>
                <p className="text-3xl font-bold text-white">{inactiveCount}</p>
              </div>
              <X className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        <div className="flex space-x-4 mb-6 border-b border-purple-500/20">
          <button
            type="button"
            onClick={() => setActiveTab('subscribers')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'subscribers'
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            Abonnenten
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('campaigns')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'campaigns'
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            Kampagne senden
          </button>
        </div>

        {activeTab === 'subscribers' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nach E-Mail suchen..."
                  className="w-full pl-10 pr-4 py-2 bg-fortnite-dark border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-3 py-2 bg-fortnite-dark border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">Alle</option>
                <option value="active">Nur aktive</option>
                <option value="inactive">Nur abgemeldete</option>
              </select>
            </div>

            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-fortnite-darker border-b border-purple-500/20">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">E-Mail</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Abonniert am</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-white">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/20">
                    {filteredSubscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="hover:bg-purple-500/10 transition-colors">
                        <td className="px-6 py-4 text-white break-all">{subscriber.email}</td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => toggleActive(subscriber)}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              subscriber.active
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            }`}
                            title="Status ändern"
                          >
                            {subscriber.active ? 'Aktiv' : 'Abgemeldet'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {new Date(subscriber.subscribedAt).toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(subscriber)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredSubscribers.length === 0 && !isRefreshing && (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Keine Abonnenten gefunden</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">Newsletter-Kampagne senden</h2>
              <p className="text-gray-400 text-sm">
                Verschickt eine E-Mail an alle ausgewählten Abonnenten via Resend. Limit: 50 Empfänger pro Aufruf.
              </p>

              <div>
                <label className="block text-white font-semibold mb-2">Betreff</label>
                <input
                  type="text"
                  value={campaignSubject}
                  onChange={(e) => setCampaignSubject(e.target.value)}
                  placeholder="Newsletter-Betreff"
                  className="w-full px-4 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Nachricht</label>
                <textarea
                  value={campaignMessage}
                  onChange={(e) => setCampaignMessage(e.target.value)}
                  placeholder="Newsletter-Inhalt..."
                  rows={10}
                  className="w-full px-4 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={onlyActive}
                  onChange={(e) => setOnlyActive(e.target.checked)}
                />
                Nur an aktive Abonnenten ({activeCount})
              </label>

              <button
                type="button"
                onClick={handleSendCampaign}
                disabled={isSending}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
              >
                <Send className="w-5 h-5" />
                {isSending ? 'Sendet...' : 'Jetzt senden'}
              </button>
            </div>

            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-4">Letzte Sendungen</h3>
              {recentSends.length === 0 ? (
                <p className="text-gray-400 text-sm">Noch keine Sendungen.</p>
              ) : (
                <ul className="space-y-3">
                  {recentSends.map((entry, idx) => (
                    <li
                      key={`${entry.sentAt}-${idx}`}
                      className="border border-purple-500/20 rounded p-3 text-sm"
                    >
                      <p className="text-white font-medium break-words">{entry.subject}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(entry.sentAt).toLocaleString('de-DE')}
                      </p>
                      <p className="text-gray-300 text-xs mt-1">
                        {entry.successCount}/{entry.total} versendet
                        {entry.errorCount > 0 && ` (${entry.errorCount} Fehler)`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
