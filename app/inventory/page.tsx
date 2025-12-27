'use client'

import { useState, useEffect } from 'react'
import {
  getInventory,
  getUnredeemedInventory,
  getRedeemedInventory,
  redeemItem,
  removeFromInventory,
  clearInventory,
  getInventoryStatistics,
  InventoryItem,
} from '@/data/inventory'
import { Package, CheckCircle, XCircle, Trash2, Gift, ShoppingBag, Trophy, X, Key, Copy, Check } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import Image from 'next/image'

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'unredeemed' | 'redeemed'>('all')
  const [statistics, setStatistics] = useState(getInventoryStatistics())
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [redeemedItem, setRedeemedItem] = useState<{ item: InventoryItem; code: string } | null>(null)
  const { showSuccess, showError, showInfo } = useToast()

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = () => {
    const inv = getInventory()
    setInventory(inv)
    setStatistics(getInventoryStatistics())
  }

  const handleRedeem = (item: InventoryItem) => {
    const code = redeemItem(item.id)
    if (code) {
      loadInventory()
      // Finde das aktualisierte Item
      const updatedInventory = getInventory()
      const updatedItem = updatedInventory.find(i => i.id === item.id)
      if (updatedItem) {
        setRedeemedItem({ item: updatedItem, code })
        showSuccess('Produkt erfolgreich eingelöst!', 4000)
      }
    } else {
      showError('Produkt konnte nicht eingelöst werden.')
    }
  }

  const handleRemove = (itemId: string) => {
    if (removeFromInventory(itemId)) {
      loadInventory()
      setSelectedItem(null)
      showSuccess('Produkt aus Inventar entfernt', 3000)
    } else {
      showError('Fehler beim Entfernen des Produkts')
    }
  }

  const handleClearInventory = () => {
    clearInventory()
    setInventory([])
    setStatistics(getInventoryStatistics())
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

  const getFilteredInventory = () => {
    if (activeTab === 'unredeemed') {
      return getUnredeemedInventory()
    } else if (activeTab === 'redeemed') {
      return getRedeemedInventory()
    }
    return inventory
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-bold text-white mb-4">Mein Inventar</h1>
            <p className="text-xl text-gray-400">
              Alle Ihre gewonnenen und gekauften Produkte
            </p>
          </div>
          {inventory.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-5 h-5" />
              <span>Inventar löschen</span>
            </button>
          )}
        </div>

        {/* Statistics */}
        {inventory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Package className="w-6 h-6 text-purple-400" />
                <h3 className="text-gray-400 text-sm">Gesamt</h3>
              </div>
              <div className="text-3xl font-bold text-white">{statistics.total}</div>
            </div>

            <div className="bg-fortnite-dark border border-green-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Gift className="w-6 h-6 text-green-400" />
                <h3 className="text-gray-400 text-sm">Nicht eingelöst</h3>
              </div>
              <div className="text-3xl font-bold text-green-400">{statistics.unredeemed}</div>
              <div className="text-sm text-gray-400 mt-1">
                Wert: €{statistics.unredeemedValue.toFixed(2)}
              </div>
            </div>

            <div className="bg-fortnite-dark border border-yellow-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <CheckCircle className="w-6 h-6 text-yellow-400" />
                <h3 className="text-gray-400 text-sm">Eingelöst</h3>
              </div>
              <div className="text-3xl font-bold text-yellow-400">{statistics.redeemed}</div>
              <div className="text-sm text-gray-400 mt-1">
                Wert: €{statistics.redeemedValue.toFixed(2)}
              </div>
            </div>

            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Trophy className="w-6 h-6 text-purple-400" />
                <h3 className="text-gray-400 text-sm">Gesamtwert</h3>
              </div>
              <div className="text-3xl font-bold text-white">€{statistics.totalValue.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Source Breakdown */}
        {inventory.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Herkunft</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Aus Säcken</div>
                <div className="text-2xl font-bold text-purple-400">{statistics.sourceCounts.sack}</div>
              </div>
              <div className="bg-fortnite-dark border border-blue-500/20 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Gekauft</div>
                <div className="text-2xl font-bold text-blue-400">{statistics.sourceCounts.purchase}</div>
              </div>
              <div className="bg-fortnite-dark border border-pink-500/20 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Geschenk</div>
                <div className="text-2xl font-bold text-pink-400">{statistics.sourceCounts.gift}</div>
              </div>
              <div className="bg-fortnite-dark border border-gray-500/20 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Sonstiges</div>
                <div className="text-2xl font-bold text-gray-400">{statistics.sourceCounts.other}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        {inventory.length > 0 && (
          <div className="flex space-x-4 mb-6 border-b border-purple-500/20">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-4 px-4 font-semibold transition-colors ${
                activeTab === 'all'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Alle ({statistics.total})
            </button>
            <button
              onClick={() => setActiveTab('unredeemed')}
              className={`pb-4 px-4 font-semibold transition-colors ${
                activeTab === 'unredeemed'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Nicht eingelöst ({statistics.unredeemed})
            </button>
            <button
              onClick={() => setActiveTab('redeemed')}
              className={`pb-4 px-4 font-semibold transition-colors ${
                activeTab === 'redeemed'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Eingelöst ({statistics.redeemed})
            </button>
          </div>
        )}

        {/* Inventory List */}
        {inventory.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Inventar ist leer</h2>
            <p className="text-gray-400 mb-6">
              Gewinnen Sie Produkte aus Säcken oder kaufen Sie welche im Shop!
            </p>
            <div className="flex items-center justify-center space-x-4">
              <a
                href="/sacks"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = '/sacks'
                }}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Säcke öffnen
              </a>
              <a
                href="/products"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = '/products'
                }}
                className="bg-fortnite-darker border border-purple-500/50 hover:border-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Zum Shop
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredInventory().map((item) => (
              <div
                key={item.id}
                className={`bg-fortnite-dark border rounded-lg p-6 hover:border-purple-500/50 transition-all relative ${
                  item.isRedeemed
                    ? 'border-yellow-500/30 opacity-75'
                    : 'border-purple-500/20'
                }`}
              >
                {/* Status Badge */}
                {item.isRedeemed && (
                  <div className="absolute top-4 right-4 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-3 py-1">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-xs font-semibold">Eingelöst</span>
                    </div>
                  </div>
                )}

                {/* Product Image */}
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/50 to-yellow-900/50">
                  {item.product.image ? (
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl">🎮</span>
                    </div>
                  )}
                  {item.isRedeemed && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <CheckCircle className="w-16 h-16 text-yellow-400" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{item.product.name}</h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                      {item.product.platform}
                    </span>
                    <span className="text-green-400 font-semibold">€{item.product.price.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Erhalten: {formatDate(item.obtainedAt)}
                  </div>
                  {item.sourceName && (
                    <div className="text-xs text-gray-500 mt-1">
                      Von: {item.sourceName}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {!item.isRedeemed && (
                    <>
                      <button
                        onClick={() => handleRedeem(item)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <Key className="w-4 h-4" />
                        <span>Einlösen</span>
                      </button>
                      <a
                        href={`/products/${item.product.id}`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          window.location.href = `/products/${item.product.id}`
                        }}
                        className="bg-fortnite-darker border border-purple-500/50 hover:border-purple-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        Ansehen
                      </a>
                    </>
                  )}
                  {item.isRedeemed && (
                    <>
                      {item.redemptionCode ? (
                        <button
                          onClick={() => setRedeemedItem({ item, code: item.redemptionCode! })}
                          className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          <Key className="w-4 h-4" />
                          <span>Code anzeigen</span>
                        </button>
                      ) : (
                        <div className="flex-1 text-center text-yellow-400 text-sm py-2">
                          Eingelöst: {item.redeemedAt ? formatDate(item.redeemedAt) : '-'}
                        </div>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-fortnite-dark border border-red-500/30 rounded-lg p-8 max-w-md w-full relative">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center">
                <Trash2 className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Produkt entfernen?</h2>
                <p className="text-gray-400 mb-6">
                  Möchten Sie "{selectedItem.product.name}" wirklich aus Ihrem Inventar entfernen?
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="flex-1 bg-fortnite-darker border border-purple-500/50 hover:border-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => {
                      handleRemove(selectedItem.id)
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    Entfernen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Redemption Code Modal */}
        {redeemedItem && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-fortnite-dark border border-green-500/30 rounded-lg p-8 max-w-md w-full relative">
              <button
                onClick={() => setRedeemedItem(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Produkt eingelöst!</h2>
                <p className="text-gray-400 mb-6">{redeemedItem.item.product.name}</p>

                {/* Code Display */}
                <div className="bg-fortnite-darker border border-green-500/30 rounded-lg p-6 mb-6">
                  <div className="text-sm text-gray-400 mb-2">Ihr Produktcode:</div>
                  <CodeDisplay code={redeemedItem.code} />
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ Wichtig: Speichern Sie diesen Code sicher! Er kann nicht erneut angezeigt werden.
                  </p>
                </div>

                <div className="text-sm text-gray-400 mb-6">
                  <p>So verwenden Sie den Code:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-left">
                    <li>Öffnen Sie {redeemedItem.item.product.platform}</li>
                    <li>Gehen Sie zu "Code einlösen" oder "Redeem Code"</li>
                    <li>Geben Sie den Code ein</li>
                    <li>Genießen Sie Ihr Produkt!</li>
                  </ol>
                </div>

                <button
                  onClick={() => setRedeemedItem(null)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Verstanden
                </button>
              </div>
            </div>
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
                <h2 className="text-2xl font-bold text-white mb-4">Inventar löschen?</h2>
                <p className="text-gray-400 mb-6">
                  Möchten Sie wirklich das gesamte Inventar löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 bg-fortnite-darker border border-purple-500/50 hover:border-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleClearInventory}
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

// Code Display Component mit Copy-Funktion
function CodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex-1 bg-black/30 border border-green-500/50 rounded-lg px-4 py-3">
        <code className="text-2xl font-mono font-bold text-green-400 tracking-wider">{code}</code>
      </div>
      <button
        onClick={handleCopy}
        className={`px-4 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
          copied
            ? 'bg-green-500/20 border border-green-500/50'
            : 'bg-purple-500/20 border border-purple-500/50 hover:bg-purple-500/30'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-semibold">Kopiert!</span>
          </>
        ) : (
          <>
            <Copy className="w-5 h-5 text-purple-400" />
            <span className="text-purple-400 font-semibold">Kopieren</span>
          </>
        )}
      </button>
    </div>
  )
}

