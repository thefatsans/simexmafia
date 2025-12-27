'use client'

import { useState, useEffect, useCallback } from 'react'
import { Product } from '@/types'

const STORAGE_KEY = 'simexmafia-recently-viewed'
const MAX_ITEMS = 12

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([])

  useEffect(() => {
    // Load from localStorage (only on client side)
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
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
        localStorage.removeItem(STORAGE_KEY)
      } catch (e) {
        // Ignore
      }
    }
  }, [])

  const addProduct = useCallback((product: Product) => {
    setRecentlyViewed((prev) => {
      // Remove if already exists (to move to front)
      const filtered = prev.filter((p) => p.id !== product.id)
      // Add to beginning
      const updated = [product, ...filtered].slice(0, MAX_ITEMS)
      
      // Save to localStorage (only on client side)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch (error) {
          console.error('Error saving recently viewed:', error)
        }
      }
      
      return updated
    })
  }, [])

  const clearRecentlyViewed = () => {
    setRecentlyViewed([])
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY)
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

