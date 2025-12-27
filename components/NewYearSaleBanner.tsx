'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function NewYearSaleBanner() {
  return (
    <section className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-lg overflow-hidden shadow-2xl hover:shadow-purple-500/30 transition-shadow">
          {/* Banner Content */}
          <Link 
            href="/products?sale=newyear"
            className="block relative w-full group"
          >
            <div className="relative w-full" style={{ minHeight: '200px' }}>
              <Image
                src="/newyear-sale-banner.png"
                alt="Neujahr Sale - 27.12. 06:00"
                width={1200}
                height={675}
                className="w-full h-auto object-contain group-hover:scale-[1.01] transition-transform duration-300"
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

