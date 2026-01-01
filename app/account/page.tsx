'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { User, Edit2, Save, X, LogOut, Coins, ShoppingBag, Calendar, Award, Gift, Trophy, Sparkles } from 'lucide-react'
import { TIER_INFO, calculateTier } from '@/types/user'
import { getOrders } from '@/data/payments'
import { getSackHistory } from '@/data/sackHistory'
import { getInventory } from '@/data/inventory'

export default function AccountPage() {
  const router = useRouter()
  const { user, logout, updateUser, isAuthenticated, isLoading } = useAuth()
  const { showSuccess, showError } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    sacksOpened: 0,
    itemsWon: 0,
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (user) {
      setEditData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })

      // Calculate statistics
      const loadStats = async () => {
        const orders = await getOrders()
        const userOrders = orders.filter(o => o.userId === user.id)
        const sackHistory = getSackHistory()
        const inventory = getInventory()

        setStats({
          totalOrders: userOrders.length,
          totalSpent: user.totalSpent,
          sacksOpened: sackHistory.length,
          itemsWon: inventory.filter(i => !i.isRedeemed).length,
        })
      }
      loadStats()
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Lädt...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const tierInfo = TIER_INFO[user.tier]
  const nextTier = Object.values(TIER_INFO).find(t => t.minCoins > user.goofyCoins)
  const progressToNextTier = nextTier
    ? Math.min((user.goofyCoins / nextTier.minCoins) * 100, 100)
    : 100

  const handleSave = () => {
    updateUser(editData)
    setIsEditing(false)
    showSuccess('Profil erfolgreich aktualisiert!')
  }

  const handleCancel = () => {
    setEditData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    })
    setIsEditing(false)
  }

  const handleLogout = () => {
    logout()
    showSuccess('Erfolgreich abgemeldet')
    router.push('/')
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Mein Konto</h1>
          <p className="text-gray-400">Verwalten Sie Ihr Profil und Einstellungen</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <User className="w-6 h-6 mr-2 text-purple-400" />
                  Profil
                </h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Bearbeiten</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center space-x-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Speichern</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Abbrechen</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Vorname
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.firstName}
                        onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                        className="w-full px-4 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ) : (
                      <p className="text-white">{user.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nachname
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.lastName}
                        onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                        className="w-full px-4 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ) : (
                      <p className="text-white">{user.lastName}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    E-Mail-Adresse
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full px-4 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <p className="text-white">{user.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mitglied seit
                  </label>
                  <p className="text-white">
                    {new Date(user.joinDate).toLocaleDateString('de-DE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics Card */}
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Statistiken</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-fortnite-darker rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <ShoppingBag className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-400 text-sm">Bestellungen</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                </div>
                <div className="bg-fortnite-darker rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-400 text-sm">Ausgegeben</span>
                  </div>
                  <p className="text-2xl font-bold text-white">€{stats.totalSpent.toFixed(2)}</p>
                </div>
                <div className="bg-fortnite-darker rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-5 h-5 text-green-400" />
                    <span className="text-gray-400 text-sm">Säcke geöffnet</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.sacksOpened}</p>
                </div>
                <div className="bg-fortnite-darker rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-400 text-sm">Items gewonnen</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.itemsWon}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Tier & Actions */}
          <div className="space-y-6">
            {/* Tier Card */}
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Award className="w-6 h-6 mr-2" style={{ color: tierInfo.color }} />
                {user.tier} Tier
              </h2>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">GoofyCoins</span>
                  <span className="text-white font-semibold">{user.goofyCoins}</span>
                </div>
                {nextTier && (
                  <>
                    <div className="w-full bg-fortnite-darker rounded-full h-2 mb-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${progressToNextTier}%`,
                          backgroundColor: tierInfo.color,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      {nextTier.minCoins - user.goofyCoins} Coins bis {nextTier.name}
                    </p>
                  </>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Vorteile:</p>
                <ul className="space-y-1">
                  {tierInfo.benefits.map((benefit, index) => (
                    <li key={index} className="text-sm text-white flex items-center">
                      <span className="text-purple-400 mr-2">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Aktionen</h2>
              <div className="space-y-3">
                <a
                  href="/account/goofycoins"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/account/goofycoins')
                  }}
                  className="block w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-lg transition-colors text-center flex items-center justify-center space-x-2"
                >
                  <Coins className="w-4 h-4" />
                  <span>GoofyCoins verwalten</span>
                </a>
                <a
                  href="/account/orders"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/account/orders')
                  }}
                  className="block w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 px-4 py-3 rounded-lg transition-colors text-center"
                >
                  Bestellhistorie
                </a>
                <a
                  href="/inventory"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/inventory')
                  }}
                  className="block w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 px-4 py-3 rounded-lg transition-colors text-center"
                >
                  Inventar
                </a>
              </div>
            </div>

            {/* Features Card */}
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Features</h2>
              <div className="space-y-3">
                <a
                  href="/sacks"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/sacks')
                  }}
                  className="block w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 text-purple-400 px-4 py-3 rounded-lg transition-colors text-center flex items-center justify-center space-x-2"
                >
                  <Gift className="w-4 h-4" />
                  <span>🎁 Säcke öffnen</span>
                </a>
                <a
                  href="/daily-rewards"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/daily-rewards')
                  }}
                  className="block w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg transition-colors text-center flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Tägliche Belohnungen</span>
                </a>
                <a
                  href="/leaderboard"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/leaderboard')
                  }}
                  className="block w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-lg transition-colors text-center flex items-center justify-center space-x-2"
                >
                  <Trophy className="w-4 h-4" />
                  <span>🏆 Leaderboard</span>
                </a>
              </div>
            </div>

            {/* Logout Card */}
            <div className="bg-fortnite-dark border border-red-500/20 rounded-lg p-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Abmelden</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
