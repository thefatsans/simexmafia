'use client'

import { useRouter } from 'next/navigation'
import { ShoppingCart, Search, User, Menu, Coins, Heart, LogIn, LogOut, Settings, GitCompare, Sun, Moon } from 'lucide-react'
import { isAdmin } from '@/data/admin'
import { useState, FormEvent, useEffect } from 'react'
import Logo from './Logo'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCompare } from '@/contexts/CompareContext'
import { useTheme } from '@/contexts/ThemeContext'
import SearchAutocomplete from './SearchAutocomplete'

export default function Navbar() {
  const router = useRouter()
  const { getTotalItems } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const { wishlist } = useWishlist()
  const { compareItems } = useCompare()
  const { theme, toggleTheme } = useTheme()
  const cartCount = getTotalItems()
  const wishlistCount = wishlist.length
  const compareCount = compareItems.length
  const [mounted, setMounted] = useState(false)
  const [clientIsAuthenticated, setClientIsAuthenticated] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    setClientIsAuthenticated(isAuthenticated)
  }, [isAuthenticated])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAutocomplete, setShowAutocomplete] = useState(false)

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setShowAutocomplete(false)
    }
  }

  const handleSearchSubmit = (query: string) => {
    if (query.trim()) {
      setShowAutocomplete(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setSearchQuery('')
    }
  }

  // Autocomplete closes via onBlur on the input field - no global event listeners needed

  return (
    <nav className="bg-fortnite-darker dark:bg-fortnite-darker bg-white dark:border-purple-500/20 border-gray-200 border-b sticky top-0 z-[9999] backdrop-blur-sm pointer-events-auto transition-colors" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 pointer-events-auto">
        <div className="flex items-center gap-2 sm:gap-3 py-2 sm:py-3 md:py-4 pointer-events-auto">
          {/* Logo */}
          <a 
            href="/" 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.location.href = '/'
            }}
            className="group flex items-center flex-shrink-0 pointer-events-auto relative z-[10001] cursor-pointer"
          >
            <div className="hidden sm:block">
              <Logo width={150} height={150} showText={true} />
            </div>
            <div className="flex items-center sm:hidden">
              <Logo width={32} height={32} showText={false} />
              <span className="ml-1.5 text-sm font-bold text-gray-800 dark:text-white">SimexMafia</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center space-x-5 flex-1 pointer-events-auto relative z-[10001]">
            <a 
              href="/" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/'
              }}
              className="text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors whitespace-nowrap text-sm pointer-events-auto relative z-[10002] cursor-pointer"
            >
              Startseite
            </a>
            <a 
              href="/products" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/products'
              }}
              className="text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors whitespace-nowrap text-sm pointer-events-auto relative z-[10002] cursor-pointer"
            >
              Produkte
            </a>
            <a 
              href="/categories" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/categories'
              }}
              className="text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors whitespace-nowrap text-sm pointer-events-auto relative z-[10002] cursor-pointer"
            >
              Kategorien
            </a>
            <a 
              href="/sellers" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/sellers'
              }}
              className="text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors whitespace-nowrap text-sm pointer-events-auto relative z-[10002] cursor-pointer"
            >
              Verkäufer
            </a>
            <a 
              href="/sacks" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/sacks'
              }}
              className="text-gray-300 hover:text-purple-400 transition-colors whitespace-nowrap text-sm pointer-events-auto relative z-[10002] cursor-pointer font-semibold"
            >
              🎁 Säcke
            </a>
            <a 
              href="/inventory" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/inventory'
              }}
              className="text-gray-300 hover:text-green-400 transition-colors whitespace-nowrap text-sm pointer-events-auto relative z-[10002] cursor-pointer"
            >
              📦 Inventar
            </a>
            <a 
              href="/daily-rewards" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/daily-rewards'
              }}
              className="text-gray-300 hover:text-yellow-400 transition-colors whitespace-nowrap text-sm pointer-events-auto relative z-[10002] cursor-pointer font-semibold"
            >
              🎁 Tägliche Belohnung
            </a>
            <a 
              href="/leaderboard" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/leaderboard'
              }}
              className="text-gray-300 hover:text-yellow-400 transition-colors whitespace-nowrap text-sm pointer-events-auto relative z-[10002] cursor-pointer"
            >
              🏆 Leaderboard
            </a>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-2 lg:space-x-3 flex-shrink-0 relative z-[10000] pointer-events-auto ml-auto">
            {!mounted ? null : isAuthenticated && user ? (
              <a 
                href="/account/goofycoins" 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = '/account/goofycoins'
                }}
                className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg transition-colors group pointer-events-auto relative z-[10003] cursor-pointer"
                title="GoofyCoins verwalten"
              >
                <Coins className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                <span className="text-yellow-400 font-semibold">{user?.goofyCoins ?? 0}</span>
              </a>
            ) : null}
            <a 
              href="/wishlist" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/wishlist'
              }}
              className="relative p-2 sm:p-2.5 text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors pointer-events-auto z-[10003] cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Wunschliste"
            >
              <Heart className="w-6 h-6 sm:w-6 sm:h-6" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-5 h-5 sm:w-5 sm:h-5 flex items-center justify-center">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </a>
            <a 
              href="/compare" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/compare'
              }}
              className="relative p-2 sm:p-2.5 text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors pointer-events-auto z-[10003] cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Produktvergleich"
            >
              <GitCompare className="w-6 h-6 sm:w-6 sm:h-6" />
              {compareCount > 0 && (
                <span className="absolute top-1 right-1 bg-purple-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-5 h-5 sm:w-5 sm:h-5 flex items-center justify-center">
                  {compareCount > 9 ? '9+' : compareCount}
                </span>
              )}
            </a>
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 text-gray-300 hover:text-purple-400 transition-colors pointer-events-auto z-[10003] cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              title={mounted ? (theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren') : 'Theme wechseln'}
              suppressHydrationWarning
            >
              {!mounted ? (
                <Moon className="w-6 h-6 sm:w-6 sm:h-6" />
              ) : theme === 'dark' ? (
                <Sun className="w-6 h-6 sm:w-6 sm:h-6" />
              ) : (
                <Moon className="w-6 h-6 sm:w-6 sm:h-6" />
              )}
            </button>
            <a 
              href="/cart" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = '/cart'
              }}
              className="relative p-2 sm:p-2.5 text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors pointer-events-auto z-[10003] cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Warenkorb"
            >
              <ShoppingCart className="w-6 h-6 sm:w-6 sm:h-6" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-purple-500 text-white text-[10px] sm:text-xs rounded-full w-5 h-5 sm:w-5 sm:h-5 flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </a>
            {!mounted || !clientIsAuthenticated ? (
              <a
                href="/auth/login"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = '/auth/login'
                }}
                className="hidden lg:flex items-center space-x-2 p-2 text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors pointer-events-auto relative z-[10003] cursor-pointer"
              >
                <LogIn className="w-6 h-6" />
                <span>Anmelden</span>
              </a>
            ) : (
              <>
                {user && isAdmin(user.email) && (
                  <a
                    href="/admin"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      window.location.href = '/admin'
                    }}
                    className="hidden lg:flex items-center space-x-2 p-2 text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors pointer-events-auto relative z-[10003] cursor-pointer"
                    title="Admin Panel"
                  >
                    <Settings className="w-6 h-6" />
                    <span>Admin</span>
                  </a>
                )}
                <a
                  href="/account"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = '/account'
                  }}
                  className="hidden lg:flex items-center space-x-2 p-2 text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors pointer-events-auto relative z-[10003] cursor-pointer"
                >
                  <User className="w-6 h-6" />
                  <span>{user?.firstName || 'Konto'}</span>
                </a>
                <button
                  onClick={() => {
                    logout()
                    window.location.href = '/'
                  }}
                  className="hidden lg:flex items-center space-x-2 p-2 text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-red-400 hover:text-red-600 transition-colors pointer-events-auto relative z-[10003] cursor-pointer"
                  suppressHydrationWarning
                >
                  <LogOut className="w-6 h-6" />
                  <span>Abmelden</span>
                </button>
              </>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 sm:p-2.5 text-gray-300 hover:text-purple-400 transition-colors pointer-events-auto relative z-[10003] min-w-[44px] min-h-[44px] flex items-center justify-center"
              suppressHydrationWarning
              aria-label="Menü öffnen"
            >
              <Menu className="w-6 h-6 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Search Bar - Positioned on the right */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-shrink-0 ml-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowAutocomplete(true)
                }}
                onFocus={() => setShowAutocomplete(true)}
                onBlur={(e) => {
                  // Don't close if clicking inside autocomplete
                  if (!e.relatedTarget || !(e.relatedTarget as HTMLElement).closest('[data-autocomplete]')) {
                    setTimeout(() => setShowAutocomplete(false), 150)
                  }
                }}
                placeholder="Suchen..."
                className="w-64 pl-11 pr-4 py-2.5 text-sm bg-fortnite-dark dark:bg-fortnite-dark bg-gray-100 dark:border-purple-500/30 border-gray-300 rounded-lg text-white dark:text-white text-gray-900 dark:placeholder-gray-400 placeholder-gray-500 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 transition-colors"
              />
              {showAutocomplete && (
                <SearchAutocomplete
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSubmit={handleSearchSubmit}
                  onClose={() => setShowAutocomplete(false)}
                  isFocused={showAutocomplete}
                />
              )}
            </div>
          </form>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-purple-500/20 pointer-events-auto relative z-[10001]">
            <div className="flex flex-col space-y-4 pointer-events-auto">
              <a 
                href="/" 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsMenuOpen(false)
                  window.location.href = '/'
                }}
                className="text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors pointer-events-auto relative z-[10004] cursor-pointer"
              >
                Startseite
              </a>
              <a 
                href="/products" 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsMenuOpen(false)
                  window.location.href = '/products'
                }}
                className="text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors pointer-events-auto relative z-[10004] cursor-pointer"
              >
                Produkte
              </a>
              <a 
                href="/categories" 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsMenuOpen(false)
                  window.location.href = '/categories'
                }}
                className="text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors pointer-events-auto relative z-[10004] cursor-pointer"
              >
                Kategorien
              </a>
              <a 
                href="/sellers" 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsMenuOpen(false)
                  window.location.href = '/sellers'
                }}
                className="text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors pointer-events-auto relative z-[10004] cursor-pointer"
              >
                Verkäufer
              </a>
              <a 
                href="/sacks" 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsMenuOpen(false)
                  window.location.href = '/sacks'
                }}
                className="text-gray-300 hover:text-purple-400 transition-colors pointer-events-auto relative z-[10004] cursor-pointer font-semibold"
              >
                🎁 Säcke
              </a>
              <a 
                href="/inventory" 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsMenuOpen(false)
                  window.location.href = '/inventory'
                }}
                className="text-gray-300 hover:text-green-400 transition-colors pointer-events-auto relative z-[10004] cursor-pointer"
              >
                📦 Inventar
              </a>
              <a 
                href="/daily-rewards" 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsMenuOpen(false)
                  window.location.href = '/daily-rewards'
                }}
                className="text-gray-300 hover:text-yellow-400 transition-colors pointer-events-auto relative z-[10004] cursor-pointer font-semibold"
              >
                🎁 Tägliche Belohnung
              </a>
              <a 
                href="/leaderboard" 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsMenuOpen(false)
                  window.location.href = '/leaderboard'
                }}
                className="text-gray-300 hover:text-yellow-400 transition-colors pointer-events-auto relative z-[10004] cursor-pointer"
              >
                🏆 Leaderboard
              </a>
              <a 
                href="/wishlist" 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsMenuOpen(false)
                  window.location.href = '/wishlist'
                }}
                className="text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors pointer-events-auto relative z-[10004] cursor-pointer"
              >
                Wunschliste
              </a>
              <a 
                href="/compare" 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsMenuOpen(false)
                  window.location.href = '/compare'
                }}
                className="text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors pointer-events-auto relative z-[10004] cursor-pointer"
              >
                Produktvergleich {compareCount > 0 && `(${compareCount})`}
              </a>
              <button
                onClick={() => {
                  toggleTheme()
                  setIsMenuOpen(false)
                }}
                className="text-gray-300 hover:text-purple-400 transition-colors pointer-events-auto relative z-[10004] cursor-pointer text-left flex items-center space-x-2"
                suppressHydrationWarning
              >
                {mounted ? (
                  theme === 'dark' ? (
                    <>
                      <Sun className="w-5 h-5" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-5 h-5" />
                      <span>Dark Mode</span>
                    </>
                  )
                ) : (
                  <>
                    <Moon className="w-5 h-5" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
              {!mounted || !clientIsAuthenticated ? (
                <a 
                  href="/auth/login" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsMenuOpen(false)
                    window.location.href = '/auth/login'
                  }}
                  className="text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors pointer-events-auto relative z-[10004] cursor-pointer"
                >
                  🔐 Anmelden
                </a>
              ) : (
                <>
                  {user && isAdmin(user.email) && (
                    <a 
                      href="/admin" 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsMenuOpen(false)
                        window.location.href = '/admin'
                      }}
                      className="text-gray-300 hover:text-purple-400 transition-colors pointer-events-auto relative z-[10004] cursor-pointer font-semibold"
                    >
                      ⚙️ Admin Panel
                    </a>
                  )}
                  <a 
                    href="/account" 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsMenuOpen(false)
                      window.location.href = '/account'
                    }}
                    className="text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-purple-400 hover:text-purple-600 transition-colors pointer-events-auto relative z-[10004] cursor-pointer"
                  >
                    👤 {user?.firstName || 'Konto'}
                  </a>
                  <button
                    onClick={() => {
                      logout()
                      setIsMenuOpen(false)
                      window.location.href = '/'
                    }}
                    className="text-gray-300 hover:text-red-400 transition-colors pointer-events-auto relative z-[10004] cursor-pointer text-left"
                    suppressHydrationWarning
                  >
                    <span>🚪 Abmelden</span>
                  </button>
                </>
              )}
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 z-10" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowAutocomplete(true)
                    }}
                    onFocus={() => setShowAutocomplete(true)}
                    placeholder="Spiele, Gutscheine suchen..."
                    className="w-full pl-12 pr-4 py-3 text-base bg-fortnite-dark border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                  {showAutocomplete && (
                    <div className="absolute top-full left-0 right-0 mt-2">
                      <SearchAutocomplete
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onSubmit={handleSearchSubmit}
                        onClose={() => setShowAutocomplete(false)}
                        isFocused={showAutocomplete}
                      />
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

