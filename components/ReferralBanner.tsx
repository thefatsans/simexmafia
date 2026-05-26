'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Gift, ChevronRight, X } from 'lucide-react'

interface ReferralBannerProps {
  storageKey: string
  className?: string
}

export default function ReferralBanner({ storageKey, className = 'mb-6' }: ReferralBannerProps) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setDismissed(localStorage.getItem(storageKey) === 'true')
  }, [storageKey])

  const dismiss = () => {
    localStorage.setItem(storageKey, 'true')
    setDismissed(true)
  }

  if (dismissed) {
    return null
  }

  return (
    <div
      className={`flex items-center gap-3 p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-lg ${className}`}
    >
      <Gift className="w-5 h-5 text-pink-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium">
          Freunde einladen und GoofyCoins verdienen
        </p>
        <Link
          href="/account/referral"
          className="inline-flex items-center gap-1 text-pink-400 hover:text-pink-300 text-sm mt-0.5 transition-colors"
        >
          Zum Einladungsprogramm
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="p-1 text-gray-400 hover:text-white transition-colors shrink-0"
        aria-label="Banner schließen"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
