export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  goofyCoins: number
  totalSpent: number
  tier: Tier
  joinDate: string
  avatar?: string
}

export type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'

export interface TierInfo {
  name: Tier
  minCoins: number
  color: string
  benefits: string[]
  discount: number // Percentage discount
}

export interface CoinTransaction {
  id: string
  userId: string
  amount: number
  type: 'earned' | 'spent' | 'bonus'
  description: string
  date: string
  orderId?: string
}

export interface RedemptionItem {
  id: string
  name: string
  description: string
  cost: number
  type: 'discount' | 'product' | 'subscription'
  value: string // e.g., "10% off", "Free Game", etc.
  available: boolean
  image?: string
}

export const TIER_INFO: Record<Tier, TierInfo> = {
  Bronze: {
    name: 'Bronze',
    minCoins: 0,
    color: '#CD7F32',
    benefits: ['1 coin per €1 spent', 'Basic support'],
    discount: 0,
  },
  Silver: {
    name: 'Silver',
    minCoins: 100,
    color: '#C0C0C0',
    benefits: ['1.2 coins per €1 spent', 'Priority support', '5% discount on all purchases'],
    discount: 5,
  },
  Gold: {
    name: 'Gold',
    minCoins: 500,
    color: '#FFD700',
    benefits: ['1.5 coins per €1 spent', '24/7 support', '10% discount', 'Early access to sales'],
    discount: 10,
  },
  Platinum: {
    name: 'Platinum',
    minCoins: 2000,
    color: '#E5E4E2',
    benefits: ['2 coins per €1 spent', 'VIP support', '15% discount', 'Exclusive deals', 'Free shipping'],
    discount: 15,
  },
  Diamond: {
    name: 'Diamond',
    minCoins: 5000,
    color: '#B9F2FF',
    benefits: ['2.5 coins per €1 spent', 'Personal account manager', '20% discount', 'Exclusive products', 'Free premium subscription'],
    discount: 20,
  },
}

export const calculateTier = (coins: number): Tier => {
  if (coins >= 5000) return 'Diamond'
  if (coins >= 2000) return 'Platinum'
  if (coins >= 500) return 'Gold'
  if (coins >= 100) return 'Silver'
  return 'Bronze'
}

export const calculateCoinsEarned = (amount: number, tier: Tier): number => {
  const multiplier = {
    Bronze: 1,
    Silver: 1.2,
    Gold: 1.5,
    Platinum: 2,
    Diamond: 2.5,
  }[tier]
  
  return Math.floor(amount * multiplier)
}















