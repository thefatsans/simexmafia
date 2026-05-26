'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Copy, Gift, Users, Coins, ArrowLeft } from 'lucide-react'
import { LoadingPage } from '@/components/LoadingSpinner'

interface ReferralStats {
  code: string | null
  invitedCount: number
  rewardedCount: number
  earnedCoins: number
}

export default function ReferralPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { showSuccess, showError } = useToast()
  const router = useRouter()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/referral', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) {
        throw new Error('Konnte Statistik nicht laden')
      }
      const data: ReferralStats = await res.json()
      setStats(data)
    } catch (err) {
      console.error(err)
      showError('Referral-Daten konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    if (isAuthenticated) refresh()
  }, [isAuthenticated, refresh])

  const inviteLink =
    stats?.code && typeof window !== 'undefined'
      ? `${window.location.origin}/auth/register?ref=${stats.code}`
      : ''

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      showSuccess(`${label} kopiert!`)
    } catch {
      showError('Kopieren fehlgeschlagen')
    }
  }

  if (isLoading || !user) {
    return <LoadingPage label="Einladungsprogramm wird geladen..." />
  }

  return (
    <div className="min-h-screen py-10 bg-fortnite-darker">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/account"
          className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück zum Konto
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Gift className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Freunde einladen</h1>
            <p className="text-gray-400 text-sm">
              Dein Code bringt dir und deinen Freunden GoofyCoins.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Users className="w-4 h-4" /> Eingeladen
            </div>
            <div className="text-3xl font-bold text-white">
              {loading ? '…' : stats?.invitedCount ?? 0}
            </div>
          </div>
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Gift className="w-4 h-4" /> Belohnt
            </div>
            <div className="text-3xl font-bold text-white">
              {loading ? '…' : stats?.rewardedCount ?? 0}
            </div>
          </div>
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Coins className="w-4 h-4" /> Verdient
            </div>
            <div className="text-3xl font-bold text-white">
              {loading ? '…' : `${stats?.earnedCoins ?? 0} Coins`}
            </div>
          </div>
        </div>

        <div className="bg-fortnite-dark border border-purple-500/20 rounded-xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dein Code
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={stats?.code || '…'}
                className="flex-1 bg-fortnite-darker border border-purple-500/30 rounded-lg px-4 py-3 text-white tracking-[0.4em] font-mono text-lg"
              />
              <button
                type="button"
                onClick={() => stats?.code && copy(stats.code, 'Code')}
                className="px-4 py-3 rounded-lg bg-purple-500 hover:bg-purple-600 text-white inline-flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Kopieren
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Einladungslink
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 bg-fortnite-darker border border-purple-500/30 rounded-lg px-4 py-3 text-white text-sm"
              />
              <button
                type="button"
                onClick={() => inviteLink && copy(inviteLink, 'Link')}
                className="px-4 py-3 rounded-lg bg-purple-500 hover:bg-purple-600 text-white inline-flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Kopieren
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              So funktioniert&apos;s: Teile deinen Link. Sobald ein eingeladener Nutzer seine erste Bestellung abschließt, bekommt ihr beide GoofyCoins.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
