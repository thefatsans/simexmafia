'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function NewYearSaleBanner() {
  return (
    <section className="py-4 sm:py-6 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="w-full">
        <div className="relative overflow-hidden">
          {/* Banner Content */}
          <Link 
            href="/products?sale=newyear"
            className="block relative w-full group"
          >
            <div className="relative w-full flex items-center justify-center" style={{ minHeight: '300px', maxHeight: '500px' }}>
              <Image
                src="/newyear-sale-banner.png"
                alt="Neujahr Sale - 27.12. 06:00"
                width={1920}
                height={1080}
                className="w-full h-auto object-contain group-hover:scale-[1.01] transition-transform duration-300"
                style={{ maxHeight: '500px' }}
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

