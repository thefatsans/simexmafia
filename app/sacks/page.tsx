'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { sackTypes, openSack, Sack, SackReward, getSackByType, generatePossibleRewards } from '@/data/sacks'
import { mockUser } from '@/data/user'
import { saveSackHistory } from '@/data/sackHistory'
import { clearLeaderboardCache } from '@/data/leaderboard'
import { addToInventoryAsync } from '@/data/inventory'
import { OrderItem } from '@/data/payments'
import PaymentCheckout from '@/components/PaymentCheckout'
import { useToast } from '@/contexts/ToastContext'
import { ShoppingCart, Coins, Sparkles, Gift, X, History, Send } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import SackGiftsPanel from '@/components/sacks/SackGiftsPanel'
import { fetchPendingSackGifts, openSackGift, sendSackGift, type SackGiftItem } from '@/lib/api/sack-gifts'
import { getRewardRarity } from '@/lib/sacks/reward-rarity'
import type { SackType } from '@/data/sacks'

export default function SacksPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user, addCoins, subtractCoins, updateUser, syncUserFromDatabase } = useAuth()
  
  // All hooks must be called before any conditional returns
  const [selectedSack, setSelectedSack] = useState<Sack | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [reward, setReward] = useState<SackReward | null>(null)
  const [showReward, setShowReward] = useState(false)
  const [purchaseMethod, setPurchaseMethod] = useState<'coins' | 'money'>('coins')
  const [showPaymentCheckout, setShowPaymentCheckout] = useState(false)
  const [giftMode, setGiftMode] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [giftMessage, setGiftMessage] = useState('')
  const [pendingGifts, setPendingGifts] = useState<SackGiftItem[]>([])
  const [giftsLoading, setGiftsLoading] = useState(false)
  const [openingGiftId, setOpeningGiftId] = useState<string | null>(null)
  const [sendingGift, setSendingGift] = useState(false)
  const { showSuccess, showError, showInfo } = useToast()
  
  // CS:GO Case Animation State
  const [possibleRewards, setPossibleRewards] = useState<Array<{ reward: SackReward; rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' }>>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [cardWidth, setCardWidth] = useState(304)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const currentIndexRef = useRef(0)
  const finalIndexRef = useRef(0)
  const resultRef = useRef<SackReward | null>(null)
  const selectedSackRef = useRef<Sack | null>(null)
  const coinsSubtractedRef = useRef(false)
  const purchaseMethodRef = useRef<'coins' | 'money'>('coins')
  const coinsAddedRef = useRef(false) // Guard: Verhindert doppelte Coin-Zuweisung
  
  // Get userCoins from AuthContext
  const userCoins = user?.goofyCoins || 0

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/sacks')
    }
  }, [isAuthenticated, authLoading, router])

  // Sync localStorage user id with database (prevents "User ID mismatch")
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.email) {
      syncUserFromDatabase().catch(() => {})
    }
  }, [authLoading, isAuthenticated, user?.email, syncUserFromDatabase])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.id) {
      setGiftsLoading(true)
      fetchPendingSackGifts()
        .then(setPendingGifts)
        .finally(() => setGiftsLoading(false))
    }
  }, [authLoading, isAuthenticated, user?.id])

  const startRevealAnimation = (
    sack: Sack,
    result: SackReward,
    newBalance: number | undefined,
    method: 'coins' | 'money'
  ) => {
    resultRef.current = result
    selectedSackRef.current = sack
    coinsSubtractedRef.current = method === 'coins'
    purchaseMethodRef.current = method
    coinsAddedRef.current = result.type === 'coins' && result.coins ? true : false

    const rewards = generatePossibleRewards(sack)

    let finalIndex = rewards.findIndex(
      (r) =>
        r.reward.type === result.type &&
        (result.type === 'coins' ? r.reward.coins === result.coins : true) &&
        (result.type === 'product' ? r.reward.product?.id === result.product?.id : true)
    )

    if (finalIndex === -1) {
      rewards.push({ reward: result, rarity: getRewardRarity(result) })
      finalIndex = rewards.length - 1
    }

    setPossibleRewards(rewards)
    setShowReward(false)
    setReward(null)
    setCurrentIndex(0)
    setIsSpinning(true)
    setIsOpening(true)
    currentIndexRef.current = 0
    finalIndexRef.current = finalIndex
    startTimeRef.current = Date.now()

    const totalDuration = 4000
    const spinCycles = 3
    const totalCards = rewards.length
    const targetPosition = spinCycles * totalCards + finalIndex

    const animate = () => {
      const now = Date.now()
      const elapsed = now - (startTimeRef.current || 0)

      if (elapsed >= totalDuration) {
        setCurrentIndex(targetPosition)
        setIsSpinning(false)

        setTimeout(() => {
          const finalResult = resultRef.current
          const finalSack = selectedSackRef.current
          if (!finalResult || !finalSack) return

          setReward(finalResult)

          setTimeout(async () => {
            setIsOpening(false)
            setShowReward(true)

            if (newBalance !== undefined && user) {
              updateUser({ goofyCoins: newBalance })
            }

            syncUserFromDatabase().catch((err) => {
              console.error('[Sacks] Error syncing user:', err)
            })

            saveSackHistory(
              {
                sackId: finalSack.id,
                sackType: finalSack.type,
                sackName: finalSack.name,
                sackIcon: finalSack.icon,
                sackColor: finalSack.color,
                reward: finalResult,
                purchaseMethod: purchaseMethodRef.current,
                pricePaid:
                  purchaseMethodRef.current === 'coins'
                    ? finalSack.priceCoins
                    : finalSack.priceMoney,
              },
              user?.id
            )

            clearLeaderboardCache()

            if (finalResult.type === 'product' && finalResult.product && user?.id) {
              try {
                await addToInventoryAsync(
                  finalResult.product,
                  'sack',
                  finalSack.id,
                  finalSack.name,
                  user.id
                )
                setTimeout(() => {
                  showSuccess(`Produkt gewonnen: ${finalResult.product?.name}!`, 5000)
                }, 500)
              } catch (err) {
                console.error('[Sacks] Error adding product to inventory:', err)
              }
            }

            if (finalResult.type === 'coins' && finalResult.coins) {
              setTimeout(() => {
                showSuccess(`GoofyCoins gewonnen: +${finalResult.coins}!`, 5000)
              }, 500)
            }
          }, 2000)
        }, 500)

        return
      }

      const progress = elapsed / totalDuration
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      const currentPosition = Math.floor(easedProgress * targetPosition)

      setCurrentIndex(currentPosition)
      currentIndexRef.current = currentPosition

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Responsive card width for the opening animation (mobile vs desktop)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const updateCardWidth = () => {
      setCardWidth(window.innerWidth < 640 ? 220 : 304)
    }
    updateCardWidth()
    window.addEventListener('resize', updateCardWidth)
    return () => window.removeEventListener('resize', updateCardWidth)
  }, [])

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

  const handlePurchase = (sack: Sack) => {
    setSelectedSack(sack)
    setGiftMode(false)
    setRecipientEmail('')
    setGiftMessage('')
  }

  const handleSendGift = async () => {
    if (!selectedSack) return
    const email = recipientEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      showError('Bitte gib die E-Mail-Adresse des Empfängers an')
      return
    }

    setSendingGift(true)
    try {
      const result = await sendSackGift({
        sackType: selectedSack.type,
        recipientEmail: email,
        message: giftMessage.trim() || undefined,
      })

      if (!result.success) {
        showError(result.error || 'Geschenk fehlgeschlagen')
        return
      }

      if (result.newBalance !== undefined) {
        updateUser({ goofyCoins: result.newBalance })
      }

      showSuccess(`${selectedSack.name} wurde an ${email} verschenkt!`)
      setSelectedSack(null)
      setGiftMode(false)
      setRecipientEmail('')
      setGiftMessage('')
      await syncUserFromDatabase()
    } finally {
      setSendingGift(false)
    }
  }

  const handleOpenGift = async (gift: SackGiftItem) => {
    const sack = getSackByType(gift.sackType as SackType)
    if (!sack || !user?.id) return

    setOpeningGiftId(gift.id)
    try {
      const result = await openSackGift(gift.id)
      if (!result.success || !result.reward) {
        showError(result.error || 'Geschenk konnte nicht geöffnet werden')
        if (user?.id) await syncUserFromDatabase()
        return
      }

      setPendingGifts((prev) => prev.filter((g) => g.id !== gift.id))
      setSelectedSack(sack)
      startRevealAnimation(
        sack,
        result.reward as SackReward,
        result.newBalance,
        'coins'
      )
    } finally {
      setOpeningGiftId(null)
    }
  }

  const handleOpenSack = async () => {
    if (!selectedSack || !user?.id) return

    // Prüfe ob genug Coins vorhanden sind (client-side check)
    if (purchaseMethod === 'coins' && userCoins < selectedSack.priceCoins) {
      showError('Nicht genug GoofyCoins!')
      setTimeout(() => {
        const buyCoins = confirm('Möchten Sie GoofyCoins kaufen?')
        if (buyCoins) {
          window.location.href = '/goofycoins/buy'
        }
      }, 500)
      return
    }

    // Wenn Echtgeld, öffne Zahlungs-Checkout
    if (purchaseMethod === 'money') {
      setShowPaymentCheckout(true)
      return
    }

    // WICHTIG: Serverseitige Validierung für Coin-Käufe
    if (purchaseMethod === 'coins') {
      setIsPurchasing(true)
      try {
        const response = await fetch('/api/sacks/purchase', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sackType: selectedSack.type,
            purchaseMethod: 'coins',
          }),
        })

        let data: { success?: boolean; error?: string; reward?: SackReward; newBalance?: number; userId?: string }
        try {
          data = await response.json()
        } catch {
          showError('Ungültige Server-Antwort beim Sack-Kauf')
          if (user?.id) await syncUserFromDatabase()
          return
        }

        if (!response.ok || !data.success || !data.reward) {
          showError(data.error || 'Fehler beim Kauf des Sacks')
          if (user?.id) {
            await syncUserFromDatabase()
          }
          return
        }

        if (data.userId && user && data.userId !== user.id) {
          updateUser({ id: data.userId })
        }

        try {
          startRevealAnimation(selectedSack, data.reward, data.newBalance, 'coins')
        } catch (animError) {
          console.error('[Sacks] Animation error after purchase:', animError)
          if (data.newBalance !== undefined) {
            updateUser({ goofyCoins: data.newBalance })
          }
          setReward(data.reward)
          setShowReward(true)
          clearLeaderboardCache()
          showSuccess('Sack gekauft! Belohnung erhalten.')
        }
      } catch (error: unknown) {
        console.error('[Sacks] Error purchasing sack:', error)
        showError('Fehler beim Kauf des Sacks. Bitte versuchen Sie es erneut.')
        if (user?.id) await syncUserFromDatabase()
      } finally {
        setIsPurchasing(false)
      }
      return
    }

    // Fallback für den Fall, dass purchaseMethod nicht 'coins' ist (sollte nicht passieren)
    showError('Ungültige Zahlungsmethode')
    setIsOpening(false)
    return
  }

  const handleCloseReward = () => {
    // Zeige Toast an, bevor das Modal geschlossen wird
    if (reward) {
      if (reward.type === 'product' && reward.product) {
        showSuccess(`Produkt gewonnen: ${reward.product.name}!`, 5000)
      } else if (reward.type === 'coins' && reward.coins) {
        showSuccess(`${reward.coins} GoofyCoins gewonnen!`, 4000)
      } else if (reward.type === 'nothing') {
        showInfo('Niete! Versuchen Sie es erneut.', 3000)
      }
    }
    setShowReward(false)
    setSelectedSack(null)
    setReward(null)
  }

  const handleOpenSackAfterPayment = (orderId?: string) => {
    if (!selectedSack) return

    // Generiere mögliche Belohnungen für Animation
    const rewards = generatePossibleRewards(selectedSack)
    
    // Bestimme die tatsächliche Belohnung
    const result = openSack(selectedSack)
    resultRef.current = result
    selectedSackRef.current = selectedSack
    coinsSubtractedRef.current = false
    purchaseMethodRef.current = 'money'
    coinsAddedRef.current = false // Reset guard
    
    // Finde die Belohnung in der Liste oder füge sie hinzu
    let finalIndex = rewards.findIndex(r => 
      r.reward.type === result.type &&
      (result.type === 'coins' ? r.reward.coins === result.coins : true) &&
      (result.type === 'product' ? r.reward.product?.id === result.product?.id : true)
    )
    
    if (finalIndex === -1) {
      rewards.push({ reward: result, rarity: getRewardRarity(result) })
      finalIndex = rewards.length - 1
    }
    
    // Setze State
    setPossibleRewards(rewards)
    setIsOpening(true)
    setShowReward(false)
    setReward(null)
    setCurrentIndex(0)
    setIsSpinning(true)
    currentIndexRef.current = 0
    finalIndexRef.current = finalIndex
    startTimeRef.current = Date.now()
    
    // Gleichmäßige Animation mit requestAnimationFrame
    // Gleichmäßige Animation mit kontinuierlicher Position
    const totalDuration = 4000 // 4 Sekunden total
    const spinCycles = 3 // Mindestens 3 volle Runden
    
    // Berechne wie viele Karten wir durchlaufen müssen
    const totalCards = rewards.length
    // Starte bei 0, gehe durch spinCycles Runden, dann zur finalen Position
    const targetPosition = spinCycles * totalCards + finalIndex
    
    const animate = () => {
      const now = Date.now()
      const elapsed = now - (startTimeRef.current || 0)
      
      if (elapsed >= totalDuration) {
        // Finale Position erreichen - verwende die absolute Position die zu finalIndex führt
        // targetPosition = spinCycles * totalCards + finalIndex
        // Am Ende sollte currentIndex = targetPosition sein, was zu finalIndex führt
        const finalAbsoluteIndex = targetPosition
        setCurrentIndex(finalAbsoluteIndex)
        setIsSpinning(false)
        
        // Kurze Pause, damit der Benutzer die Belohnung sehen kann
        setTimeout(() => {
          const finalResult = resultRef.current
          const finalSack = selectedSackRef.current
          if (!finalResult || !finalSack) return
          
          setReward(finalResult)
          
          // Warte weitere 2 Sekunden, damit die Belohnung sichtbar bleibt
          setTimeout(async () => {
            setIsOpening(false)
            setShowReward(true)
            
            saveSackHistory({
              sackId: finalSack.id,
              sackType: finalSack.type,
              sackName: finalSack.name,
              sackIcon: finalSack.icon,
              sackColor: finalSack.color,
              reward: finalResult,
              purchaseMethod: 'money',
              pricePaid: finalSack.priceMoney,
            }, user?.id)
            
            // Clear leaderboard cache for real-time updates
            clearLeaderboardCache()
            
            if (finalResult.type === 'product' && finalResult.product && user?.id) {
              try {
                await addToInventoryAsync(
                  finalResult.product,
                  'sack',
                  finalSack.id,
                  finalSack.name,
                  user.id
                )
                setTimeout(() => {
                  showSuccess(`Produkt gewonnen: ${finalResult.product?.name}!`, 5000)
                }, 500)
              } catch (err) {
                console.error('[Sacks] Error adding product to inventory:', err)
              }
            }
            
            if (finalResult.type === 'coins' && finalResult.coins && !coinsAddedRef.current) {
              const coinsWon = finalResult.coins
              coinsAddedRef.current = true // Setze Guard, um doppelte Zuweisung zu verhindern
              
              // WICHTIG: Nur NETTO-Coins hinzufügen (nicht die vollen coinsWon)
              // Wenn mit Coins bezahlt wurde, wurden die Coins bereits abgezogen
              // Also: coinsWon - priceCoins (wenn mit Coins bezahlt) = Netto-Gewinn
              // Da purchaseMethodRef.current === 'money', wurden keine Coins abgezogen
              const netCoins = coinsWon  // Mit Echtgeld bezahlt: Voller Gewinn
              
              // Coins hinzufügen
              addCoins(netCoins)
              setTimeout(() => {
                showSuccess(`${coinsWon} GoofyCoins gewonnen!`, 4000)
              }, 500)
            }
            
            if (finalResult.type === 'nothing') {
              setTimeout(() => {
                showInfo('Niete! Versuchen Sie es erneut.', 3000)
              }, 500)
            }
          }, 2000) // 2 Sekunden Pause, damit die Belohnung sichtbar bleibt
        }, 300)
        return
      }
      
      // Ease-out Funktion für smooth slowdown
      const progress = elapsed / totalDuration
      const easeOut = 1 - Math.pow(1 - progress, 3) // Cubic ease-out
      
      // Berechne aktuelle Position (0 bis targetPosition)
      const currentPosition = targetPosition * easeOut
      // Verwende absolute Position für smooth scrolling
      const absoluteIndex = Math.floor(currentPosition)
      
      setCurrentIndex(absoluteIndex)
      
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    
    animationFrameRef.current = requestAnimationFrame(animate)
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="hidden sm:block sm:flex-1"></div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white sm:flex-1 sm:text-center">Sack-Öffnungs-System</h1>
            <div className="sm:flex-1 sm:flex sm:justify-end">
              <a
                href="/sacks/history"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = '/sacks/history'
                }}
                className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <History className="w-5 h-5" />
                <span>Historie</span>
              </a>
            </div>
          </div>
          <p className="text-base sm:text-xl text-gray-400 mb-6">
            Öffnen Sie Säcke und gewinnen Sie tolle Belohnungen!
          </p>
          <div className="flex items-center justify-center space-x-4">
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-6 py-3">
              <div className="flex items-center space-x-2">
                <Coins className="w-6 h-6 text-yellow-400" />
                <span className="text-yellow-400 font-semibold text-xl">{userCoins}</span>
                <span className="text-gray-400">GoofyCoins</span>
              </div>
            </div>
          </div>
        </div>

        <SackGiftsPanel
          gifts={pendingGifts}
          loading={giftsLoading}
          openingId={openingGiftId}
          onOpen={handleOpenGift}
        />

        {/* Sack Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {sackTypes.map((sack) => (
            <div
              key={sack.id}
              className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-all relative overflow-hidden group"
              style={{
                borderColor: selectedSack?.id === sack.id ? sack.color : undefined,
                boxShadow: selectedSack?.id === sack.id ? `0 0 20px ${sack.color}40` : undefined,
              }}
            >
              {/* Rarity Glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
                style={{ background: `radial-gradient(circle, ${sack.color}40 0%, transparent 70%)` }}
              />

              <div className="relative z-10">
                {/* Icon */}
                <div className="text-6xl mb-4 text-center">{sack.icon}</div>

                {/* Name */}
                <h3 className="text-xl font-bold text-white mb-2 text-center">{sack.name}</h3>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4 text-center min-h-[40px]">{sack.description}</p>

                {/* Prices */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between bg-fortnite-darker rounded-lg p-2">
                    <div className="flex items-center space-x-2">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-300 text-sm">GoofyCoins</span>
                    </div>
                    <span className="text-white font-semibold">{sack.priceCoins}</span>
                  </div>
                  <div className="flex items-center justify-between bg-fortnite-darker rounded-lg p-2">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300 text-sm">Echtgeld</span>
                    </div>
                    <span className="text-white font-semibold">€{sack.priceMoney.toFixed(2)}</span>
                  </div>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => handlePurchase(sack)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-4 py-3 rounded-lg transition-all transform hover:scale-105"
                  style={{
                    background: selectedSack?.id === sack.id
                      ? `linear-gradient(to right, ${sack.color}, ${sack.color}dd)`
                      : undefined,
                  }}
                >
                  {selectedSack?.id === sack.id ? 'Ausgewählt' : 'Kaufen & Öffnen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSack(sack)
                    setGiftMode(true)
                  }}
                  className="w-full mt-2 bg-fortnite-darker border border-pink-500/40 hover:border-pink-500/70 text-pink-300 hover:text-pink-200 font-semibold px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Verschenken
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CS:GO Case Opening Animation */}
        {isOpening && selectedSack && possibleRewards.length > 0 && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="w-full max-w-6xl">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-white mb-2">{selectedSack.name} wird geöffnet...</h2>
                <p className="text-gray-400">Karten rotieren...</p>
              </div>

              {/* Card Carousel */}
              <div className="relative h-[380px] sm:h-[500px] overflow-hidden">
                {/* Center Indicator Lines */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-transparent via-white to-transparent opacity-30 z-20 pointer-events-none" />
                
                {/* Visible Cards Container */}
                <div 
                  className="flex h-full items-center"
                  style={{
                    transform: `translateX(calc(50% - ${(currentIndex % (possibleRewards.length * 15)) * cardWidth}px - ${cardWidth / 2}px))`,
                    willChange: 'transform',
                  }}
                >
                  {/* Rendere alle Karten mehrfach für seamless loop - KEINE Filterung */}
                  {Array.from({ length: 15 }, (_, copyIndex) => 
                    possibleRewards.map((item, index) => {
                      const absoluteIndex = copyIndex * possibleRewards.length + index
                      const rarity = item.rarity
                      const rarityColors = {
                        common: '#9D9D9D',
                        uncommon: '#5E98D9',
                        rare: '#4B69FF',
                        epic: '#8847FF',
                        legendary: '#D32CE6',
                      }
                      const rarityNames = {
                        common: 'Gewöhnlich',
                        uncommon: 'Ungewöhnlich',
                        rare: 'Selten',
                        epic: 'Episch',
                        legendary: 'Legendär',
                      }
                      const color = rarityColors[rarity]
                      
                      // Berechne Distanz zur aktuellen Position (mit modulo für seamless loop)
                      const totalLength = possibleRewards.length * 15
                      const normalizedCurrent = ((currentIndex % totalLength) + totalLength) % totalLength
                      const normalizedAbsolute = ((absoluteIndex % totalLength) + totalLength) % totalLength
                      
                      // Finde minimale Distanz (berücksichtige wrap-around)
                      const dist1 = Math.abs(normalizedAbsolute - normalizedCurrent)
                      const dist2 = Math.abs(normalizedAbsolute - normalizedCurrent + totalLength)
                      const dist3 = Math.abs(normalizedAbsolute - normalizedCurrent - totalLength)
                      const distance = Math.min(dist1, dist2, dist3)
                      
                      // Bestimme welche Kopie aktiv ist
                      const isActive = distance < 0.5
                      
                      // Berechne Opacity und Scale - aber zeige IMMER die Karte
                      const opacity = isActive ? 1 : Math.max(0.3, 1 - distance * 0.06)
                      const scale = isActive ? 1 : Math.max(0.75, 1 - distance * 0.05)
                      
                      return (
                      <div
                        key={absoluteIndex}
                        className="flex-shrink-0 flex items-center justify-center h-full"
                        style={{
                          width: `${cardWidth}px`,
                          paddingLeft: '2px',
                          paddingRight: '2px',
                        }}
                      >
                        <div
                          className={`relative bg-gradient-to-br from-fortnite-dark to-fortnite-darker rounded-xl p-8 w-full max-w-sm transition-all ${
                            isActive ? 'z-10 shadow-2xl' : ''
                          }`}
                          style={{
                            borderColor: isActive ? color : 'rgba(255,255,255,0.2)',
                            borderWidth: isActive ? '3px' : '2px',
                            borderStyle: 'solid',
                            opacity: opacity,
                            boxShadow: isActive 
                              ? `0 0 40px ${color}CC, 0 0 80px ${color}80, 0 0 120px ${color}40, inset 0 0 40px ${color}20` 
                              : 'none',
                            transform: `scale(${scale}) translateY(${isActive ? 0 : 20}px)`,
                          }}
                        >
                          {/* Rarity Badge */}
                          <div
                            className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg"
                            style={{ 
                              backgroundColor: color, 
                              color: 'white',
                              boxShadow: `0 4px 12px ${color}80`,
                            }}
                          >
                            {rarityNames[rarity]}
                          </div>

                          {/* Reward Content */}
                          <div className="text-center mt-6">
                            {item.reward.type === 'product' && item.reward.product ? (
                              <>
                                <div className="relative w-48 h-48 mx-auto mb-6 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl">
                                  <Image
                                    src={item.reward.product.image}
                                    alt={item.reward.product.name}
                                    fill
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2 line-clamp-2">{item.reward.product.name}</h3>
                                <p className="text-purple-400 font-bold text-xl">€{item.reward.product.price.toFixed(2)}</p>
                              </>
                            ) : item.reward.type === 'coins' && item.reward.coins ? (
                              <>
                                <div className="w-48 h-48 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 flex items-center justify-center shadow-2xl border-4 border-yellow-300/50">
                                  <Coins className="w-24 h-24 text-white drop-shadow-lg" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">{item.reward.coins.toLocaleString()} GoofyCoins</h3>
                                <p className="text-yellow-400 font-bold text-xl">€{(item.reward.coins / 100).toFixed(2)}</p>
                              </>
                            ) : (
                              <>
                                <div className="w-48 h-48 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border-4 border-gray-600/50">
                                  <X className="w-24 h-24 text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-400 mb-2">Niete</h3>
                                <p className="text-gray-500 text-lg">Keine Belohnung</p>
                              </>
                            )}
                          </div>

                          {/* Glow Effect */}
                          {isActive && (
                            <div
                              className="absolute inset-0 rounded-xl pointer-events-none"
                              style={{
                                background: `radial-gradient(circle at center, ${color}30 0%, transparent 70%)`,
                                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })).flat()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Modal */}
        {selectedSack && !showReward && !isOpening && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
            <div className="bg-fortnite-dark border border-purple-500/30 rounded-lg p-8 max-w-md w-full relative my-8">
              <button
                onClick={() => setSelectedSack(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{selectedSack.icon}</div>
                <h2 className="text-3xl font-bold text-white mb-2">{selectedSack.name}</h2>
                <p className="text-gray-400">{selectedSack.description}</p>
              </div>

              <div className="flex gap-2 mb-6 p-1 bg-fortnite-darker rounded-lg">
                <button
                  type="button"
                  onClick={() => setGiftMode(false)}
                  className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                    !giftMode ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Für mich öffnen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGiftMode(true)
                    setPurchaseMethod('coins')
                  }}
                  className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                    giftMode ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Verschenken
                </button>
              </div>

              {giftMode && (
                <div className="mb-6 space-y-3">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">E-Mail des Empfängers</label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="kunde@example.com"
                      className="w-full px-3 py-2 bg-fortnite-darker border border-pink-500/30 rounded-lg text-white placeholder-gray-500"
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      Der Empfänger muss ein SimexMafia-Konto haben und kann den Sack selbst öffnen.
                    </p>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Nachricht (optional)</label>
                    <input
                      type="text"
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Viel Glück!"
                      maxLength={200}
                      className="w-full px-3 py-2 bg-fortnite-darker border border-pink-500/30 rounded-lg text-white placeholder-gray-500"
                    />
                  </div>
                </div>
              )}

              {/* Purchase Method Selection */}
              {!giftMode && (
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3">Zahlungsmethode wählen:</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPurchaseMethod('coins')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      purchaseMethod === 'coins'
                        ? 'border-yellow-500 bg-yellow-500/20'
                        : 'border-purple-500/30 bg-fortnite-darker'
                    }`}
                  >
                    <Coins className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <div className="text-white font-semibold">{selectedSack.priceCoins}</div>
                    <div className="text-gray-400 text-sm">GoofyCoins</div>
                    {userCoins < selectedSack.priceCoins && (
                      <div className="space-y-1 mt-1">
                        <div className="text-red-400 text-xs">Nicht genug Coins</div>
                        <a
                          href="/goofycoins/buy"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            window.location.href = '/goofycoins/buy'
                          }}
                          className="text-purple-400 hover:text-purple-300 text-xs underline block"
                        >
                          Jetzt kaufen
                        </a>
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => setPurchaseMethod('money')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      purchaseMethod === 'money'
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-purple-500/30 bg-fortnite-darker'
                    }`}
                  >
                    <ShoppingCart className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-white font-semibold">€{selectedSack.priceMoney.toFixed(2)}</div>
                    <div className="text-gray-400 text-sm">Echtgeld</div>
                  </button>
                </div>
              </div>
              )}

              {giftMode ? (
                <button
                  onClick={handleSendGift}
                  disabled={
                    sendingGift ||
                    userCoins < selectedSack.priceCoins ||
                    !recipientEmail.trim()
                  }
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  {sendingGift ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <span>Wird verschenkt...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>
                        Für {selectedSack.priceCoins} Coins verschenken
                      </span>
                    </>
                  )}
                </button>
              ) : (
              <>
              <button
                onClick={handleOpenSack}
                disabled={isPurchasing || isOpening || (purchaseMethod === 'coins' && userCoins < selectedSack.priceCoins)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                style={{
                  background: isPurchasing || isOpening
                    ? `linear-gradient(to right, ${selectedSack.color}, ${selectedSack.color}dd)`
                    : undefined,
                }}
              >
                {isPurchasing || isOpening ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span>Öffne Sack...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    <span>Sack öffnen</span>
                  </>
                )}
              </button>
              </>
              )}
            </div>
          </div>
        )}

        {/* Reward Modal */}
        {showReward && reward && selectedSack && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-fortnite-dark border border-purple-500/30 rounded-lg p-8 max-w-md w-full relative animate-[fadeIn_0.5s_ease-in-out]">
              {/* Confetti Effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 rounded-full animate-[confetti_2s_ease-out_forwards]"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: '-10%',
                      backgroundColor:
                        reward.type === 'nothing'
                          ? '#666'
                          : reward.type === 'coins'
                          ? '#FFD700'
                          : '#50C878',
                      animationDelay: `${Math.random() * 0.5}s`,
                    }}
                  />
                ))}
              </div>

              <button
                onClick={handleCloseReward}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center relative z-10">
                {reward.type === 'nothing' ? (
                  <div className="animate-[fadeInScale_0.5s_ease-out]">
                    <div className="text-6xl mb-4 animate-bounce">😢</div>
                    <h2 className="text-3xl font-bold text-white mb-4">Niete!</h2>
                    <p className="text-gray-400 text-lg">{reward.message}</p>
                  </div>
                ) : reward.type === 'coins' ? (
                  <div className="animate-[fadeInScale_0.5s_ease-out]">
                    <div className="text-6xl mb-4 animate-[coinSpin_1s_ease-in-out]">🪙</div>
                    <h2 className="text-3xl font-bold text-yellow-400 mb-4 animate-pulse">GoofyCoins gewonnen!</h2>
                    <div className="text-5xl font-bold text-yellow-400 mb-4 animate-[numberPop_0.5s_ease-out]">
                      +{reward.coins}
                    </div>
                    <p className="text-gray-400 text-lg">{reward.message}</p>
                  </div>
                ) : reward.type === 'product' && reward.product ? (
                  <div className="animate-[fadeInScale_0.5s_ease-out]">
                    <div className="text-6xl mb-4 animate-bounce">🎉</div>
                    <h2 className="text-3xl font-bold text-green-400 mb-4 animate-pulse">Produkt gewonnen!</h2>
                    <div className="relative w-32 h-32 mx-auto mb-4 rounded-lg overflow-hidden animate-[productReveal_0.8s_ease-out]">
                      {reward.product.image ? (
                        <Image
                          src={reward.product.image}
                          alt={reward.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-yellow-900/50">
                          <span className="text-4xl">🎮</span>
                        </div>
                      )}
                      {/* Glow Effect */}
                      <div className="absolute inset-0 bg-green-400/20 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{reward.product.name}</h3>
                    <p className="text-purple-400 font-semibold mb-4">Wert: €{reward.product.price.toFixed(2)}</p>
                    <p className="text-gray-400 text-lg">{reward.message}</p>
                    <button
                      onClick={() => {
                        window.location.href = `/products/${reward.product?.id}`
                      }}
                      className="mt-6 bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors animate-[buttonPop_0.6s_ease-out]"
                    >
                      Produkt ansehen
                    </button>
                  </div>
                ) : null}

                <button
                  onClick={handleCloseReward}
                  className="mt-6 bg-fortnite-darker border border-purple-500/50 hover:border-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Checkout Modal */}
        {showPaymentCheckout && selectedSack && (
          <PaymentCheckout
            items={[
              {
                id: selectedSack.id,
                type: 'sack',
                name: selectedSack.name,
                price: selectedSack.priceMoney,
                quantity: 1,
                metadata: {
                  sackType: selectedSack.type,
                  sackId: selectedSack.id,
                },
              },
            ]}
            total={selectedSack.priceMoney}
            title={`${selectedSack.name} kaufen`}
            onSuccess={(orderId) => {
              setShowPaymentCheckout(false)
              // Nach erfolgreicher Zahlung, öffne den Sack automatisch
              // Übergebe die Bestell-ID, damit Produkte nicht direkt einlösbar sind
              handleOpenSackAfterPayment(orderId)
            }}
            onCancel={() => {
              setShowPaymentCheckout(false)
            }}
          />
        )}
      </div>
    </div>
  )
}

