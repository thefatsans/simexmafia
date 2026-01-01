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
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

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
        // Timeout für API-Anfrage (5 Sekunden)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
        
        // Lade alle Produkte ohne Filter mit Timeout
        const allProducts = await Promise.race([
          getProductsFromAPI(),
          timeoutPromise
        ]) as Product[]
        
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

  const heroAnimation = useScrollAnimation({ threshold: 0.2 })
  const featuresAnimation = useScrollAnimation({ threshold: 0.1 })
  const categoriesAnimation = useScrollAnimation({ threshold: 0.1 })

  return (
    <div className="min-h-screen page-transition">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-winter-blue-dark/50 via-winter-blue/40 to-winter-ice-dark/30 py-20 border-b border-winter-ice/30">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzOEJERjgiIGZpbGwtb3BhY2l0eT0iMC4xNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div ref={heroAnimation.elementRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`text-center ${heroAnimation.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                Willkommen bei SimexMafia
              </span>
            </h1>
            <p className={`text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto ${heroAnimation.isVisible ? 'animate-fade-in-up animate-delay-200' : 'opacity-0'}`}>
              Ihr vertrauenswürdiger Marktplatz für reduzierte Spiele, Gutscheine und digitale Produkte.
              <br />
              <span className="text-winter-blue-light">Powered by Simex</span>
            </p>
            <div className={`flex flex-col sm:flex-row gap-4 justify-center ${heroAnimation.isVisible ? 'animate-fade-in-up animate-delay-400' : 'opacity-0'}`}>
              <Link
                href="/products"
                className="bg-gradient-to-r from-winter-blue to-winter-blue-dark hover:from-winter-blue-light hover:to-winter-blue text-white font-semibold px-8 py-4 rounded-lg smooth-hover shadow-lg shadow-winter-blue/50"
              >
                Produkte durchsuchen
              </Link>
              <Link
                href="/categories"
                className="bg-fortnite-dark border-2 border-winter-ice/50 hover:border-winter-ice text-white font-semibold px-8 py-4 rounded-lg smooth-hover"
              >
                Kategorien anzeigen
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* New Year Sale Banner Section - Full Width */}
      <NewYearSaleBanner />

      {/* Features Section */}
      <section ref={featuresAnimation.elementRef} className="py-16 bg-gradient-to-b from-winter-blue-dark/20 to-transparent border-b border-winter-ice/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`text-center smooth-hover ${featuresAnimation.isVisible ? 'animate-fade-in-up animate-delay-100' : 'opacity-0'}`}>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-winter-blue/20 rounded-full mb-4 border border-winter-ice/30 smooth-hover scale-on-hover">
                <Shield className="w-8 h-8 text-winter-ice" />
              </div>
              <h3 className="text-white font-semibold mb-2">Sicherer Checkout</h3>
              <p className="text-gray-300 text-sm">Sichere und verschlüsselte Transaktionen</p>
            </div>
            <div className={`text-center smooth-hover ${featuresAnimation.isVisible ? 'animate-fade-in-up animate-delay-200' : 'opacity-0'}`}>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-winter-blue/20 rounded-full mb-4 border border-winter-ice/30 smooth-hover scale-on-hover">
                <Zap className="w-8 h-8 text-winter-ice" />
              </div>
              <h3 className="text-white font-semibold mb-2">Sofortige Lieferung</h3>
              <p className="text-gray-300 text-sm">Erhalten Sie Ihre Keys sofort</p>
            </div>
            <div className={`text-center smooth-hover ${featuresAnimation.isVisible ? 'animate-fade-in-up animate-delay-300' : 'opacity-0'}`}>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-winter-blue/20 rounded-full mb-4 border border-winter-ice/30 smooth-hover scale-on-hover">
                <Star className="w-8 h-8 text-winter-ice" />
              </div>
              <h3 className="text-white font-semibold mb-2">Verifizierte Verkäufer</h3>
              <p className="text-gray-300 text-sm">Vertrauenswürdige Marktplatz-Partner</p>
            </div>
            <div className={`text-center smooth-hover ${featuresAnimation.isVisible ? 'animate-fade-in-up animate-delay-400' : 'opacity-0'}`}>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-winter-blue/20 rounded-full mb-4 border border-winter-ice/30 smooth-hover scale-on-hover">
                <TrendingUp className="w-8 h-8 text-winter-ice" />
              </div>
              <h3 className="text-white font-semibold mb-2">Beste Preise</h3>
              <p className="text-gray-300 text-sm">Täglich konkurrenzfähige Rabatte</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section ref={categoriesAnimation.elementRef} className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl font-bold text-white mb-8 ${categoriesAnimation.isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>Nach Kategorie einkaufen</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((category, index) => (
              <Link
                key={category.name}
                href={category.href}
                className={`bg-fortnite-dark border border-winter-ice/20 rounded-lg p-6 text-center hover:border-winter-ice/50 smooth-hover scale-on-hover ${categoriesAnimation.isVisible ? `animate-fade-in-scale animate-delay-${(index + 1) * 100}` : 'opacity-0'}`}
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
      <section className="py-16 bg-gradient-to-b from-winter-blue-dark/20 to-transparent border-b border-winter-ice/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white animate-fade-in-up">Empfohlene Angebote</h2>
            <Link
              href="/products"
              className="text-winter-ice hover:text-winter-blue-light smooth-hover"
            >
              Alle anzeigen →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProducts.map((product, index) => (
              <div key={product.id} className={`animate-fade-in-scale animate-delay-${(index % 4) * 100}`}>
                <ProductCard product={product} />
              </div>
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
                <Clock className="w-6 h-6 text-winter-ice" />
                <h2 className="text-3xl font-bold text-white">Zuletzt angesehen</h2>
              </div>
              <Link
                href="/products"
                className="text-winter-ice hover:text-winter-blue-light smooth-hover"
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


