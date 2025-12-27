'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function NewYearSaleBanner() {
  return (
    <section className="py-4 sm:py-6">
      <div className="w-full px-2 sm:px-4 lg:px-8">
        <div className="relative rounded-lg overflow-hidden shadow-2xl hover:shadow-purple-500/30 transition-shadow">
          {/* Banner Content */}
          <Link 
            href="/products?sale=newyear"
            className="block relative w-full group"
          >
            <div className="relative w-full flex items-center justify-center bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-800/10">
              <Image
                src="/newyear-sale-banner.png"
                alt="Neujahr Sale - 27.12. 06:00"
                width={1200}
                height={675}
                className="w-full h-auto max-h-[400px] sm:max-h-[500px] md:max-h-[600px] object-contain group-hover:scale-[1.01] transition-transform duration-300"
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
    </section>
  )
}

