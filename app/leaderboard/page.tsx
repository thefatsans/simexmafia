'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getLeaderboard, getUserRank, LeaderboardEntry } from '@/data/leaderboard'
import { mockUser } from '@/data/user'
import { Trophy, Medal, Award, Crown, Gift, Coins, TrendingUp, Package, Star, Flame } from 'lucide-react'
import { getSackByType } from '@/data/sacks'
import { useAuth } from '@/contexts/AuthContext'

export default function LeaderboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  
  // All hooks must be called before any conditional returns
  const [selectedCategory, setSelectedCategory] = useState<'sacks' | 'spent' | 'products' | 'coins' | 'success'>('sacks')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState(0)

  const { user } = useAuth()
  
  // Define loadLeaderboard function before using it in useEffect
  const loadLeaderboard = () => {
    if (!user) return
    
    const entries = getLeaderboard(selectedCategory, user.id)
    console.log('[Leaderboard Page] Loaded entries:', entries.length)
    console.log('[Leaderboard Page] Entry details:', entries.map(e => ({ userId: e.userId, userName: e.userName, sacks: e.stats.totalSacksOpened })))
    setLeaderboard(entries)
    setUserRank(getUserRank(user.id, selectedCategory))
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/leaderboard')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated && user) {
      // Migration entfernt - alte Einträge werden nicht mehr automatisch migriert
      // Nur Einträge mit korrekter User-ID werden gezählt
      
      loadLeaderboard()
      // Auto-refresh every 3 seconds for real-time updates (optimiert)
      const interval = setInterval(loadLeaderboard, 3000)
      return () => clearInterval(interval)
    }
  }, [selectedCategory, isAuthenticated, user])
  
  // Clear cache when component unmounts or user changes
  useEffect(() => {
    return () => {
      // Cache wird automatisch nach CACHE_DURATION geleert
    }
  }, [user])

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Laden...</div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  const getCategoryTitle = () => {
    switch (selectedCategory) {
      case 'sacks':
        return 'Meiste Säcke geöffnet'
      case 'spent':
        return 'Meiste ausgegeben'
      case 'products':
        return 'Meiste Produkte gewonnen'
      case 'coins':
        return 'Meiste Coins gewonnen'
      case 'success':
        return 'Beste Erfolgsrate'
      default:
        return 'Leaderboard'
    }
  }

  const getCategoryIcon = () => {
    switch (selectedCategory) {
      case 'sacks':
        return <Gift className="w-6 h-6" />
      case 'spent':
        return <TrendingUp className="w-6 h-6" />
      case 'products':
        return <Package className="w-6 h-6" />
      case 'coins':
        return <Coins className="w-6 h-6" />
      case 'success':
        return <Star className="w-6 h-6" />
      default:
        return <Trophy className="w-6 h-6" />
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />
    if (rank === 3) return <Award className="w-6 h-6 text-orange-400" />
    return <span className="text-gray-400 font-bold text-lg">#{rank}</span>
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-500 to-yellow-600'
    if (rank === 2) return 'from-gray-300 to-gray-400'
    if (rank === 3) return 'from-orange-500 to-orange-600'
    return 'from-purple-500 to-purple-600'
  }

  const getCategoryValue = (entry: LeaderboardEntry) => {
    switch (selectedCategory) {
      case 'sacks':
        return entry.stats.totalSacksOpened
      case 'spent':
        return `€${entry.stats.totalSpent.toFixed(2)}`
      case 'products':
        return entry.stats.totalProductsWon
      case 'coins':
        return entry.stats.totalCoinsWon
      case 'success':
        return `${entry.stats.successRate.toFixed(1)}%`
      default:
        return 0
    }
  }

  const currentUserEntry = user ? leaderboard.find(e => e.userId === user.id) : null

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Leaderboard</h1>
          <p className="text-xl text-gray-400 mb-6">
            Die besten Sack-Öffner der Community
          </p>
          
          {/* User Rank Badge */}
          {currentUserEntry && (
            <div className="inline-flex items-center space-x-3 bg-purple-500/20 border border-purple-500/30 rounded-lg px-6 py-3">
              <Trophy className="w-6 h-6 text-purple-400" />
              <div>
                <div className="text-gray-400 text-sm">Dein Rang</div>
                <div className="text-purple-400 font-bold text-xl">#{userRank}</div>
              </div>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedCategory('sacks')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
              selectedCategory === 'sacks'
                ? 'bg-purple-500 text-white'
                : 'bg-fortnite-dark border border-purple-500/20 text-gray-300 hover:border-purple-500/50'
            }`}
          >
            <Gift className="w-5 h-5" />
            <span>Meiste Säcke</span>
          </button>
          <button
            onClick={() => setSelectedCategory('spent')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
              selectedCategory === 'spent'
                ? 'bg-purple-500 text-white'
                : 'bg-fortnite-dark border border-purple-500/20 text-gray-300 hover:border-purple-500/50'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Meiste ausgegeben</span>
          </button>
          <button
            onClick={() => setSelectedCategory('products')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
              selectedCategory === 'products'
                ? 'bg-purple-500 text-white'
                : 'bg-fortnite-dark border border-purple-500/20 text-gray-300 hover:border-purple-500/50'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Meiste Produkte</span>
          </button>
          <button
            onClick={() => setSelectedCategory('coins')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
              selectedCategory === 'coins'
                ? 'bg-purple-500 text-white'
                : 'bg-fortnite-dark border border-purple-500/20 text-gray-300 hover:border-purple-500/50'
            }`}
          >
            <Coins className="w-5 h-5" />
            <span>Meiste Coins</span>
          </button>
          <button
            onClick={() => setSelectedCategory('success')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
              selectedCategory === 'success'
                ? 'bg-purple-500 text-white'
                : 'bg-fortnite-dark border border-purple-500/20 text-gray-300 hover:border-purple-500/50'
            }`}
          >
            <Star className="w-5 h-5" />
            <span>Erfolgsrate</span>
          </button>
        </div>

        {/* Category Header */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3">
            {getCategoryIcon()}
            <h2 className="text-2xl font-bold text-white">{getCategoryTitle()}</h2>
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 ? (
          <div className="space-y-4">
            {/* Top 3 Podium - nur wenn mindestens 3 Einträge vorhanden */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* 2nd Place */}
                <div className="bg-fortnite-dark border border-gray-300/30 rounded-lg p-6 text-center transform scale-95">
                  <div className="flex justify-center mb-3">
                    <Medal className="w-8 h-8 text-gray-300" />
                  </div>
                  <div className="text-4xl mb-2">{leaderboard[1].avatar || '👤'}</div>
                  <h3 className="text-white font-bold text-lg mb-1">{leaderboard[1].userName}</h3>
                  <div className="text-gray-300 font-semibold text-xl mb-2">
                    {getCategoryValue(leaderboard[1])}
                  </div>
                  <div className="text-gray-400 text-sm">#{2}</div>
                </div>

                {/* 1st Place */}
                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500/50 rounded-lg p-6 text-center transform scale-105 relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Crown className="w-10 h-10 text-yellow-400" />
                  </div>
                  <div className="text-5xl mb-2 mt-4">{leaderboard[0].avatar || '👑'}</div>
                  <h3 className="text-white font-bold text-xl mb-1">{leaderboard[0].userName}</h3>
                  <div className="text-yellow-400 font-bold text-2xl mb-2">
                    {getCategoryValue(leaderboard[0])}
                  </div>
                  <div className="text-yellow-400 font-semibold">#{1}</div>
                </div>

                {/* 3rd Place */}
                <div className="bg-fortnite-dark border border-orange-300/30 rounded-lg p-6 text-center transform scale-95">
                  <div className="flex justify-center mb-3">
                    <Award className="w-8 h-8 text-orange-400" />
                  </div>
                  <div className="text-4xl mb-2">{leaderboard[2].avatar || '👤'}</div>
                  <h3 className="text-white font-bold text-lg mb-1">{leaderboard[2].userName}</h3>
                  <div className="text-orange-400 font-semibold text-xl mb-2">
                    {getCategoryValue(leaderboard[2])}
                  </div>
                  <div className="text-gray-400 text-sm">#{3}</div>
                </div>
              </div>
            )}

            {/* Top 1-2 Einträge (wenn weniger als 3 vorhanden) */}
            {leaderboard.length < 3 && leaderboard.length > 0 && (
              <div className="space-y-3 mb-8">
                {leaderboard.map((entry, index) => {
                  const rank = index + 1
                  const isCurrentUser = user && entry.userId === user.id
                  
                  return (
                    <div
                      key={entry.userId}
                      className={`bg-gradient-to-br ${rank === 1 ? 'from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500/50' : 'from-fortnite-dark border border-purple-500/30'} rounded-lg p-6 hover:border-purple-500/50 transition-all ${
                        isCurrentUser
                          ? 'ring-2 ring-purple-500/30'
                          : ''
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-12 text-center">
                          {rank === 1 ? (
                            <Crown className="w-8 h-8 text-yellow-400" />
                          ) : (
                            <span className="text-gray-400 font-bold text-lg">#{rank}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="text-4xl flex-shrink-0">{entry.avatar || (rank === 1 ? '👑' : '👤')}</div>

                        {/* User Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className={`font-bold text-lg ${isCurrentUser ? 'text-purple-400' : rank === 1 ? 'text-yellow-400' : 'text-white'}`}>
                              {entry.userName}
                              {isCurrentUser && <span className="text-purple-400 text-sm ml-2">(Du)</span>}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                            <span>{entry.stats.totalSacksOpened} Säcke</span>
                            <span>•</span>
                            <span>{entry.stats.totalProductsWon} Produkte</span>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <Flame className="w-4 h-4" />
                              <span>{entry.stats.successRate.toFixed(1)}% Erfolg</span>
                            </span>
                          </div>
                        </div>

                        {/* Category Value */}
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${rank === 1 ? 'text-yellow-400' : 'text-purple-400'}`}>
                            {getCategoryValue(entry)}
                          </div>
                          {selectedCategory === 'sacks' && entry.stats.favoriteSackType && (
                            <div className="text-sm text-gray-400 mt-1">
                              {getSackByType(entry.stats.favoriteSackType as any)?.icon} Favorit
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Additional Stats */}
                      {isCurrentUser && (
                        <div className="mt-4 pt-4 border-t border-purple-500/20 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Gesamt ausgegeben</div>
                            <div className="text-white font-semibold">€{entry.stats.totalSpent.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Beste Belohnung</div>
                            <div className="text-green-400 font-semibold">
                              {entry.stats.bestReward?.type === 'product' 
                                ? `€${entry.stats.bestReward.value.toFixed(2)}`
                                : entry.stats.bestReward?.type === 'coins'
                                ? `${entry.stats.bestReward.value} Coins`
                                : '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Coins gewonnen</div>
                            <div className="text-yellow-400 font-semibold">{entry.stats.totalCoinsWon}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Erfolgsrate</div>
                            <div className="text-purple-400 font-semibold">{entry.stats.successRate.toFixed(1)}%</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Rest of Leaderboard (ab Platz 4) */}
            {leaderboard.length > 3 && (
              <div className="space-y-3">
                {leaderboard.slice(3).map((entry, index) => {
                const rank = index + 4
                const isCurrentUser = user && entry.userId === user.id
                
                return (
                  <div
                    key={entry.userId}
                    className={`bg-fortnite-dark border rounded-lg p-6 hover:border-purple-500/50 transition-all ${
                      isCurrentUser
                        ? 'border-purple-500/50 ring-2 ring-purple-500/30'
                        : 'border-purple-500/20'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 text-center">
                        {getRankIcon(rank)}
                      </div>

                      {/* Avatar */}
                      <div className="text-4xl flex-shrink-0">{entry.avatar || '👤'}</div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-bold text-lg ${isCurrentUser ? 'text-purple-400' : 'text-white'}`}>
                            {entry.userName}
                            {isCurrentUser && <span className="text-purple-400 text-sm ml-2">(Du)</span>}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                          <span>{entry.stats.totalSacksOpened} Säcke</span>
                          <span>•</span>
                          <span>{entry.stats.totalProductsWon} Produkte</span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Flame className="w-4 h-4" />
                            <span>{entry.stats.successRate.toFixed(1)}% Erfolg</span>
                          </span>
                        </div>
                      </div>

                      {/* Category Value */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-400">
                          {getCategoryValue(entry)}
                        </div>
                        {selectedCategory === 'sacks' && entry.stats.favoriteSackType && (
                          <div className="text-sm text-gray-400 mt-1">
                            {getSackByType(entry.stats.favoriteSackType as any)?.icon} Favorit
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Stats */}
                    {isCurrentUser && (
                      <div className="mt-4 pt-4 border-t border-purple-500/20 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-gray-400 text-xs mb-1">Gesamt ausgegeben</div>
                          <div className="text-white font-semibold">€{entry.stats.totalSpent.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs mb-1">Beste Belohnung</div>
                          <div className="text-green-400 font-semibold">
                            {entry.stats.bestReward?.type === 'product' 
                              ? `€${entry.stats.bestReward.value.toFixed(2)}`
                              : entry.stats.bestReward?.type === 'coins'
                              ? `${entry.stats.bestReward.value} Coins`
                              : '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs mb-1">Coins gewonnen</div>
                          <div className="text-yellow-400 font-semibold">{entry.stats.totalCoinsWon}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs mb-1">Erfolgsrate</div>
                          <div className="text-purple-400 font-semibold">{entry.stats.successRate.toFixed(1)}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <Trophy className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Noch kein Leaderboard</h2>
            <p className="text-gray-400 mb-6">
              Öffnen Sie Säcke, um im Leaderboard zu erscheinen!
            </p>
            <a
              href="/sacks"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/sacks'
              }}
              className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Säcke öffnen
            </a>
          </div>
        )}
      </div>
    </div>
  )
}






