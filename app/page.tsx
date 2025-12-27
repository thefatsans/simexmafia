'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import ProductRecommendations from '@/components/ProductRecommendations'
import { getProductsFromAPI } from '@/lib/api/products'
import { getHomePageRecommendations, getPersonalizedRecommendations } from '@/data/recommendations'
import { TrendingUp, Shield, Zap, Star, Clock } from 'lucide-react'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { useAuth } from '@/contexts/AuthContext'
import { Product } from '@/types'
import NewsletterForm from '@/components/NewsletterForm'
import NewsletterModal from '@/components/NewsletterModal'
import { useToast } from '@/contexts/ToastContext'
import NewYearSaleBanner from '@/components/NewYearSaleBanner'

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [personalizedProducts, setPersonalizedProducts] = useState<Product[]>([])
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const { user } = useAuth()

  useEffect(() => {
    const loadRecommendations = async () => {
      // Lade allgemeine Empfehlungen
      const recommendations = await getHomePageRecommendations(8)
      setFeaturedProducts(recommendations)
      
      // Lade personalisierte Empfehlungen, wenn Benutzer eingeloggt ist
      if (user?.id) {
        const personalized = await getPersonalizedRecommendations(user.id, 6)
        setPersonalizedProducts(personalized)
      }
    }
    loadRecommendations()
  }, [user])

  useEffect(() => {
    // Lade echte Produktanzahlen pro Kategorie
    const loadCategoryCounts = async () => {
      try {
        // Lade alle Produkte ohne Filter
        const allProducts = await getProductsFromAPI()
        
        const counts: Record<string, number> = {
          'games': 0,
          'gift-cards': 0,
          'subscriptions': 0,
          'dlc': 0,
          'in-game-currency': 0,
        }
        
        // Zähle Produkte pro Kategorie
        allProducts.forEach(product => {
          const category = product.category
          if (category in counts) {
            counts[category]++
          }
        })
        
        console.log('Category counts:', counts)
        console.log('Total products:', allProducts.length)
        
        setCategoryCounts(counts)
      } catch (error) {
        console.error('Error loading category counts:', error)
        // Fallback: Setze 0 für alle Kategorien
        setCategoryCounts({
          'games': 0,
          'gift-cards': 0,
          'subscriptions': 0,
          'dlc': 0,
          'in-game-currency': 0,
        })
      }
    }
    loadCategoryCounts()
  }, [])
  
  const { recentlyViewed } = useRecentlyViewed()
  const [displayedRecent, setDisplayedRecent] = useState<Product[]>([])
  const [showNewsletterModal, setShowNewsletterModal] = useState(false)
  const { showSuccess, showError, showInfo, showWarning } = useToast()

  useEffect(() => {
    // Filter out products that are already in featured
    const featuredIds = new Set(featuredProducts.map(p => p.id))
    const filtered = recentlyViewed.filter(p => !featuredIds.has(p.id)).slice(0, 8)
    setDisplayedRecent(filtered)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentlyViewed])

  useEffect(() => {
    // Show newsletter modal on first visit (after 3 seconds)
    const hasSeenModal = localStorage.getItem('newsletter-modal-seen')
    if (!hasSeenModal) {
      const timer = setTimeout(() => {
        setShowNewsletterModal(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  const categories = [
    { name: 'Spiele', category: 'games', icon: '🎮', href: '/categories/games' },
    { name: 'Gutscheine', category: 'gift-cards', icon: '🎁', href: '/categories/gift-cards' },
    { name: 'Abonnements', category: 'subscriptions', icon: '📱', href: '/categories/subscriptions' },
    { name: 'DLC', category: 'dlc', icon: '📦', href: '/categories/dlc' },
    { name: 'Spielwährung', category: 'in-game-currency', icon: '💰', href: '/categories/in-game-currency' },
  ]

  return (
    <div className="min-h-screen">
      {/* New Year Sale Banner */}
      <NewYearSaleBanner />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900/30 via-fortnite-dark to-fortnite-darker py-20 pt-32 sm:pt-40">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM4QjVDRkYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                Willkommen bei SimexMafia
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Ihr vertrauenswürdiger Marktplatz für reduzierte Spiele, Gutscheine und digitale Produkte.
              <br />
              <span className="text-purple-400">Powered by Simex</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50"
              >
                Produkte durchsuchen
              </Link>
              <Link
                href="/categories"
                className="bg-fortnite-dark border-2 border-purple-500/50 hover:border-purple-500 text-white font-semibold px-8 py-4 rounded-lg transition-all"
              >
                Kategorien anzeigen
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-fortnite-dark/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Sicherer Checkout</h3>
              <p className="text-gray-400 text-sm">Sichere und verschlüsselte Transaktionen</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
                <Zap className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Sofortige Lieferung</h3>
              <p className="text-gray-400 text-sm">Erhalten Sie Ihre Keys sofort</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
                <Star className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Verifizierte Verkäufer</h3>
              <p className="text-gray-400 text-sm">Vertrauenswürdige Marktplatz-Partner</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Beste Preise</h3>
              <p className="text-gray-400 text-sm">Täglich konkurrenzfähige Rabatte</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-8">Nach Kategorie einkaufen</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 text-center hover:border-purple-500/50 transition-all hover:transform hover:scale-105"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="text-white font-semibold mb-1">{category.name}</h3>
                <p className="text-gray-400 text-sm">
                  {categoryCounts[category.category] || 0} Produkte
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Personalized Recommendations */}
      {personalizedProducts.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProductRecommendations
              title="Für Sie empfohlen"
              products={personalizedProducts}
            />
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16 bg-fortnite-dark/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Empfohlene Angebote</h2>
            <Link
              href="/products"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Alle anzeigen →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Recently Viewed Products */}
      {displayedRecent.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-purple-400" />
                <h2 className="text-3xl font-bold text-white">Zuletzt angesehen</h2>
              </div>
              <Link
                href="/products"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Alle anzeigen →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedRecent.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-br from-purple-900/30 to-yellow-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <NewsletterForm />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Bereit zum Einkaufen?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Schließen Sie sich Tausenden von Gamern an, die SimexMafia für ihre digitalen Gaming-Bedürfnisse vertrauen.
          </p>
          <Link
            href="/products"
            className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50"
          >
            Produkte erkunden
          </Link>
        </div>
      </section>

      {/* Newsletter Modal */}
      <NewsletterModal
        isOpen={showNewsletterModal}
        onClose={() => {
          setShowNewsletterModal(false)
          localStorage.setItem('newsletter-modal-seen', 'true')
        }}
      />
    </div>
  )
}


