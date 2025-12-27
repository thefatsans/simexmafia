'use client'

import { useState, useEffect, useCallback } from 'react'
import { Product } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

const MAX_ITEMS = 12

// Helper function to get storage key based on user ID
const getStorageKey = (userId?: string): string => {
  if (userId) {
    return `simexmafia-recently-viewed-${userId}`
  }
  // For anonymous users, use a session-based key
  if (typeof window !== 'undefined') {
    let anonymousId = sessionStorage.getItem('simexmafia-anonymous-id')
    if (!anonymousId) {
      anonymousId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('simexmafia-anonymous-id', anonymousId)
    }
    return `simexmafia-recently-viewed-${anonymousId}`
  }
  return 'simexmafia-recently-viewed-anonymous'
}

export function useRecentlyViewed() {
  const { user } = useAuth()
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([])

  useEffect(() => {
    // Load from localStorage (only on client side)
    if (typeof window === 'undefined') return
    
    const storageKey = getStorageKey(user?.id)
    
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const products = JSON.parse(stored)
        // Validate that it's an array
        if (Array.isArray(products)) {
          setRecentlyViewed(products)
        }
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error)
      // Clear corrupted data
      try {
        localStorage.removeItem(storageKey)
      } catch (e) {
        // Ignore
      }
    }
  }, [user?.id]) // Reload when user changes

  const addProduct = useCallback((product: Product) => {
    setRecentlyViewed((prev) => {
      // Remove if already exists (to move to front)
      const filtered = prev.filter((p) => p.id !== product.id)
      // Add to beginning
      const updated = [product, ...filtered].slice(0, MAX_ITEMS)
      
      // Save to localStorage (only on client side)
      if (typeof window !== 'undefined') {
        try {
          const storageKey = getStorageKey(user?.id)
          localStorage.setItem(storageKey, JSON.stringify(updated))
        } catch (error) {
          console.error('Error saving recently viewed:', error)
        }
      }
      
      return updated
    })
  }, [user?.id])

  const clearRecentlyViewed = () => {
    setRecentlyViewed([])
    if (typeof window !== 'undefined') {
      try {
        const storageKey = getStorageKey(user?.id)
        localStorage.removeItem(storageKey)
      } catch (error) {
        console.error('Error clearing recently viewed:', error)
      }
    }
  }

  return {
    recentlyViewed,
    addProduct,
    clearRecentlyViewed,
  }
}

