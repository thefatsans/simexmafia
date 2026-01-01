import { useState, useEffect } from 'react'
import { Product } from '@/types'

export interface PriceAlert {
  id: string
  productId: string
  product: Product
  targetPrice: number
  currentPrice: number
  createdAt: string
  notified: boolean
}

const STORAGE_KEY = 'price-alerts'

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])

  useEffect(() => {
    // Load alerts from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setAlerts(parsed)
      }
    } catch (error) {
      console.error('Error loading price alerts:', error)
    }
  }, [])

  const saveAlerts = (newAlerts: PriceAlert[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAlerts))
      setAlerts(newAlerts)
    } catch (error) {
      console.error('Error saving price alerts:', error)
    }
  }

  const addAlert = (product: Product, targetPrice: number) => {
    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      productId: product.id,
      product,
      targetPrice,
      currentPrice: product.price,
      createdAt: new Date().toISOString(),
      notified: false,
    }

    const updated = [...alerts, newAlert]
    saveAlerts(updated)
    return newAlert
  }

  const removeAlert = (alertId: string) => {
    const updated = alerts.filter((a) => a.id !== alertId)
    saveAlerts(updated)
  }

  const hasAlert = (productId: string) => {
    return alerts.some((a) => a.productId === productId)
  }

  const getAlert = (productId: string) => {
    return alerts.find((a) => a.productId === productId)
  }

  const checkPriceDrops = () => {
    const updated = alerts.map((alert) => {
      // In a real app, you would fetch the current price from an API
      // For now, we'll simulate price changes
      const currentPrice = alert.product.price
      
      if (currentPrice <= alert.targetPrice && !alert.notified) {
        // Price dropped to or below target
        return {
          ...alert,
          currentPrice,
          notified: true,
        }
      }
      
      return {
        ...alert,
        currentPrice,
      }
    })

    const hasNewNotifications = updated.some(
      (a, i) => a.notified && !alerts[i].notified
    )

    if (hasNewNotifications) {
      saveAlerts(updated)
      return updated.filter((a) => a.notified && !alerts.find((old) => old.id === a.id && old.notified))
    }

    saveAlerts(updated)
    return []
  }

  return {
    alerts,
    addAlert,
    removeAlert,
    hasAlert,
    getAlert,
    checkPriceDrops,
  }
}














