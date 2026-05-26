'use client'

import { useEffect, useState } from 'react'
import { Product } from '@/types'
import { X, Key, Loader2 } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

interface ProductKeysModalProps {
  product: Product
  onClose: () => void
  onSaved: (stockCount: number) => void
}

export default function ProductKeysModal({
  product,
  onClose,
  onSaved,
}: ProductKeysModalProps) {
  const { showSuccess, showError } = useToast()
  const [keysText, setKeysText] = useState('')
  const [available, setAvailable] = useState(0)
  const [used, setUsed] = useState(0)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/admin/products/${product.id}/keys`, {
          credentials: 'include',
          cache: 'no-store',
        })
        if (!res.ok) {
          throw new Error('Stats konnten nicht geladen werden')
        }
        const data = await res.json()
        setAvailable(data.available ?? 0)
        setUsed(data.used ?? 0)
        setTotal(data.total ?? 0)
      } catch (error) {
        console.error(error)
        showError('Bestand konnte nicht geladen werden')
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [product.id, showError])

  const handleSave = async () => {
    if (!keysText.trim()) {
      showError('Bitte mindestens einen Key einfügen')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/products/${product.id}/keys`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: keysText }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Speichern fehlgeschlagen')
      }

      setAvailable(data.available ?? 0)
      setUsed(data.used ?? 0)
      setTotal(data.total ?? 0)
      setKeysText('')
      onSaved(data.available ?? 0)
      showSuccess(
        `${data.added} Key(s) hinzugefügt${data.skipped ? `, ${data.skipped} übersprungen` : ''}`
      )
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Fehler beim Speichern'
      showError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-fortnite-dark border border-purple-500/30 rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Keys verwalten</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-purple-500/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-300 text-sm">{product.name}</p>

          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Lade Bestand…
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-2xl font-bold text-green-400">{available}</p>
                <p className="text-xs text-gray-400">Verfügbar</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-2xl font-bold text-blue-400">{used}</p>
                <p className="text-xs text-gray-400">Verkauft</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                <p className="text-2xl font-bold text-purple-400">{total}</p>
                <p className="text-xs text-gray-400">Gesamt</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Neue Keys einfügen (eine Zeile = ein Key)
            </label>
            <textarea
              value={keysText}
              onChange={(e) => setKeysText(e.target.value)}
              rows={8}
              placeholder="XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY"
              className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Schließen
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSaving ? 'Speichern…' : 'Keys hinzufügen'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
