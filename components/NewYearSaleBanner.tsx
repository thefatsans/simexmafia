'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function NewYearSaleBanner() {
  return (
    <section 
      className="py-5 sm:py-6"
      style={{ 
        width: '100vw',
        position: 'relative',
        left: '50%',
        transform: 'translateX(-50%)',
        marginLeft: 0,
        marginRight: 0,
        maxWidth: 'none'
      }}
    >
      <div className="w-full" style={{ width: '100%' }}>
        <div className="relative overflow-hidden">
          {/* Banner Content */}
          <Link 
            href="/products?sale=newyear"
            className="block relative w-full group"
          >
            <div className="relative w-full" style={{ width: '100%', maxHeight: '550px' }}>
              <Image
                src="/newyear-sale-banner-stretched.png"
                alt="Neujahr Sale - 27.12. 06:00"
                width={2800}
                height={1200}
                className="w-full h-auto group-hover:scale-[1.01] transition-transform duration-300"
                style={{ 
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  maxHeight: '550px',
                  objectFit: 'contain'
                }}
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

