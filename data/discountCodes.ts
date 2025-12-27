export interface DiscountCode {
  code: string
  type: 'percentage' | 'fixed'
  value: number // Percentage (0-100) or fixed amount in EUR
  minPurchase?: number // Minimum purchase amount to use this code
  maxDiscount?: number // Maximum discount amount (for percentage codes)
  validFrom: string // ISO date string
  validUntil: string // ISO date string
  usageLimit?: number // Maximum number of times this code can be used
  usedCount: number // Current usage count
  applicableTo?: 'all' | 'products' | 'sacks' | 'goofycoins' // What this code applies to
  description?: string
  isActive: boolean
}

const STORAGE_KEY = 'simexmafia-discount-codes'

// Default discount codes
const defaultCodes: DiscountCode[] = [
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    minPurchase: 0,
    validFrom: '2024-01-01',
    validUntil: '2025-12-31',
    usageLimit: 1,
    usedCount: 0,
    applicableTo: 'all',
    description: '10% Rabatt für neue Kunden',
    isActive: true,
  },
  {
    code: 'SAVE20',
    type: 'percentage',
    value: 20,
    minPurchase: 50,
    maxDiscount: 15,
    validFrom: '2024-01-01',
    validUntil: '2025-12-31',
    usageLimit: undefined, // Unlimited
    usedCount: 0,
    applicableTo: 'all',
    description: '20% Rabatt ab €50 Einkaufswert (max. €15 Rabatt)',
    isActive: true,
  },
  {
    code: 'FIXED5',
    type: 'fixed',
    value: 5,
    minPurchase: 20,
    validFrom: '2024-01-01',
    validUntil: '2025-12-31',
    usageLimit: undefined,
    usedCount: 0,
    applicableTo: 'all',
    description: '€5 Rabatt ab €20 Einkaufswert',
    isActive: true,
  },
  {
    code: 'SACKS50',
    type: 'percentage',
    value: 50,
    minPurchase: 0,
    validFrom: '2024-01-01',
    validUntil: '2025-12-31',
    usageLimit: 1,
    usedCount: 0,
    applicableTo: 'sacks',
    description: '50% Rabatt auf alle Säcke (einmalig)',
    isActive: true,
  },
]

export const getDiscountCodes = (): DiscountCode[] => {
  try {
    if (typeof window === 'undefined') return defaultCodes
    
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
    
    // Initialize with default codes if storage is empty
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCodes))
    return defaultCodes
  } catch (error) {
    console.error('Error loading discount codes:', error)
    return defaultCodes
  }
}

export const validateDiscountCode = (
  code: string,
  subtotal: number,
  items: Array<{ type?: string }>
): { valid: boolean; discountCode?: DiscountCode; error?: string } => {
  const codes = getDiscountCodes()
  const discountCode = codes.find(
    c => c.code.toUpperCase() === code.toUpperCase() && c.isActive
  )

  if (!discountCode) {
    return { valid: false, error: 'Ungültiger Rabattcode' }
  }

  // Check validity dates
  const now = new Date()
  const validFrom = new Date(discountCode.validFrom)
  const validUntil = new Date(discountCode.validUntil)

  if (now < validFrom || now > validUntil) {
    return { valid: false, error: 'Rabattcode ist abgelaufen' }
  }

  // Check usage limit
  if (discountCode.usageLimit && discountCode.usedCount >= discountCode.usageLimit) {
    return { valid: false, error: 'Rabattcode wurde bereits verwendet' }
  }

  // Check minimum purchase
  if (discountCode.minPurchase && subtotal < discountCode.minPurchase) {
    return {
      valid: false,
      error: `Mindestbestellwert von €${discountCode.minPurchase.toFixed(2)} nicht erreicht`,
    }
  }

  // Check applicability
  if (discountCode.applicableTo && discountCode.applicableTo !== 'all') {
    const hasApplicableItem = items.some(item => {
      if (discountCode.applicableTo === 'products') return item.type === 'product'
      if (discountCode.applicableTo === 'sacks') return item.type === 'sack'
      if (discountCode.applicableTo === 'goofycoins') return item.type === 'goofycoins'
      return false
    })

    if (!hasApplicableItem) {
      return {
        valid: false,
        error: `Rabattcode gilt nur für ${discountCode.applicableTo === 'sacks' ? 'Säcke' : discountCode.applicableTo === 'goofycoins' ? 'GoofyCoins' : 'Produkte'}`,
      }
    }
  }

  return { valid: true, discountCode }
}

export const calculateDiscount = (
  discountCode: DiscountCode,
  subtotal: number
): number => {
  if (discountCode.type === 'percentage') {
    let discount = (subtotal * discountCode.value) / 100
    
    // Apply max discount if specified
    if (discountCode.maxDiscount) {
      discount = Math.min(discount, discountCode.maxDiscount)
    }
    
    return Math.round(discount * 100) / 100 // Round to 2 decimal places
  } else {
    // Fixed discount
    return Math.min(discountCode.value, subtotal) // Can't discount more than subtotal
  }
}

export const applyDiscountCode = (code: string): void => {
  const codes = getDiscountCodes()
  const discountCode = codes.find(c => c.code.toUpperCase() === code.toUpperCase())
  
  if (discountCode && discountCode.usageLimit) {
    discountCode.usedCount++
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes))
  }
}

export const addDiscountCode = (code: DiscountCode): void => {
  const codes = getDiscountCodes()
  codes.push(code)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(codes))
}

export const removeDiscountCode = (code: string): void => {
  const codes = getDiscountCodes()
  const filtered = codes.filter(c => c.code.toUpperCase() !== code.toUpperCase())
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}






