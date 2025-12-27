'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import {
  Mail, Users, Send, Plus, Trash2, Search, Filter,
  TrendingUp, Eye, MousePointerClick, Calendar,
  FileText, X, CheckCircle, AlertCircle
} from 'lucide-react'
import {
  getSubscribers,
  getActiveSubscribers,
  getSubscriberStats,
  deleteSubscriber,
  removeSubscriber,
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  NewsletterSubscriber,
  NewsletterCampaign,
} from '@/data/newsletter'
import { useToast } from '@/contexts/ToastContext'

type Tab = 'subscribers' | 'campaigns'

export default function NewsletterPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { showSuccess, showError } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('subscribers')
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<NewsletterCampaign | null>(null)
  const [campaignForm, setCampaignForm] = useState({
    subject: '',
    content: '',
    status: 'draft' as 'draft' | 'scheduled',
  })

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

    loadData()
    setIsLoading(false)
  }, [user, router, authLoading])

  const loadData = () => {
    setSubscribers(getSubscribers())
    setCampaigns(getCampaigns())
  }

  const handleDeleteSubscriber = (id: string) => {
    if (confirm('Möchten Sie diesen Abonnenten wirklich löschen?')) {
      if (deleteSubscriber(id)) {
        showSuccess('Abonnent gelöscht')
        loadData()
      } else {
        showError('Fehler beim Löschen')
      }
    }
  }

  const handleUnsubscribe = (email: string) => {
    if (removeSubscriber(email)) {
      showSuccess('Abonnent abgemeldet')
      loadData()
    } else {
      showError('Fehler beim Abmelden')
    }
  }

  const handleCreateCampaign = () => {
    if (!campaignForm.subject || !campaignForm.content) {
      showError('Bitte füllen Sie alle Felder aus')
      return
    }

    const activeSubscribers = getActiveSubscribers()
    const newCampaign = createCampaign({
      subject: campaignForm.subject,
      content: campaignForm.content,
      status: campaignForm.status,
      recipientCount: activeSubscribers.length,
      createdBy: user?.email || 'admin',
    })

    showSuccess('Kampagne erstellt')
    setShowCampaignModal(false)
    setCampaignForm({ subject: '', content: '', status: 'draft' })
    loadData()
  }

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('Möchten Sie diese Kampagne wirklich versenden?')) {
      return
    }

    const result = await sendCampaign(campaignId)
    if (result.success) {
      showSuccess(result.message)
      loadData()
    } else {
      showError(result.message)
    }
  }

  const handleDeleteCampaign = (id: string) => {
    if (confirm('Möchten Sie diese Kampagne wirklich löschen?')) {
      if (deleteCampaign(id)) {
        showSuccess('Kampagne gelöscht')
        loadData()
      } else {
        showError('Fehler beim Löschen')
      }
    }
  }

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

  const stats = getSubscriberStats()
  const filteredSubscribers = subscribers.filter(sub =>
    sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-fortnite-darker">
      {/* Header */}
      <div className="bg-fortnite-dark border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Newsletter-Verwaltung</h1>
              <p className="text-gray-400 mt-1">Abonnenten und Kampagnen verwalten</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded-lg transition-colors"
            >
              Zurück zum Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Gesamt Abonnenten</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Aktive Abonnenten</p>
                <p className="text-3xl font-bold text-white">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Abgemeldet</p>
                <p className="text-3xl font-bold text-white">{stats.unsubscribed}</p>
              </div>
              <X className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Kampagnen</p>
                <p className="text-3xl font-bold text-white">{campaigns.length}</p>
              </div>
              <Mail className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-purple-500/20">
          <button
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
            onClick={() => setActiveTab('campaigns')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'campaigns'
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            Kampagnen
          </button>
        </div>

        {/* Subscribers Tab */}
        {activeTab === 'subscribers' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nach E-Mail suchen..."
                  className="w-full pl-10 pr-4 py-2 bg-fortnite-dark border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-fortnite-darker border-b border-purple-500/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">E-Mail</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Abonniert am</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Quelle</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-white">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/20">
                  {filteredSubscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-purple-500/10 transition-colors">
                      <td className="px-6 py-4 text-white">{subscriber.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            subscriber.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {subscriber.status === 'active' ? 'Aktiv' : 'Abgemeldet'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {new Date(subscriber.subscribedAt).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{subscriber.source || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {subscriber.status === 'active' && (
                            <button
                              onClick={() => handleUnsubscribe(subscriber.email)}
                              className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded transition-colors"
                              title="Abmelden"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSubscriber(subscriber.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSubscribers.length === 0 && (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Keine Abonnenten gefunden</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Newsletter-Kampagnen</h2>
              <button
                onClick={() => {
                  setSelectedCampaign(null)
                  setCampaignForm({ subject: '', content: '', status: 'draft' })
                  setShowCampaignModal(true)
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Neue Kampagne</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">{campaign.subject}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          campaign.status === 'sent'
                            ? 'bg-green-500/20 text-green-400'
                            : campaign.status === 'draft'
                            ? 'bg-gray-500/20 text-gray-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {campaign.status === 'sent' ? 'Versendet' : campaign.status === 'draft' ? 'Entwurf' : 'Geplant'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{campaign.content}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Empfänger:</span>
                      <span className="text-white">{campaign.recipientCount}</span>
                    </div>
                    {campaign.status === 'sent' && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Geöffnet:</span>
                          <span className="text-white">{campaign.openedCount || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Geklickt:</span>
                          <span className="text-white">{campaign.clickedCount || 0}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {campaign.status === 'draft' && (
                    <button
                      onClick={() => handleSendCampaign(campaign.id)}
                      className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all"
                    >
                      <Send className="w-4 h-4 inline-block mr-2" />
                      Versenden
                    </button>
                  )}
                </div>
              ))}
            </div>
            {campaigns.length === 0 && (
              <div className="text-center py-12 bg-fortnite-dark border border-purple-500/20 rounded-lg">
                <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Noch keine Kampagnen erstellt</p>
                <button
                  onClick={() => setShowCampaignModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all"
                >
                  Erste Kampagne erstellen
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-fortnite-dark border border-purple-500/30 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {selectedCampaign ? 'Kampagne bearbeiten' : 'Neue Kampagne erstellen'}
              </h2>
              <button
                onClick={() => setShowCampaignModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Betreff</label>
                <input
                  type="text"
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                  placeholder="Newsletter-Betreff"
                  className="w-full px-4 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Inhalt</label>
                <textarea
                  value={campaignForm.content}
                  onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                  placeholder="Newsletter-Inhalt..."
                  rows={10}
                  className="w-full px-4 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowCampaignModal(false)}
                  className="px-6 py-2 bg-fortnite-darker border border-purple-500/30 text-white rounded-lg hover:border-purple-500 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreateCampaign}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all"
                >
                  Erstellen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}






