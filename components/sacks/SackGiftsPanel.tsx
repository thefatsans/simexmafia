'use client'

import { Gift } from 'lucide-react'
import { getSackByType } from '@/data/sacks'
import type { SackGiftItem } from '@/lib/api/sack-gifts'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function SackGiftsPanel({
  gifts,
  loading,
  openingId,
  onOpen,
}: {
  gifts: SackGiftItem[]
  loading: boolean
  openingId: string | null
  onOpen: (gift: SackGiftItem) => void
}) {
  if (loading) {
    return (
      <div className="mb-8">
        <LoadingSpinner size="md" centered label="Geschenke werden geladen..." />
      </div>
    )
  }

  if (gifts.length === 0) return null

  return (
    <div className="mb-8 bg-gradient-to-br from-pink-900/30 to-purple-900/30 border border-pink-500/30 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Gift className="w-6 h-6 text-pink-400" />
        <h2 className="text-xl font-bold text-white">Geschenk-Säcke für dich</h2>
        <span className="bg-pink-500/20 text-pink-300 text-xs font-semibold px-2 py-1 rounded-full">
          {gifts.length}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {gifts.map((gift) => {
          const sack = getSackByType(gift.sackType as Parameters<typeof getSackByType>[0])
          return (
            <div
              key={gift.id}
              className="bg-fortnite-dark border border-pink-500/20 rounded-lg p-4 flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <span className="text-4xl">{sack?.icon ?? '🎁'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-semibold">{gift.sackName}</p>
                  <p className="text-gray-400 text-sm truncate">
                    Von {gift.sender?.name || gift.sender?.email || 'Unbekannt'}
                  </p>
                  {gift.message && (
                    <p className="text-gray-500 text-xs mt-1 italic line-clamp-2">&quot;{gift.message}&quot;</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpen(gift)}
                disabled={openingId === gift.id}
                className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
              >
                {openingId === gift.id ? 'Wird geöffnet…' : 'Geschenk öffnen'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
