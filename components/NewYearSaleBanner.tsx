'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'

export default function NewYearSaleBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Prüfe ob Banner bereits geschlossen wurde
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('simexmafia-newyear-banner-dismissed')
      if (dismissed) {
        setIsDismissed(true)
        return
      }
      // Zeige Banner nach kurzer Verzögerung
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setIsDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('simexmafia-newyear-banner-dismissed', 'true')
    }
  }

  if (isDismissed || !isVisible) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] pointer-events-none">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pointer-events-auto">
        <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-purple-500/30 rounded-lg overflow-hidden shadow-2xl">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-black/50 hover:bg-black/70 rounded-full p-1.5 sm:p-2 transition-colors"
            aria-label="Banner schließen"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>

          {/* Banner Content */}
          <Link 
            href="/products?sale=newyear"
            className="block relative w-full"
          >
            <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] lg:aspect-[28/9]">
              <Image
                src="/newyear-sale-banner.png"
                alt="Neujahr Sale - 27.12. 06:00"
                fill
                className="object-contain sm:object-cover"
                priority
                sizes="100vw"
                onError={() => {
                  // Fallback wenn Bild nicht existiert
                  console.warn('New Year Sale Banner image not found')
                }}
              />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

