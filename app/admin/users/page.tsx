'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import { Users, Search } from 'lucide-react'

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
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
    
    setIsLoading(false)
  }, [user, router, authLoading])

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
        <h1 className="text-4xl font-bold text-white mb-8">Benutzerverwaltung</h1>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Nach Benutzern suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-fortnite-dark border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            Die Benutzerverwaltung wird in einer späteren Version implementiert.
          </p>
        </div>
      </div>
    </div>
  )
}

