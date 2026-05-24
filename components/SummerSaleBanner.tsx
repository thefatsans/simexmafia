'use client'

import Link from 'next/link'
import { Sun, Gift } from 'lucide-react'

export default function SummerSaleBanner() {
  return (
    <section className="relative w-full overflow-hidden border-y border-summer-ocean/30">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-summer-ocean/30 to-pink-500/20" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSIyIiBmaWxsPSIjRkJCQjI0IiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')] opacity-40" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/20 border border-amber-300/40">
              <Sun className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <p className="text-amber-300 font-semibold text-sm uppercase tracking-wider mb-1">
                Sommer-Sale ☀️
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Bis zu <span className="text-amber-300">30%</span> auf alle Gutscheinkarten
              </h2>
              <p className="text-gray-200 max-w-xl">
                Steam, PlayStation, Xbox, Nintendo & mehr – jeder Gutschein mindestens{' '}
                <strong className="text-white">20% Rabatt</strong>, ausgewählte Karten sogar{' '}
                <strong className="text-amber-300">30%</strong>.
              </p>
            </div>
          </div>

          <Link
            href="/products?category=gift-cards&sale=summer"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-fortnite-darker font-bold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/30 transition-all hover:scale-105 shrink-0"
          >
            <Gift className="w-5 h-5" />
            Gutscheine entdecken
          </Link>
        </div>
      </div>
    </section>
  )
}
