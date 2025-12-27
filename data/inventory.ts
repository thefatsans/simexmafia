import { Product } from '@/types'
import { getCompleteProductImage } from '@/prisma/complete-product-images'

export interface InventoryItem {
  id: string
  product: Product
  obtainedAt: string
  obtainedFrom: 'sack' | 'purchase' | 'gift' | 'other'
  sourceId?: string // z.B. Sack-ID oder Bestell-ID
  sourceName?: string // z.B. "Gold Sack" oder "Kauf"
  isRedeemed: boolean
  redeemedAt?: string
  redemptionCode?: string // Der generierte Code/Key
}

const STORAGE_KEY = 'simexmafia-inventory'

export const addToInventory = (
  product: Product,
  source: InventoryItem['obtainedFrom'],
  sourceId?: string,
  sourceName?: string
): InventoryItem => {
  try {
    const inventory = getInventory()
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      product,
      obtainedAt: new Date().toISOString(),
      obtainedFrom: source,
      sourceId,
      sourceName,
      isRedeemed: false,
    }
    
    const updated = [newItem, ...inventory]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return newItem
  } catch (error) {
    console.error('Error adding to inventory:', error)
    throw error
  }
}

export const getInventory = (): InventoryItem[] => {
  try {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const inventory = JSON.parse(stored)
    if (!Array.isArray(inventory)) return []
    
    // Aktualisiere Produktbilder mit den neuesten URLs
    let hasUpdates = false
    const updatedInventory = inventory.map((item: InventoryItem) => {
      if (item.product && item.product.name) {
        const latestImage = getCompleteProductImage(item.product.name)
        if (latestImage && item.product.image !== latestImage) {
          hasUpdates = true
          return {
            ...item,
            product: {
              ...item.product,
              image: latestImage,
            },
          }
        }
      }
      return item
    })
    
    // Speichere aktualisierte Bilder zurück in localStorage
    if (hasUpdates) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedInventory))
    }
    
    return updatedInventory
  } catch (error) {
    console.error('Error loading inventory:', error)
    return []
  }
}

export const getUnredeemedInventory = (): InventoryItem[] => {
  return getInventory().filter(item => !item.isRedeemed)
}

export const getRedeemedInventory = (): InventoryItem[] => {
  return getInventory().filter(item => item.isRedeemed)
}

// Generiere einen Produktcode/Key
const generateRedemptionCode = (): string => {
  // Format: XXXX-XXXX-XXXX-XXXX
  const segments = 4
  const charsPerSegment = 4
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Ohne I, O, 0, 1 für bessere Lesbarkeit
  
  const code = Array.from({ length: segments }, () => {
    return Array.from({ length: charsPerSegment }, () => {
      return chars[Math.floor(Math.random() * chars.length)]
    }).join('')
  }).join('-')
  
  return code
}

export const redeemItem = (itemId: string): string | null => {
  try {
    const inventory = getInventory()
    const item = inventory.find(i => i.id === itemId)
    
    if (!item || item.isRedeemed) {
      return null
    }
    
    // Generiere einen Code
    const code = generateRedemptionCode()
    
    item.isRedeemed = true
    item.redeemedAt = new Date().toISOString()
    item.redemptionCode = code
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory))
    return code
  } catch (error) {
    console.error('Error redeeming item:', error)
    return null
  }
}

export const removeFromInventory = (itemId: string): boolean => {
  try {
    const inventory = getInventory()
    const updated = inventory.filter(i => i.id !== itemId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return true
  } catch (error) {
    console.error('Error removing from inventory:', error)
    return false
  }
}

export const clearInventory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing inventory:', error)
  }
}

export const getInventoryStatistics = () => {
  const inventory = getInventory()
  const unredeemed = getUnredeemedInventory()
  const redeemed = getRedeemedInventory()
  
  const totalValue = inventory.reduce((sum, item) => sum + item.product.price, 0)
  const unredeemedValue = unredeemed.reduce((sum, item) => sum + item.product.price, 0)
  const redeemedValue = redeemed.reduce((sum, item) => sum + item.product.price, 0)
  
  const sourceCounts = {
    sack: inventory.filter(i => i.obtainedFrom === 'sack').length,
    purchase: inventory.filter(i => i.obtainedFrom === 'purchase').length,
    gift: inventory.filter(i => i.obtainedFrom === 'gift').length,
    other: inventory.filter(i => i.obtainedFrom === 'other').length,
  }
  
  return {
    total: inventory.length,
    unredeemed: unredeemed.length,
    redeemed: redeemed.length,
    totalValue,
    unredeemedValue,
    redeemedValue,
    sourceCounts,
  }
}

