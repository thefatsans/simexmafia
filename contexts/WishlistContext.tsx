'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Product } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { 
  getWishlistFromAPI, 
  addToWishlistAPI, 
  removeFromWishlistAPI 
} from '@/lib/api/wishlist'

interface WishlistContextType {
  wishlist: Product[]
  isInWishlist: (productId: string) => boolean
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: string) => void
  toggleWishlist: (product: Product) => void
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

const STORAGE_KEY = 'simexmafia-wishlist'

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [wishlist, setWishlist] = useState<Product[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [useAPI, setUseAPI] = useState(false)

  // Load wishlist on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoaded(true)
      return
    }

    const loadWishlist = async () => {
      try {
        // Wenn User eingeloggt ist, versuche API zu verwenden
        if (user?.id) {
          try {
            const apiWishlist = await getWishlistFromAPI(user.id)
            setWishlist(apiWishlist.map(item => item.product))
            setUseAPI(true)
            setIsLoaded(true)
            return
          } catch (error) {
            console.warn('API not available, using localStorage:', error)
            setUseAPI(false)
          }
        }

        // Fallback: localStorage
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            // Check if it's old format (array of IDs) or new format (array of Products)
            if (parsed.length > 0 && typeof parsed[0] === 'string') {
              // Old format: array of product IDs - migrate to new format
              const { mockProducts } = await import('@/data/products')
              const migratedProducts = parsed
                .map((id: string) => mockProducts.find(p => p.id === id))
                .filter((p): p is Product => p !== undefined)
              setWishlist(migratedProducts)
              localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedProducts))
            } else {
              // New format: array of Products
              const validProducts = parsed.filter((p: any) => 
                p && typeof p === 'object' && p.id && p.name && p.price !== undefined
              )
              setWishlist(validProducts)
            }
          }
        }
      } catch (error) {
        console.error('Error loading wishlist:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    loadWishlist()
  }, [user?.id])

  // Wenn User sich einloggt, lade Wishlist von API
  useEffect(() => {
    if (user?.id && isLoaded) {
      const loadWishlistFromAPI = async () => {
        try {
          const apiWishlist = await getWishlistFromAPI(user.id)
          setWishlist(apiWishlist.map(item => item.product))
          setUseAPI(true)
          // Merge mit localStorage Wishlist falls vorhanden
          const localWishlist = localStorage.getItem(STORAGE_KEY)
          if (localWishlist) {
            try {
              const parsed = JSON.parse(localWishlist)
              if (Array.isArray(parsed) && parsed.length > 0) {
                const validProducts = parsed.filter((p: any) => 
                  p && typeof p === 'object' && p.id && p.name && p.price !== undefined
                )
                // Füge localStorage Items zur API hinzu
                for (const product of validProducts) {
                  try {
                    await addToWishlistAPI(user.id, product)
                  } catch (e) {
                    // Ignore if already exists
                  }
                }
                // Lade erneut von API
                const updatedWishlist = await getWishlistFromAPI(user.id)
                setWishlist(updatedWishlist.map(item => item.product))
                // Lösche localStorage
                localStorage.removeItem(STORAGE_KEY)
              }
            } catch (e) {
              // Ignore
            }
          }
        } catch (error) {
          console.warn('API not available, using localStorage:', error)
          setUseAPI(false)
        }
      }
      loadWishlistFromAPI()
    } else if (!user && isLoaded) {
      setUseAPI(false)
    }
  }, [user?.id, isLoaded])

  // Save wishlist to localStorage wenn nicht API (Fallback)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isLoaded || useAPI) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist))
    } catch (error) {
      console.error('Error saving wishlist to localStorage:', error)
    }
  }, [wishlist, isLoaded, useAPI])

  const isInWishlist = useCallback((productId: string): boolean => {
    return wishlist.some(p => p.id === productId)
  }, [wishlist])

  const addToWishlist = useCallback(async (product: Product) => {
    // Wenn API verfügbar und User eingeloggt
    if (useAPI && user?.id) {
      try {
        await addToWishlistAPI(user.id, product)
        setWishlist(prev => {
          if (prev.some(p => p.id === product.id)) {
            return prev
          }
          return [...prev, product]
        })
        return
      } catch (error: any) {
        if (error.message?.includes('already in wishlist')) {
          // Item already exists, just update local state
          setWishlist(prev => {
            if (prev.some(p => p.id === product.id)) {
              return prev
            }
            return [...prev, product]
          })
          return
        }
        console.warn('Failed to add to wishlist via API, using localStorage:', error)
        setUseAPI(false)
      }
    }

    // Fallback: localStorage
    setWishlist(prev => {
      if (prev.some(p => p.id === product.id)) {
        return prev
      }
      return [...prev, product]
    })
  }, [useAPI, user?.id])

  const removeFromWishlist = useCallback(async (productId: string) => {
    // Wenn API verfügbar und User eingeloggt
    if (useAPI && user?.id) {
      try {
        await removeFromWishlistAPI(user.id, productId)
        setWishlist(prev => prev.filter(p => p.id !== productId))
        return
      } catch (error) {
        console.warn('Failed to remove from wishlist via API, using localStorage:', error)
        setUseAPI(false)
      }
    }

    // Fallback: localStorage
    setWishlist(prev => prev.filter(p => p.id !== productId))
  }, [useAPI, user?.id])

  const toggleWishlist = useCallback(async (product: Product) => {
    const isInList = wishlist.some(p => p.id === product.id)
    if (isInList) {
      await removeFromWishlist(product.id)
    } else {
      await addToWishlist(product)
    }
  }, [wishlist, addToWishlist, removeFromWishlist])

  const clearWishlist = useCallback(() => {
    setWishlist([])
  }, [])

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}

