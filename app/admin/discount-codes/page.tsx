'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import { getDiscountCodes, addDiscountCode, removeDiscountCode, DiscountCode } from '@/data/discountCodes'
import { Plus, Trash2, Tag, Edit } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

export default function AdminDiscountCodesPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { showSuccess, showError } = useToast()
  const [codes, setCodes] = useState<DiscountCode[]>([])
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
    
    loadCodes()
    setIsLoading(false)
  }, [user, router, authLoading])

  const loadCodes = () => {
    const allCodes = getDiscountCodes()
    setCodes(allCodes)
  }

  const handleDelete = (code: string) => {
    if (confirm(`Möchten Sie den Rabattcode "${code}" wirklich löschen?`)) {
      removeDiscountCode(code)
      loadCodes()
      showSuccess('Rabattcode erfolgreich gelöscht')
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

  return (
    <div className="min-h-screen bg-fortnite-darker py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Rabattcode-Verwaltung</h1>
          <button className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-lg transition-all transform hover:scale-105">
            <Plus className="w-5 h-5" />
            <span>Neuer Code</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {codes.map((code) => (
            <div
              key={code.code}
              className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Tag className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-bold text-lg">{code.code}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDelete(code.code)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-gray-300 text-sm">
                  <span className="text-gray-400">Typ:</span>{' '}
                  {code.type === 'percentage' ? 'Prozent' : 'Fester Betrag'}
                </p>
                <p className="text-white font-semibold">
                  {code.type === 'percentage' ? `${code.value}%` : `€${code.value.toFixed(2)}`}
                </p>
                {code.description && (
                  <p className="text-gray-400 text-sm">{code.description}</p>
                )}
                {code.minPurchase && (
                  <p className="text-gray-400 text-sm">
                    Mindestbestellwert: €{code.minPurchase.toFixed(2)}
                  </p>
                )}
                <p className="text-gray-400 text-sm">
                  Gültig: {new Date(code.validFrom).toLocaleDateString('de-DE')} - {new Date(code.validUntil).toLocaleDateString('de-DE')}
                </p>
                <p className="text-gray-400 text-sm">
                  Verwendet: {code.usedCount} / {code.usageLimit || '∞'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    code.isActive
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {code.isActive ? 'Aktiv' : 'Inaktiv'}
                </span>
                <span className="text-gray-400 text-xs">
                  {code.applicableTo === 'all' ? 'Alle' : code.applicableTo}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

