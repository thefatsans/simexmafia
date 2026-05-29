'use client'

import Link from 'next/link'
import { Category } from '@/types'
import AnimatedSection from '@/components/AnimatedSection'

const categoryInfo: Record<Category, { name: string; icon: string; description: string }> = {
  games: {
    name: 'Videospiele',
    icon: '🎮',
    description: 'PC- und Konsolenspiel-Keys für Steam, PlayStation, Xbox und mehr',
  },
  'gift-cards': {
    name: 'Gutscheine',
    icon: '🎁',
    description: 'Sommer-Sale: min. 20% Rabatt auf alle Gutscheinkarten – bis zu 30%!',
  },
  subscriptions: {
    name: 'Abonnements',
    icon: '📱',
    description: 'Game Pass, PlayStation Plus und andere Gaming-Abonnements',
  },
  dlc: {
    name: 'DLC & Erweiterungen',
    icon: '📦',
    description: 'Downloadbare Inhalte und Erweiterungspakete für Ihre Lieblingsspiele',
  },
  'in-game-currency': {
    name: 'Spielwährung',
    icon: '💰',
    description: 'V-Bucks, FIFA Points und andere Spielwährungen',
  },
  'top-ups': {
    name: 'Aufladungen',
    icon: '📞',
    description: 'Handy-Guthaben und E-Geld-Aufladungen',
  },
}

const CATEGORIES: Category[] = [
  'games',
  'gift-cards',
  'subscriptions',
  'dlc',
  'in-game-currency',
  'top-ups',
]

export default function CategoriesPageClient({
  productCounts,
}: {
  productCounts: Record<Category, number>
}) {
  return (
    <div className="min-h-screen py-8 page-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animationType="fadeInUp" className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Nach Kategorie einkaufen</h1>
          <p className="text-gray-400 text-lg">
            Durchsuchen Sie unsere große Auswahl an digitalen Gaming-Produkten
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((category, index) => {
            const info = categoryInfo[category]
            const count = productCounts[category] || 0

            return (
              <AnimatedSection
                key={category}
                animationType="fadeInScale"
                delay={index * 100}
                className="h-full"
              >
                <Link
                  href={`/categories/${category}`}
                  className="group bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 sm:p-8 hover:border-purple-500/50 smooth-hover scale-on-hover block h-full"
                >
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">{info.icon}</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-purple-400 smooth-hover">
                    {info.name}
                  </h2>
                  <p className="text-gray-400 text-sm sm:text-base mb-3 sm:mb-4">{info.description}</p>
                  <p className="text-purple-400 font-semibold text-sm sm:text-base">
                    {count} Produkte →
                  </p>
                </Link>
              </AnimatedSection>
            )
          })}
        </div>
      </div>
    </div>
  )
}
