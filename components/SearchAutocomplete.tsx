'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Search, Clock, TrendingUp, X } from 'lucide-react'
import { getProductsFromAPI } from '@/lib/api/products'
import { Product } from '@/types'
import { searchProducts } from '@/lib/search-utils'

interface SearchAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (query: string) => void
  onClose?: () => void
  isFocused?: boolean // Whether the input is focused
}

const POPULAR_SEARCHES = [
  'Fortnite V-Bucks',
  'Steam Wallet',
  'PlayStation Plus',
  'Xbox Game Pass',
  'Call of Duty',
  'FIFA Points',
  'Nintendo eShop',
]

const MAX_HISTORY = 5
const MAX_SUGGESTIONS = 8
const DEBOUNCE_DELAY = 300 // ms

export default function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  onClose,
  isFocused = false,
}: SearchAutocompleteProps) {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [mounted, setMounted] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  // Mount check for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update dropdown position
  useEffect(() => {
    if ((showSuggestions || isFocused) && mounted) {
      const updatePosition = () => {
        // Find the input element by ID
        const inputElement = document.getElementById('navbar-search-input') as HTMLInputElement
        
        if (!inputElement) {
          console.warn('Search input not found')
          return
        }
        
        const inputRect = inputElement.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const dropdownWidth = 400
        const margin = 16
        
        // Calculate width: use input width or dropdown width, whichever is larger
        let width = Math.max(dropdownWidth, inputRect.width)
        
        // Calculate left position to align dropdown with the input (left-aligned, not centered)
        let left = inputRect.left
        
        // If dropdown would overflow on the right, shift it left
        if (left + width > viewportWidth - margin) {
          left = viewportWidth - width - margin
        }
        
        // If dropdown would overflow on the left, align it to margin
        if (left < margin) {
          left = margin
          // Adjust width if needed to fit
          if (left + width > viewportWidth - margin) {
            width = viewportWidth - left - margin
          }
        }
        
        setDropdownPosition({
          top: inputRect.bottom + 8,
          left: Math.max(margin, left),
          width: Math.min(width, viewportWidth - margin * 2),
        })
      }
      
      // Update position immediately and on events
      updatePosition()
      
      // Use requestAnimationFrame to ensure it runs after DOM updates
      requestAnimationFrame(() => {
        updatePosition()
        requestAnimationFrame(updatePosition)
      })
      
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      
      return () => {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
      }
    }
  }, [showSuggestions, isFocused, mounted])

  // Load search history from localStorage
  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('search-history') || '[]')
      setSearchHistory(history.slice(0, MAX_HISTORY))
    } catch (error) {
      console.error('Error loading search history:', error)
    }
  }, [])

  // Debounced search with abort controller
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Reset selected index
    setSelectedIndex(-1)

    if (value.trim().length >= 2) {
      setIsLoading(true)
      
      // Debounce the search
      debounceTimerRef.current = setTimeout(async () => {
        const searchTerm = value.toLowerCase().trim()
        
        // Create new abort controller
        abortControllerRef.current = new AbortController()
        
        try {
          // Get all products first
          const allProducts = await getProductsFromAPI()
          
          // Check if request was aborted
          if (abortControllerRef.current?.signal.aborted) {
            return
          }
          
          // Use intelligent search with fuzzy matching
          const matched = searchProducts(allProducts, value, {
            fuzzyThreshold: 0.4, // Lower threshold for autocomplete (more lenient)
            maxResults: MAX_SUGGESTIONS,
          })
          
          setSuggestions(matched)
          setShowSuggestions(true)
          setIsLoading(false)
        } catch (error: any) {
          // Ignore abort errors
          if (error.name === 'AbortError') {
            return
          }
          console.error('Error loading suggestions:', error)
          setSuggestions([])
          setShowSuggestions(true)
          setIsLoading(false)
        }
      }, DEBOUNCE_DELAY)
    } else {
      setSuggestions([])
      // Show suggestions if focused (to show history) or if there's a value
      setShowSuggestions(isFocused || value.length > 0)
      setIsLoading(false)
    }

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [value, isFocused])

  // Old position fix removed - we now use portal with dropdownPosition state

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showSuggestions])

  // Old position fix removed - we now use portal with dropdownPosition state

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions) return

      const totalItems = suggestions.length + (value.length === 0 ? searchHistory.length + POPULAR_SEARCHES.length : 0)

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSuggestionClick(suggestions[selectedIndex])
          } else if (selectedIndex >= suggestions.length && value.length === 0) {
            const historyIndex = selectedIndex - suggestions.length
            if (historyIndex >= 0 && historyIndex < searchHistory.length) {
              handleHistoryClick(searchHistory[historyIndex])
            } else {
              const popularIndex = historyIndex - searchHistory.length
              if (popularIndex >= 0 && popularIndex < POPULAR_SEARCHES.length) {
                handlePopularClick(POPULAR_SEARCHES[popularIndex])
              }
            }
          } else if (value.trim()) {
            onSubmit(value.trim())
            setShowSuggestions(false)
            onClose?.()
          }
          break
        case 'Escape':
          e.preventDefault()
          setShowSuggestions(false)
          onClose?.()
          break
      }
    }

    if (showSuggestions) {
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [showSuggestions, selectedIndex, suggestions, searchHistory, value, onSubmit, onClose])

  // Removed global event listener to prevent blocking navigation clicks
  // Autocomplete will close when user clicks on a suggestion

  const handleSuggestionClick = useCallback((product: Product) => {
    const query = product.name
    console.log('Navigating to product:', { id: product.id, name: product.name, url: `/products/${product.id}` })
    saveToHistory(query)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    // Always use product name for Discord-Server to ensure correct routing
    if (product.name.toLowerCase().includes('simex') && product.name.toLowerCase().includes('discord')) {
      console.log('Discord-Server product detected, using name-based navigation')
      // Use the exact product name for navigation
      router.push(`/products/${encodeURIComponent(product.name)}`)
    } else {
      router.push(`/products/${product.id}`)
    }
    onClose?.()
  }, [router, onClose])

  const handleHistoryClick = useCallback((query: string) => {
    onChange(query)
    onSubmit(query)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    onClose?.()
  }, [onChange, onSubmit, onClose])

  const handlePopularClick = useCallback((query: string) => {
    onChange(query)
    onSubmit(query)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    onClose?.()
  }, [onChange, onSubmit, onClose])

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('search-history')
  }

  const removeHistoryItem = (item: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = searchHistory.filter((h) => h !== item)
    setSearchHistory(updated)
    localStorage.setItem('search-history', JSON.stringify(updated))
  }

  const saveToHistory = (query: string) => {
    try {
      const history = JSON.parse(localStorage.getItem('search-history') || '[]')
      const filtered = history.filter((h: string) => h.toLowerCase() !== query.toLowerCase())
      const updated = [query, ...filtered].slice(0, MAX_HISTORY)
      localStorage.setItem('search-history', JSON.stringify(updated))
      setSearchHistory(updated)
    } catch (error) {
      console.error('Error saving search history:', error)
    }
  }

  // Show autocomplete if focused (to show history) or if there are suggestions
  if (!showSuggestions && !isFocused) return null
  if (!mounted) return null

  const dropdownContent = (
    <div
      ref={containerRef}
      data-autocomplete
      className="fixed bg-fortnite-dark border border-winter-ice/30 rounded-lg shadow-2xl max-h-96 overflow-y-auto"
      style={{ 
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width || 400}px`,
        maxWidth: 'calc(100vw - 2rem)',
        zIndex: 99999,
      }}
      onMouseDown={(e) => e.preventDefault()} // Prevent input blur when clicking inside
    >
      {/* Product Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-4 border-b border-purple-500/20">
          <h3 className="text-gray-400 text-xs font-semibold mb-3 uppercase tracking-wide">
            Produktvorschläge
          </h3>
          <div className="space-y-2">
            {suggestions.map((product, index) => {
              // Debug: Log product info to help identify the issue
              if (product.name.toLowerCase().includes('simex') || product.name.toLowerCase().includes('discord')) {
                console.log('Discord/Simex product found:', { id: product.id, name: product.name, index })
              }
              return (
              <button
                key={`${product.id}-${product.name}`}
                onClick={() => {
                  console.log('Clicked product:', { id: product.id, name: product.name })
                  handleSuggestionClick(product)
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center space-x-3 p-2 rounded transition-colors text-left group ${
                  selectedIndex === index
                    ? 'bg-purple-500/20 border border-purple-500/50'
                    : 'hover:bg-purple-500/10'
                }`}
              >
                <div className="relative w-12 h-12 bg-gradient-to-br from-purple-900/50 to-yellow-900/50 rounded overflow-hidden flex-shrink-0">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback wenn Bild nicht geladen werden kann
                        const target = e.target as HTMLImageElement
                        const parent = target.parentElement
                        if (parent && !parent.querySelector('.fallback-icon')) {
                          target.style.display = 'none'
                          const fallback = document.createElement('div')
                          fallback.className = 'w-full h-full flex items-center justify-center fallback-icon'
                          fallback.innerHTML = '<span class="text-lg">🎮</span>'
                          parent.appendChild(fallback)
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-lg">🎮</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate group-hover:text-purple-400 transition-colors">
                    {product.name}
                  </p>
                  <p className="text-gray-400 text-xs">{product.platform}</p>
                </div>
                <div className="text-right">
                  <p className="text-purple-400 font-semibold text-sm">
                    €{(product.discount && product.discount > 0 ? product.price : (product.originalPrice || product.price)).toFixed(2)}
                  </p>
                </div>
              </button>
            )})}
          </div>
        </div>
      )}

      {/* Search History */}
      {value.length === 0 && searchHistory.length > 0 && (
        <div className="p-4 border-b border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wide flex items-center space-x-2">
              <Clock className="w-3 h-3" />
              <span>Zuletzt gesucht</span>
            </h3>
            <button
              onClick={clearHistory}
              className="text-gray-500 hover:text-white text-xs transition-colors"
            >
              Alle löschen
            </button>
          </div>
          <div className="space-y-1">
            {searchHistory.map((item, index) => {
              const itemIndex = suggestions.length + index
              return (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(item)}
                  onMouseEnter={() => setSelectedIndex(itemIndex)}
                  className={`w-full flex items-center justify-between p-2 rounded transition-colors text-left group ${
                    selectedIndex === itemIndex
                      ? 'bg-purple-500/20 border border-purple-500/50'
                      : 'hover:bg-purple-500/10'
                  }`}
                >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-300 text-sm truncate group-hover:text-purple-400 transition-colors">
                    {item}
                  </span>
                </div>
                <button
                  onClick={(e) => removeHistoryItem(item, e)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-all p-1"
                >
                  <X className="w-4 h-4" />
                </button>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Popular Searches */}
      {value.length === 0 && (
        <div className="p-4">
          <h3 className="text-gray-400 text-xs font-semibold mb-3 uppercase tracking-wide flex items-center space-x-2">
            <TrendingUp className="w-3 h-3" />
            <span>Beliebte Suchbegriffe</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((search, index) => {
              const itemIndex = suggestions.length + searchHistory.length + index
              return (
                <button
                  key={index}
                  onClick={() => handlePopularClick(search)}
                  onMouseEnter={() => setSelectedIndex(itemIndex)}
                  className={`px-3 py-1.5 border rounded-lg text-sm transition-all ${
                    selectedIndex === itemIndex
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 hover:border-purple-500/50 text-gray-300 hover:text-purple-300'
                  }`}
                >
                  {search}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && value.length >= 2 && (
        <div className="p-4 text-center">
          <p className="text-gray-400 text-sm">Suche...</p>
        </div>
      )}

      {/* No Results */}
      {!isLoading && value.length >= 2 && suggestions.length === 0 && (
        <div className="p-4 text-center">
          <p className="text-gray-400 text-sm mb-2">Keine Ergebnisse gefunden</p>
          <button
            onClick={() => {
              onSubmit(value)
              setShowSuggestions(false)
              onClose?.()
            }}
            className="text-purple-400 hover:text-purple-300 text-sm font-medium"
          >
            Alle Ergebnisse für "{value}" anzeigen →
          </button>
        </div>
      )}
    </div>
  )

  return createPortal(dropdownContent, document.body)
}

