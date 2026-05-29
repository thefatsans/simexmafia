'use client'

import Link from 'next/link'
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

  const closeMobileMenu = () => setIsMenuOpen(false)

  const navLinkClass =
    'text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-summer-sky-light hover:text-summer-ocean-light transition-colors whitespace-nowrap text-sm pointer-events-auto relative z-[10002] cursor-pointer'

  const mobileNavLinkClass =
    'text-white hover:text-purple-300 transition-colors pointer-events-auto relative cursor-pointer py-3 px-4 rounded-lg hover:bg-purple-500/20 active:bg-purple-500/30 touch-manipulation text-base font-medium border border-transparent hover:border-purple-500/30'

  return (
    <nav className="bg-fortnite-darker/95 dark:bg-fortnite-darker/95 bg-white/95 dark:border-summer-sky-light/30 border-gray-200 border-b sticky top-0 z-[9999] backdrop-blur-md pointer-events-auto transition-all duration-300 shadow-lg shadow-summer-ocean/10" style={{
      background: 'linear-gradient(135deg, rgba(8, 20, 35, 0.95) 0%, rgba(4, 12, 24, 0.95) 100%)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }} suppressHydrationWarning>
      <div className="w-full pointer-events-auto overflow-visible">
        <div className="flex items-center justify-between gap-2 py-3 md:py-4 px-3 sm:px-6 lg:px-8 pointer-events-auto w-full">
          {/* Left Section: Logo + Navigation */}
          <div className="flex items-center gap-6 flex-shrink-0">
            {/* Logo */}
            <Link
              href="/"
              className="group flex items-center flex-shrink-0 pointer-events-auto relative z-[10001] cursor-pointer transition-transform hover:scale-105"
            >
              <div className="hidden sm:block">
                <Logo width={200} height={200} showText={true} />
              </div>
              <div className="flex items-center sm:hidden">
                <Logo width={48} height={48} showText={false} />
                <span className="ml-2 text-lg font-bold bg-gradient-to-r from-summer-sky-light to-summer-ocean-light bg-clip-text text-transparent">SimexMafia</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4 pointer-events-auto relative z-[10001]">
              <Link href="/" className={navLinkClass}>
                Startseite
              </Link>
              <Link href="/products" className={navLinkClass}>
                Produkte
              </Link>
              <Link href="/categories" className={navLinkClass}>
                Kategorien
              </Link>
              <Link href="/sellers" className={navLinkClass}>
                Verkäufer
              </Link>
            </div>
          </div>

          {/* Center Section: Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4 hidden md:flex items-center relative overflow-visible" style={{ zIndex: 10000 }}>
            <div className="relative w-full overflow-visible">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10 pointer-events-none" />
              <input
                id="navbar-search-input"
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
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-fortnite-dark dark:bg-fortnite-dark bg-gray-100 dark:border-summer-sky-light/30 border-gray-300 rounded-lg text-white dark:text-white text-gray-900 dark:placeholder-gray-400 placeholder-gray-500 focus:outline-none focus:border-summer-sky-light dark:focus:border-summer-sky-light transition-colors"
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

          {/* Right Section: Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-shrink-0 relative z-[10000] pointer-events-auto">
            {!mounted ? null : isAuthenticated && user ? (
              <Link
                href="/account/goofycoins"
                className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg transition-colors group pointer-events-auto relative z-[10003] cursor-pointer"
                title="GoofyCoins verwalten"
              >
                <Coins className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                <span className="text-yellow-400 font-semibold text-sm">{user?.goofyCoins ?? 0}</span>
              </Link>
            ) : null}
            <Link
              href="/wishlist"
              className="relative p-2 text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-summer-sky-light hover:text-summer-ocean-light transition-colors pointer-events-auto z-[10003] cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
              title="Wunschliste"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/compare"
              className="hidden sm:flex relative p-2 text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-summer-sky-light hover:text-summer-ocean-light transition-colors pointer-events-auto z-[10003] cursor-pointer min-w-[40px] min-h-[40px] items-center justify-center touch-manipulation"
              title="Produktvergleich"
            >
              <GitCompare className="w-5 h-5" />
              {compareCount > 0 && (
                <span className="absolute top-0 right-0 bg-summer-ocean text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {compareCount > 9 ? '9+' : compareCount}
                </span>
              )}
            </Link>
            <button
              onClick={toggleTheme}
              className="hidden sm:flex p-2 text-gray-300 hover:text-summer-sky-light transition-colors pointer-events-auto z-[10003] cursor-pointer min-w-[40px] min-h-[40px] items-center justify-center touch-manipulation"
              title={mounted ? (theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren') : 'Theme wechseln'}
              suppressHydrationWarning
            >
              {!mounted ? (
                <Moon className="w-5 h-5" />
              ) : theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <Link
              href="/cart"
              className="relative p-2 text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-summer-sky-light hover:text-summer-ocean-light transition-colors pointer-events-auto z-[10003] cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
              title="Warenkorb"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
            {!mounted || !clientIsAuthenticated ? (
              <Link
                href="/auth/login"
                className="hidden lg:flex items-center space-x-2 px-3 py-2 text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-summer-sky-light hover:text-summer-ocean-light transition-colors pointer-events-auto relative z-[10003] cursor-pointer"
              >
                <LogIn className="w-5 h-5" />
                <span className="text-sm">Anmelden</span>
              </Link>
            ) : (
              <>
                {user && isAdmin(user.email) && (
                  <Link
                    href="/admin"
                    className="hidden lg:flex items-center space-x-2 px-3 py-2 text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-summer-sky-light hover:text-summer-ocean-light transition-colors pointer-events-auto relative z-[10003] cursor-pointer"
                    title="Admin Panel"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="text-sm">Admin</span>
                  </Link>
                )}
                <Link
                  href="/account"
                  className="hidden lg:flex items-center space-x-2 px-3 py-2 text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-summer-sky-light hover:text-summer-ocean-light transition-colors pointer-events-auto relative z-[10003] cursor-pointer"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm">{user?.firstName || 'Konto'}</span>
                </Link>
                <button
                  onClick={() => {
                    logout()
                    router.push('/')
                  }}
                  className="hidden lg:flex items-center space-x-2 px-3 py-2 text-gray-300 dark:text-gray-300 text-gray-700 dark:hover:text-red-400 hover:text-red-600 transition-colors pointer-events-auto relative z-[10003] cursor-pointer"
                  suppressHydrationWarning
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Abmelden</span>
                </button>
              </>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-300 hover:text-summer-sky-light transition-colors pointer-events-auto relative z-[10003] min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
              suppressHydrationWarning
              aria-label="Menü öffnen"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="lg:hidden fixed inset-0 bg-black/80 z-[9998]"
              style={{ top: '72px' }}
              onClick={() => setIsMenuOpen(false)}
            />
            {/* Menu Content */}
            <div className="lg:hidden border-t-2 border-purple-500/50 pointer-events-auto fixed left-0 right-0 z-[9999] overflow-y-auto shadow-2xl" style={{ 
              top: '72px', 
              maxHeight: 'calc(100vh - 72px)',
              background: 'linear-gradient(180deg, rgba(8, 20, 35, 0.98) 0%, rgba(4, 12, 24, 0.98) 100%)',
              backdropFilter: 'blur(20px)'
            }}>
              <div className="flex flex-col space-y-2 px-4 py-4 pb-20 pointer-events-auto min-h-full bg-gradient-to-b from-transparent to-purple-900/10">
              {/* Mobile Search */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (searchQuery.trim()) {
                    setIsMenuOpen(false)
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                    setSearchQuery('')
                  }
                }}
                className="md:hidden mb-2"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Suchen..."
                    className="w-full pl-10 pr-4 py-3 text-base bg-fortnite-dark border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    autoComplete="off"
                  />
                </div>
              </form>
              <Link href="/" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                Startseite
              </Link>
              <Link href="/products" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                Produkte
              </Link>
              <Link href="/categories" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                Kategorien
              </Link>
              <Link href="/sellers" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                Verkäufer
              </Link>
              <Link href="/sacks" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                🎁 Säcke öffnen
              </Link>
              <Link
                href="/cart"
                onClick={closeMobileMenu}
                className={`${mobileNavLinkClass} flex items-center justify-between`}
              >
                <span className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Warenkorb
                </span>
                {cartCount > 0 && (
                  <span className="bg-purple-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[24px] text-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
              <Link
                href="/inventory"
                onClick={closeMobileMenu}
                className="text-white hover:text-green-300 transition-colors pointer-events-auto relative cursor-pointer py-3 px-4 rounded-lg hover:bg-green-500/20 active:bg-green-500/30 touch-manipulation text-base font-medium border border-transparent hover:border-green-500/30"
              >
                📦 Inventar
              </Link>
              <Link
                href="/daily-rewards"
                onClick={closeMobileMenu}
                className="text-white hover:text-yellow-300 transition-colors pointer-events-auto relative cursor-pointer py-3 px-4 rounded-lg hover:bg-yellow-500/20 active:bg-yellow-500/30 touch-manipulation text-base font-bold border border-transparent hover:border-yellow-500/30"
              >
                🎁 Tägliche Belohnung
              </Link>
              <Link
                href="/leaderboard"
                onClick={closeMobileMenu}
                className="text-white hover:text-yellow-300 transition-colors pointer-events-auto relative cursor-pointer py-3 px-4 rounded-lg hover:bg-yellow-500/20 active:bg-yellow-500/30 touch-manipulation text-base font-medium border border-transparent hover:border-yellow-500/30"
              >
                🏆 Leaderboard
              </Link>
              <Link href="/wishlist" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                Wunschliste
              </Link>
              <Link href="/compare" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                Produktvergleich {compareCount > 0 && `(${compareCount})`}
              </Link>
              <button
                onClick={() => {
                  toggleTheme()
                  setIsMenuOpen(false)
                }}
                className="text-white hover:text-purple-300 transition-colors pointer-events-auto relative cursor-pointer text-left flex items-center space-x-2 py-3 px-4 rounded-lg hover:bg-purple-500/20 active:bg-purple-500/30 touch-manipulation text-base font-medium w-full border border-transparent hover:border-purple-500/30"
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
                <Link href="/auth/login" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                  🔐 Anmelden
                </Link>
              ) : (
                <>
                  <Link
                    href="/account/goofycoins"
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-2 px-3 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg transition-colors group pointer-events-auto relative z-[10004] cursor-pointer touch-manipulation"
                  >
                    <Coins className="w-6 h-6 text-yellow-400 group-hover:scale-110 transition-transform" />
                    <span className="text-yellow-400 font-bold text-base">{user?.goofyCoins ?? 0} GoofyCoins</span>
                  </Link>
                  {user && isAdmin(user.email) && (
                    <Link href="/admin" onClick={closeMobileMenu} className={`${mobileNavLinkClass} font-bold`}>
                      ⚙️ Admin Panel
                    </Link>
                  )}
                  <Link href="/account" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                    👤 {user?.firstName || 'Konto'}
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      closeMobileMenu()
                      router.push('/')
                    }}
                    className="text-white hover:text-red-300 transition-colors pointer-events-auto relative cursor-pointer text-left py-3 px-4 rounded-lg hover:bg-red-500/20 active:bg-red-500/30 touch-manipulation text-base font-medium w-full border border-transparent hover:border-red-500/30"
                    suppressHydrationWarning
                  >
                    <span>🚪 Abmelden</span>
                  </button>
                </>
              )}
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}

