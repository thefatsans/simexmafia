'use client'

import { useState, useEffect } from 'react'
import { getSackHistory, clearSackHistory, getSackStatistics, SackHistoryEntry } from '@/data/sackHistory'
import { Trash2, Trophy, TrendingUp, Coins, Package, XCircle, Calendar, DollarSign, X } from 'lucide-react'
import Image from 'next/image'

export default function SackHistoryPage() {
  const [history, setHistory] = useState<SackHistoryEntry[]>([])
  const [statistics, setStatistics] = useState(getSackStatistics())
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = () => {
    const hist = getSackHistory()
    setHistory(hist)
    setStatistics(getSackStatistics())
  }

  const handleClearHistory = () => {
    clearSackHistory()
    setHistory([])
    setStatistics(getSackStatistics())
    setShowClearConfirm(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-bold text-white mb-4">Sack-Historie</h1>
            <p className="text-xl text-gray-400">
              Übersicht aller geöffneten Säcke und Belohnungen
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-5 h-5" />
              <span>Historie löschen</span>
            </button>
          )}
        </div>

        {/* Statistics */}
        {history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Package className="w-6 h-6 text-purple-400" />
                <h3 className="text-gray-400 text-sm">Gesamt geöffnet</h3>
              </div>
              <div className="text-3xl font-bold text-white">{statistics.totalOpened}</div>
            </div>

            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <DollarSign className="w-6 h-6 text-yellow-400" />
                <h3 className="text-gray-400 text-sm">Gesamt ausgegeben</h3>
              </div>
              <div className="text-3xl font-bold text-white">
                {statistics.totalCoinsSpent > 0 && (
                  <span className="text-yellow-400">{statistics.totalCoinsSpent} Coins</span>
                )}
                {statistics.totalCoinsSpent > 0 && statistics.totalMoneySpent > 0 && (
                  <span className="text-gray-500 mx-2">+</span>
                )}
                {statistics.totalMoneySpent > 0 && (
                  <span className="text-purple-400">€{statistics.totalMoneySpent.toFixed(2)}</span>
                )}
              </div>
            </div>

            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <h3 className="text-gray-400 text-sm">Erfolgsrate</h3>
              </div>
              <div className="text-3xl font-bold text-white">
                {statistics.totalOpened > 0
                  ? Math.round(
                      ((statistics.rewards.coins + statistics.rewards.products) /
                        statistics.totalOpened) *
                        100
                    )
                  : 0}
                <span className="text-lg text-gray-400">%</span>
              </div>
            </div>

            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <h3 className="text-gray-400 text-sm">Beste Belohnung</h3>
              </div>
              <div className="text-sm text-white">
                {statistics.bestReward ? (
                  (statistics.bestReward as any).reward?.type === 'product' ? (
                    <span className="text-green-400">Produkt: €{((statistics.bestReward as any).reward?.product?.price || 0).toFixed(2)}</span>
                  ) : (statistics.bestReward as any).reward?.type === 'coins' ? (
                    <span className="text-yellow-400">{(statistics.bestReward as any).reward?.coins || 0} Coins</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reward Breakdown */}
        {history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-gray-400" />
                  <span className="text-white font-semibold">Nieten</span>
                </div>
                <span className="text-2xl font-bold text-gray-400">{statistics.rewards.nothing}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gray-400 h-2 rounded-full"
                  style={{
                    width: `${(statistics.rewards.nothing / statistics.totalOpened) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-semibold">GoofyCoins</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-yellow-400">{statistics.rewards.coins}</span>
                  <div className="text-sm text-gray-400">+{statistics.totalCoinsWon} gewonnen</div>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{
                    width: `${(statistics.rewards.coins / statistics.totalOpened) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-green-400" />
                  <span className="text-white font-semibold">Produkte</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-green-400">{statistics.rewards.products}</span>
                  <div className="text-sm text-gray-400">€{statistics.totalProductValue.toFixed(2)} Wert</div>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-400 h-2 rounded-full"
                  style={{
                    width: `${(statistics.rewards.products / statistics.totalOpened) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* History List */}
        {history.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Noch keine Säcke geöffnet</h2>
            <p className="text-gray-400 mb-6">
              Gehen Sie zur Sack-Seite und öffnen Sie Ihren ersten Sack!
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
              Zu den Säcken
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Geöffnete Säcke</h2>
            {history.map((entry) => (
              <div
                key={entry.id}
                className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-all"
                style={{
                  borderLeftColor: entry.sackColor,
                  borderLeftWidth: '4px',
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Sack Icon */}
                    <div
                      className="text-5xl flex-shrink-0"
                      style={{
                        filter: `drop-shadow(0 0 10px ${entry.sackColor}40)`,
                      }}
                    >
                      {entry.sackIcon}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{entry.sackName}</h3>
                        <span
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: `${entry.sackColor}20`,
                            color: entry.sackColor,
                          }}
                        >
                          {entry.purchaseMethod === 'coins' ? 'GoofyCoins' : 'Echtgeld'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(entry.openedAt)}</span>
                        </div>
                        <span>•</span>
                        <span>
                          {entry.purchaseMethod === 'coins'
                            ? `${entry.pricePaid} GoofyCoins`
                            : `€${entry.pricePaid.toFixed(2)}`}
                        </span>
                      </div>

                      {/* Reward */}
                      <div className="flex items-center space-x-3">
                        {entry.reward.type === 'nothing' ? (
                          <div className="flex items-center space-x-2 text-gray-400">
                            <XCircle className="w-5 h-5" />
                            <span>Niete</span>
                          </div>
                        ) : entry.reward.type === 'coins' ? (
                          <div className="flex items-center space-x-2 text-yellow-400">
                            <Coins className="w-5 h-5" />
                            <span className="font-semibold">+{entry.reward.coins} GoofyCoins</span>
                          </div>
                        ) : entry.reward.type === 'product' && entry.reward.product ? (
                          <div className="flex items-center space-x-3">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                              {entry.reward.product.image ? (
                                <Image
                                  src={entry.reward.product.image}
                                  alt={entry.reward.product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-yellow-900/50">
                                  <span className="text-2xl">🎮</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-white font-semibold">{entry.reward.product.name}</div>
                              <div className="text-green-400 text-sm">
                                Wert: €{entry.reward.product.price.toFixed(2)}
                              </div>
                            </div>
                            <a
                              href={`/products/${entry.reward.product.id}`}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                window.location.href = `/products/${entry.reward.product?.id}`
                              }}
                              className="ml-auto bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400 px-4 py-2 rounded-lg transition-colors text-sm"
                            >
                              Ansehen
                            </a>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-fortnite-dark border border-red-500/30 rounded-lg p-8 max-w-md w-full relative">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center">
                <Trash2 className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Historie löschen?</h2>
                <p className="text-gray-400 mb-6">
                  Möchten Sie wirklich die gesamte Sack-Historie löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 bg-fortnite-darker border border-purple-500/50 hover:border-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleClearHistory}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}




