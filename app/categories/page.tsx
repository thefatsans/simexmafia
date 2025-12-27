'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Category } from '@/types'
import { getProductsFromAPI } from '@/lib/api/products'

const categoryInfo: Record<Category, { name: string; icon: string; description: string }> = {
  'games': {
    name: 'Videospiele',
    icon: '🎮',
    description: 'PC- und Konsolenspiel-Keys für Steam, PlayStation, Xbox und mehr',
  },
  'gift-cards': {
    name: 'Gutscheine',
    icon: '🎁',
    description: 'Digitale Gutscheine für PlayStation, Xbox, Steam und andere Plattformen',
  },
  'subscriptions': {
    name: 'Abonnements',
    icon: '📱',
    description: 'Game Pass, PlayStation Plus und andere Gaming-Abonnements',
  },
  'dlc': {
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

export default function CategoriesPage() {
  const categories: Category[] = ['games', 'gift-cards', 'subscriptions', 'dlc', 'in-game-currency', 'top-ups']
  const [productCounts, setProductCounts] = useState<Record<Category, number>>({} as Record<Category, number>)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCounts = async () => {
      try {
        // Lade alle Produkte auf einmal (effizienter als pro Kategorie)
        const allProducts = await getProductsFromAPI()
        
        const counts: Record<Category, number> = {} as Record<Category, number>
        
        // Initialisiere alle Kategorien mit 0
        categories.forEach(category => {
          counts[category] = 0
        })
        
        // Zähle Produkte pro Kategorie
        allProducts.forEach(product => {
          const category = product.category as Category
          if (category in counts) {
            counts[category]++
          }
        })
        
        console.log('Category counts:', counts)
        console.log('Total products:', allProducts.length)
        
        setProductCounts(counts)
      } catch (error) {
        console.error('Error loading product counts:', error)
        // Fallback: Setze 0 für alle Kategorien
        const counts: Record<Category, number> = {} as Record<Category, number>
        categories.forEach(category => {
          counts[category] = 0
        })
        setProductCounts(counts)
      } finally {
        setIsLoading(false)
      }
    }
    loadCounts()
  }, [])

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Nach Kategorie einkaufen</h1>
          <p className="text-gray-400 text-lg">
            Durchsuchen Sie unsere große Auswahl an digitalen Gaming-Produkten
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const info = categoryInfo[category]
            const count = isLoading ? 0 : (productCounts[category] || 0)
            
            return (
              <Link
                key={category}
                href={`/categories/${category}`}
                className="group bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 hover:border-purple-500/50 transition-all hover:transform hover:scale-105"
              >
                <div className="text-6xl mb-4">{info.icon}</div>
                <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                  {info.name}
                </h2>
                <p className="text-gray-400 mb-4">{info.description}</p>
                <p className="text-purple-400 font-semibold">
                  {isLoading ? '...' : `${count} Produkte`} →
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}


