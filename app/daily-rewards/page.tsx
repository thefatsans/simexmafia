'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getDailyRewardData,
  claimDailyReward,
  canClaimReward,
  isStreakBroken,
  getNextReward,
  getTimeUntilNextClaim,
  dailyRewards,
  DailyReward,
} from '@/data/dailyRewards'
import { mockUser } from '@/data/user'
import { useToast } from '@/contexts/ToastContext'
import { Coins, Calendar, Flame, Gift, Check, Clock, X, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function DailyRewardsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user, addCoins, syncUserFromDatabase } = useAuth()
  
  // All hooks must be called before any conditional returns
  const [rewardData, setRewardData] = useState(() => getDailyRewardData(user?.id))
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimedReward, setClaimedReward] = useState<{ reward: DailyReward; totalCoins: number } | null>(null)
  const [timeUntilNext, setTimeUntilNext] = useState(0)
  const { showSuccess, showInfo, showError } = useToast()
  
  // Get userCoins from AuthContext
  const userCoins = user?.goofyCoins || 0

  // Define functions before using them in useEffect
  const loadData = () => {
    if (!isAuthenticated || !user) return
    
    const data = getDailyRewardData(user.id)
    setRewardData(data)
    
    // Prüfe ob Belohnung geholt werden kann
    if (canClaimReward(user.id) && !showClaimModal && !claimedReward) {
      setShowClaimModal(true)
    }
  }

  const updateTimer = () => {
    if (!user) return
    const time = getTimeUntilNextClaim(user.id)
    setTimeUntilNext(time)
  }

  // All useEffect hooks must be called before any conditional returns
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/daily-rewards')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated && user) {
      loadData()
      updateTimer()
      const timerInterval = setInterval(updateTimer, 1000)
      const dataInterval = setInterval(loadData, 5000) // Refresh data every 5 seconds
      return () => {
        clearInterval(timerInterval)
        clearInterval(dataInterval)
      }
    }
  }, [isAuthenticated, user])

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

  const formatTime = (ms: number) => {
    if (ms <= 0) return 'Jetzt verfügbar!'
    
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  const handleClaim = async () => {
    if (!user?.id) return
    
    try {
      // Rufe API auf für serverseitige Validierung
      const response = await fetch('/api/daily-rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        showError?.(data.error || 'Fehler beim Einlösen der täglichen Belohnung')
        return
      }

      // Update user balance from server response
      if (data.newBalance !== undefined) {
        // Synchronisiere User-Balance mit Server
        await syncUserFromDatabase()
      }

      setClaimedReward({ reward: data.reward, totalCoins: data.totalCoins })
      setShowClaimModal(false)
      loadData()
      
      // Toast-Benachrichtigung
      showSuccess(`Tägliche Belohnung erhalten! +${data.totalCoins} GoofyCoins`, 5000)
      if (data.newStreak > 1) {
        showInfo(`Streak: ${data.newStreak} Tage!`, 4000)
      }
      
      // Nach 5 Sekunden Erfolgs-Modal schließen
      setTimeout(() => {
        setClaimedReward(null)
      }, 5000)
    } catch (error: any) {
      console.error('[Daily Rewards] Error claiming reward:', error)
      showError('Fehler beim Einlösen der täglichen Belohnung')
    }
  }

  const nextReward = user ? getNextReward(user.id) : null
  const streakBroken = user ? isStreakBroken(user.id) : false

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Tägliche Belohnungen</h1>
          <p className="text-xl text-gray-400 mb-6">
            Holen Sie sich jeden Tag kostenlose GoofyCoins!
          </p>
          <div className="flex items-center justify-center space-x-6">
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-6 py-3">
              <div className="flex items-center space-x-2">
                <Coins className="w-6 h-6 text-yellow-400" />
                <span className="text-yellow-400 font-semibold text-xl">{userCoins}</span>
                <span className="text-gray-400">GoofyCoins</span>
              </div>
            </div>
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg px-6 py-3">
              <div className="flex items-center space-x-2">
                <Flame className="w-6 h-6 text-orange-400" />
                <span className="text-orange-400 font-semibold text-xl">{rewardData.currentStreak}</span>
                <span className="text-gray-400">Tag Streak</span>
              </div>
            </div>
          </div>
        </div>

        {/* Streak Warning */}
        {streakBroken && rewardData.currentStreak > 0 && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <X className="w-5 h-5 text-red-400" />
              <span className="text-red-400">
                Ihr Streak wurde zurückgesetzt! Holen Sie sich heute Ihre Belohnung, um wieder zu starten.
              </span>
            </div>
          </div>
        )}

        {/* Claim Button */}
        {user && canClaimReward(user.id) && (
          <div className="text-center mb-12">
            <button
              onClick={handleClaim}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xl px-12 py-6 rounded-lg transition-all transform hover:scale-105 flex items-center space-x-3 mx-auto shadow-lg shadow-purple-500/50"
            >
              <Gift className="w-8 h-8" />
              <span>Belohnung abholen!</span>
            </button>
            {nextReward && (
              <p className="text-gray-400 mt-4">
                Heute: {nextReward.coins} GoofyCoins
                {nextReward.bonus && ` + ${nextReward.bonus} Bonus`}
              </p>
            )}
          </div>
        )}

        {user && !canClaimReward(user.id) && (
          <div className="text-center mb-12">
            <div className="bg-fortnite-dark border border-purple-500/30 rounded-lg p-6 inline-block">
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-purple-400" />
                <div>
                  <div className="text-white font-semibold">Nächste Belohnung verfügbar in:</div>
                  <div className="text-purple-400 text-xl font-bold mt-1">{formatTime(timeUntilNext)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rewards Calendar */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">7-Tage Belohnungs-Kalender</h2>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {dailyRewards.map((reward, index) => {
              const isClaimed = rewardData.currentStreak >= reward.day
              const isCurrent = rewardData.currentStreak + 1 === reward.day && canClaimReward()
              const isNext = rewardData.currentStreak + 1 === reward.day && !canClaimReward()
              const isPast = reward.day < rewardData.currentStreak
              
              return (
                <div
                  key={reward.day}
                  className={`bg-fortnite-dark border rounded-lg p-4 text-center transition-all relative ${
                    isCurrent
                      ? 'border-purple-500 ring-2 ring-purple-500/50 scale-105'
                      : isClaimed
                      ? 'border-green-500/50'
                      : isNext
                      ? 'border-yellow-500/50'
                      : 'border-purple-500/20 opacity-60'
                  }`}
                >
                  {/* Status Badge */}
                  {isClaimed && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-5 h-5 text-green-400" />
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      HEUTE
                    </div>
                  )}

                  {/* Day Number */}
                  <div className="text-4xl mb-2">{reward.icon}</div>
                  <div className="text-sm text-gray-400 mb-1">{reward.name}</div>

                  {/* Coins */}
                  <div className="mb-2">
                    <div className="flex items-center justify-center space-x-1">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className={`font-bold ${isClaimed ? 'text-green-400' : 'text-yellow-400'}`}>
                        {reward.coins}
                      </span>
                    </div>
                    {reward.bonus && (
                      <div className="flex items-center justify-center space-x-1 mt-1">
                        <span className="text-green-400 text-xs font-semibold">+{reward.bonus} Bonus</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="text-xs text-gray-500">{reward.description}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Wie funktioniert's?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <Calendar className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">Täglich abholen</h3>
                <p className="text-gray-400 text-sm">
                  Besuchen Sie diese Seite jeden Tag, um Ihre Belohnung abzuholen
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Flame className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">Streak aufbauen</h3>
                <p className="text-gray-400 text-sm">
                  Halten Sie Ihren Streak aufrecht, um größere Belohnungen zu erhalten
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Gift className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">Wochensieg</h3>
                <p className="text-gray-400 text-sm">
                  Tag 7 gibt die größte Belohnung - 100 Coins + 50 Bonus!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Calendar className="w-6 h-6 text-purple-400" />
              <h3 className="text-gray-400 text-sm">Gesamt abgeholt</h3>
            </div>
            <div className="text-3xl font-bold text-white">{rewardData.totalClaims}</div>
          </div>
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Flame className="w-6 h-6 text-orange-400" />
              <h3 className="text-gray-400 text-sm">Aktueller Streak</h3>
            </div>
            <div className="text-3xl font-bold text-orange-400">{rewardData.currentStreak}</div>
          </div>
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Coins className="w-6 h-6 text-yellow-400" />
              <h3 className="text-gray-400 text-sm">Nächste Belohnung</h3>
            </div>
            <div className="text-3xl font-bold text-yellow-400">
              {nextReward ? `${nextReward.coins}${nextReward.bonus ? `+${nextReward.bonus}` : ''}` : '-'}
            </div>
          </div>
        </div>

        {/* Claim Modal */}
        {showClaimModal && user && canClaimReward(user.id) && nextReward && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-fortnite-dark border border-purple-500/30 rounded-lg p-8 max-w-md w-full relative">
              <div className="text-center">
                <div className="text-6xl mb-4">{nextReward.icon}</div>
                <h2 className="text-3xl font-bold text-white mb-2">Tägliche Belohnung!</h2>
                <p className="text-gray-400 mb-6">{nextReward.description}</p>

                <div className="bg-fortnite-darker rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Coins className="w-8 h-8 text-yellow-400" />
                    <span className="text-4xl font-bold text-yellow-400">{nextReward.coins}</span>
                    <span className="text-gray-400 text-xl">GoofyCoins</span>
                  </div>
                  {nextReward.bonus && (
                    <div className="flex items-center justify-center space-x-2">
                      <Sparkles className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-semibold text-lg">+{nextReward.bonus} Bonus</span>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-purple-500/20">
                    <div className="text-gray-400 text-sm">Gesamt:</div>
                    <div className="text-2xl font-bold text-white">
                      {nextReward.coins + (nextReward.bonus || 0)} GoofyCoins
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleClaim}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Gift className="w-5 h-5" />
                  <span>Belohnung abholen</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {claimedReward && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-fortnite-dark border border-green-500/30 rounded-lg p-8 max-w-md w-full relative animate-[fadeInScale_0.5s_ease-out]">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-12 h-12 text-green-400" />
                </div>
                <div className="text-6xl mb-4">{claimedReward.reward.icon}</div>
                <h2 className="text-3xl font-bold text-white mb-2">Belohnung erhalten!</h2>
                <p className="text-gray-400 mb-6">{claimedReward.reward.description}</p>
                <div className="bg-fortnite-darker rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center space-x-2">
                    <Coins className="w-6 h-6 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold text-xl">+{claimedReward.totalCoins}</span>
                    <span className="text-gray-400">GoofyCoins</span>
                  </div>
                </div>
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center space-x-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <span className="text-orange-400 font-semibold">
                      Streak: {rewardData.currentStreak} Tage
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setClaimedReward(null)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Verstanden
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

