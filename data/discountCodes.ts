export interface DiscountCode {
  id?: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minPurchase?: number | null
  minAmount?: number | null
  maxDiscount?: number | null
  validFrom: string
  validUntil: string | null
  usageLimit?: number | null
  usedCount?: number
  usageCount?: number
  active?: boolean
  isActive?: boolean
  description?: string | null
}

export type DiscountCodeType = DiscountCode['type']
