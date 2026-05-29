'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { Product } from '@/types'
import type { User } from '@/types/user'
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

function getWishlistProfile(user: User) {
  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [wishlist, setWishlist] = useState<Product[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [useAPI, setUseAPI] = useState(false)
  const loadedForUserRef = useRef<string | null>(null)
  const profile = user ? getWishlistProfile(user) : undefined

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoaded(true)
      return
    }

    const userKey = user?.id ?? 'guest'
    if (loadedForUserRef.current === userKey) return

    let cancelled = false

    const loadWishlist = async () => {
      try {
        if (user?.id) {
          try {
            let apiWishlist = await getWishlistFromAPI(user.id, profile)
            if (cancelled) return

            const localWishlist = localStorage.getItem(STORAGE_KEY)
            if (localWishlist) {
              try {
                const parsed = JSON.parse(localWishlist)
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const validProducts = parsed.filter((p: unknown) =>
                    p && typeof p === 'object' && 'id' in p && 'name' in p && 'price' in p
                  ) as Product[]
                  for (const product of validProducts) {
                    try {
                      await addToWishlistAPI(user.id, product, profile)
                    } catch {
                      // Ignore if already exists
                    }
                  }
                  apiWishlist = await getWishlistFromAPI(user.id, profile)
                  localStorage.removeItem(STORAGE_KEY)
                }
              } catch {
                // Ignore invalid local wishlist
              }
            }

            if (cancelled) return
            setWishlist(apiWishlist.map((item) => item.product))
            setUseAPI(true)
            loadedForUserRef.current = userKey
            return
          } catch (error) {
            console.warn('API not available, using localStorage:', error)
            setUseAPI(false)
          }
        }

        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            if (parsed.length > 0 && typeof parsed[0] === 'string') {
              const { mockProducts } = await import('@/data/products')
              const migratedProducts = parsed
                .map((id: string) => mockProducts.find((p) => p.id === id))
                .filter((p): p is Product => p !== undefined)
              if (!cancelled) {
                setWishlist(migratedProducts)
                localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedProducts))
              }
            } else {
              const validProducts = parsed.filter((p: unknown) =>
                p && typeof p === 'object' && 'id' in p && 'name' in p && 'price' in p
              ) as Product[]
              if (!cancelled) setWishlist(validProducts)
            }
          }
        }
        loadedForUserRef.current = userKey
      } catch (error) {
        console.error('Error loading wishlist:', error)
      } finally {
        if (!cancelled) setIsLoaded(true)
      }
    }

    loadWishlist()

    return () => {
      cancelled = true
    }
  }, [user?.id, profile])

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
    if (useAPI && user?.id) {
      try {
        await addToWishlistAPI(user.id, product, profile)
        setWishlist(prev => {
          if (prev.some(p => p.id === product.id)) {
            return prev
          }
          return [...prev, product]
        })
        return
      } catch (error: unknown) {
        if (error instanceof Error && error.message?.includes('already in wishlist')) {
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

    setWishlist(prev => {
      if (prev.some(p => p.id === product.id)) {
        return prev
      }
      return [...prev, product]
    })
  }, [useAPI, user?.id, profile])

  const removeFromWishlist = useCallback(async (productId: string) => {
    if (useAPI && user?.id) {
      try {
        await removeFromWishlistAPI(user.id, productId, profile)
        setWishlist(prev => prev.filter(p => p.id !== productId))
        return
      } catch (error) {
        console.warn('Failed to remove from wishlist via API, using localStorage:', error)
        setUseAPI(false)
      }
    }

    setWishlist(prev => prev.filter(p => p.id !== productId))
  }, [useAPI, user?.id, profile])

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
