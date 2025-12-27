'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import { Mail, Search, CheckCircle, Clock } from 'lucide-react'

interface ContactRequest {
  id: string
  name: string
  email: string
  category: string
  subject: string
  message: string
  submittedAt: string
  status: 'pending' | 'read' | 'replied'
}

export default function AdminContactRequestsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [requests, setRequests] = useState<ContactRequest[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true)
      return // Wait for auth to load
    }
    
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    if (!isAdmin(user.email)) {
      router.push('/account')
      return
    }
    
    loadRequests()
    setIsLoading(false)
  }, [user, router, authLoading])

  const loadRequests = () => {
    try {
      const stored = localStorage.getItem('simexmafia-contact-requests')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setRequests(parsed.sort((a, b) => 
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          ))
        }
      }
    } catch (error) {
      console.error('Error loading contact requests:', error)
    }
  }

  const filteredRequests = requests.filter(request =>
    request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  return (
    <div className="min-h-screen bg-fortnite-darker py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-8">Kontaktanfragen</h1>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Nach Name, E-Mail oder Betreff suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-fortnite-dark border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <Mail className="w-5 h-5 text-purple-400" />
                    <h3 className="text-white font-semibold text-lg">{request.subject}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        request.status === 'replied'
                          ? 'bg-green-500/20 text-green-400'
                          : request.status === 'read'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {request.status === 'replied' ? 'Beantwortet' : request.status === 'read' ? 'Gelesen' : 'Ausstehend'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Von: {request.name} ({request.email}) • {request.category}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(request.submittedAt).toLocaleDateString('de-DE', {
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
                <p className="text-gray-300 whitespace-pre-wrap">{request.message}</p>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={`mailto:${request.email}?subject=Re: ${request.subject}`}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded-lg transition-colors"
                >
                  Antworten
                </a>
              </div>
            </div>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Keine Kontaktanfragen gefunden</p>
          </div>
        )}
      </div>
    </div>
  )
}

