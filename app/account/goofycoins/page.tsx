'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Coins, Award, Gift, ArrowLeft, TrendingUp } from 'lucide-react'
import { mockCoinTransactions, mockRedemptionItems } from '@/data/user'
import { TIER_INFO, calculateTier } from '@/types/user'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

export default function GoofyCoinsPage() {
  const { user, subtractCoins, isLoading } = useAuth()
  const { showSuccess, showError } = useToast()
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history' | 'redeem'>('overview')
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Laden...</div>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Bitte melden Sie sich an</div>
      </div>
    )
  }
  
  // Stelle sicher, dass alle Werte konsistent sind und nicht undefined
  const transactions = Array.isArray(mockCoinTransactions) ? mockCoinTransactions : []
  const redemptionItems = Array.isArray(mockRedemptionItems) ? mockRedemptionItems : []
  const tierInfo = TIER_INFO[user?.tier || 'Bronze']

  const handleRedeem = (item: typeof redemptionItems[0]) => {
    const itemCost = item.cost ?? 0
    if ((user.goofyCoins ?? 0) < itemCost) {
      showError(`Sie haben nicht genügend GoofyCoins. Benötigt: ${itemCost}, Verfügbar: ${user.goofyCoins ?? 0}`)
      return
    }

    const success = subtractCoins(itemCost)
    if (success) {
      showSuccess(`${item.name} wurde erfolgreich eingelöst!`)
      // Hier könnte man auch das eingelöste Item zum Inventar hinzufügen oder einen Rabattcode generieren
      // Für jetzt zeigen wir nur eine Erfolgsmeldung
    } else {
      showError('Fehler beim Einlösen. Bitte versuchen Sie es erneut.')
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Konto
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                <Coins className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">GoofyCoins</h1>
                <p className="text-gray-400">Verdiene Coins bei jedem Kauf und löse sie für Belohnungen ein</p>
              </div>
            </div>
            <a
              href="/goofycoins/buy"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/goofycoins/buy'
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-lg transition-all transform hover:scale-105 flex items-center space-x-2"
            >
              <Coins className="w-5 h-5" />
              <span>GoofyCoins kaufen</span>
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-purple-500/20">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-6 py-3 font-semibold transition-colors ${
              selectedTab === 'overview'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Übersicht</span>
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={`px-6 py-3 font-semibold transition-colors ${
              selectedTab === 'history'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Verlauf</span>
          </button>
          <button
            onClick={() => setSelectedTab('redeem')}
            className={`px-6 py-3 font-semibold transition-colors ${
              selectedTab === 'redeem'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Einlösen</span>
          </button>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-purple-900/50 to-yellow-900/50 border border-purple-500/30 rounded-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-gray-400 mb-2">Ihr Guthaben</p>
                  <h2 className="text-5xl font-bold text-white">{(user.goofyCoins ?? 0).toLocaleString()}</h2>
                  <p className="text-gray-400 mt-2">GoofyCoins</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 mb-2">Aktuelles Tier</p>
                  <div className="flex items-center space-x-2">
                    <Award className="w-8 h-8" style={{ color: tierInfo.color }} />
                    <h3 className="text-2xl font-bold" style={{ color: tierInfo.color }}>
                      {user?.tier || 'Bronze'}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="bg-fortnite-dark/50 rounded-lg p-4">
                <p className="text-white text-sm mb-1">Verdienstrate</p>
                <p className="text-purple-400 font-semibold">
                  {tierInfo.benefits[0]} {tierInfo.discount > 0 && `• ${tierInfo.discount}% Rabatt auf alle Käufe`}
                </p>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-white mb-6">Wie GoofyCoins funktionieren</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">Coins verdienen</h4>
                  <p className="text-gray-400 text-sm">
                    Erhalte GoofyCoins bei jedem Kauf. Höhere Tiers verdienen mehr Coins pro ausgegebenem Euro!
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Award className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">Aufsteigen</h4>
                  <p className="text-gray-400 text-sm">
                    Erreiche höhere Tiers, um bessere Vorteile, Rabatte und exklusive Vorteile freizuschalten.
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Gift className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">Belohnungen einlösen</h4>
                  <p className="text-gray-400 text-sm">
                    Nutze deine GoofyCoins, um Rabatte, kostenlose Produkte und exklusive Items zu erhalten.
                  </p>
                </div>
              </div>
            </div>

            {/* Tier Progress */}
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-white mb-6">Tier-Fortschritt</h3>
              <div className="space-y-4">
                {Object.values(TIER_INFO).map((tier) => {
                  const currentTier = user?.tier || 'Bronze'
                  const currentCoins = user?.goofyCoins ?? 0
                  const isCurrentTier = tier.name === currentTier
                  const isUnlocked = currentCoins >= tier.minCoins
                  const progress = tier.minCoins > 0 ? Math.min(100, (currentCoins / tier.minCoins) * 100) : 100

                  return (
                    <div
                      key={tier.name}
                      className={`border rounded-lg p-4 ${
                        isCurrentTier
                          ? 'border-purple-500 bg-purple-500/10'
                          : isUnlocked
                          ? 'border-green-500/50 bg-green-500/5'
                          : 'border-gray-600/50 bg-fortnite-darker/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Award className="w-6 h-6" style={{ color: tier.color }} />
                          <h4 className="text-white font-semibold">{tier.name}</h4>
                          {isCurrentTier && (
                            <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                              Aktuell
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 text-sm">{tier.minCoins.toLocaleString()} Coins</span>
                      </div>
                      {!isUnlocked && (
                        <div className="w-full bg-fortnite-darker rounded-full h-2 mb-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              backgroundColor: tier.color,
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      )}
                      <div className="text-sm text-gray-400">
                        {tier.benefits.slice(0, 2).join(' • ')}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {selectedTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white mb-6">Transaktionsverlauf</h3>
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'earned'
                            ? 'bg-green-500/20'
                            : tx.type === 'spent'
                            ? 'bg-red-500/20'
                            : 'bg-purple-500/20'
                        }`}
                      >
                        <Coins
                          className={`w-5 h-5 ${
                            tx.type === 'earned'
                              ? 'text-green-400'
                              : tx.type === 'spent'
                              ? 'text-red-400'
                              : 'text-purple-400'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{tx.description}</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(tx.date).toLocaleDateString('de-DE', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}{tx.amount} Coins
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Redeem Tab */}
        {selectedTab === 'redeem' && (
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">GoofyCoins einlösen</h3>
              <p className="text-gray-400">Sie haben {(user.goofyCoins ?? 0).toLocaleString()} Coins verfügbar</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mounted && redemptionItems && redemptionItems.length > 0 ? redemptionItems
                .filter((item) => item && item.id) // Filtere ungültige Items
                .map((item) => {
                  const userCoins = user?.goofyCoins ?? 0
                  const itemCost = item.cost ?? 0
                  const canAfford = userCoins >= itemCost
                  return (
                    <div
                      key={item.id}
                      className={`bg-fortnite-dark border rounded-lg p-6 ${
                        canAfford
                          ? 'border-purple-500/20 hover:border-purple-500/50'
                          : 'border-gray-600/30 opacity-60'
                      } transition-all`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Gift className="w-6 h-6 text-purple-400" />
                          <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                            {item.type || 'discount'}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-white font-semibold text-lg mb-2">{item.name || 'Unbekannt'}</h4>
                      <p className="text-gray-400 text-sm mb-4">{item.description || ''}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Coins className="w-5 h-5 text-yellow-400" />
                          <span className="text-white font-bold">{itemCost.toLocaleString()}</span>
                        </div>
                        <button
                          onClick={() => handleRedeem(item)}
                          disabled={!canAfford}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            canAfford
                              ? 'bg-purple-500 hover:bg-purple-600 text-white'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <span>Einlösen</span>
                        </button>
                      </div>
                    </div>
                  )
                }) : mounted ? (
                  <div className="col-span-full text-center text-gray-400 py-8">
                    Keine Einlösungsmöglichkeiten verfügbar
                  </div>
                ) : (
                  <div className="col-span-full text-center text-gray-400 py-8">
                    Lade...
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


