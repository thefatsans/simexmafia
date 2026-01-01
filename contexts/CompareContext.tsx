'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Product } from '@/types'

interface CompareContextType {
  compareItems: Product[]
  addToCompare: (product: Product) => void
  removeFromCompare: (productId: string) => void
  clearCompare: () => void
  isInCompare: (productId: string) => boolean
  canAddMore: boolean
}

const CompareContext = createContext<CompareContextType | undefined>(undefined)

const MAX_COMPARE_ITEMS = 3
const STORAGE_KEY = 'simexmafia-compare'

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareItems, setCompareItems] = useState<Product[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load compare items from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoaded(true)
      return
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCompareItems(parsed)
        }
      }
    } catch (error) {
      console.error('Error loading compare items:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save compare items to localStorage
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return

    try {
      if (compareItems.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compareItems))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (error) {
      console.error('Error saving compare items:', error)
    }
  }, [compareItems, isLoaded])

  const addToCompare = useCallback((product: Product) => {
    setCompareItems(prev => {
      // Check if product is already in compare
      if (prev.some(p => p.id === product.id)) {
        return prev
      }
      
      // Check if we can add more items
      if (prev.length >= MAX_COMPARE_ITEMS) {
        return prev
      }

      return [...prev, product]
    })
  }, [])

  const removeFromCompare = useCallback((productId: string) => {
    setCompareItems(prev => prev.filter(p => p.id !== productId))
  }, [])

  const clearCompare = useCallback(() => {
    setCompareItems([])
  }, [])

  const isInCompare = useCallback((productId: string) => {
    return compareItems.some(p => p.id === productId)
  }, [compareItems])

  const canAddMore = compareItems.length < MAX_COMPARE_ITEMS

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        canAddMore,
      }}
    >
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const context = useContext(CompareContext)
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider')
  }
  return context
}













