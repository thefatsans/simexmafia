'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function NewYearSaleBanner() {
  return (
    <section className="py-4 sm:py-6 -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="w-full">
        <div className="relative overflow-hidden">
          {/* Banner Content */}
          <Link 
            href="/products?sale=newyear"
            className="block relative w-full group"
          >
            <div className="relative w-full" style={{ aspectRatio: '21/9', maxHeight: '400px' }}>
              <Image
                src="/newyear-sale-banner.png"
                alt="Neujahr Sale - 27.12. 06:00"
                fill
                className="object-cover group-hover:scale-[1.01] transition-transform duration-300"
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

