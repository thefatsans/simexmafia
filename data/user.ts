import { User, CoinTransaction, RedemptionItem, calculateTier } from '@/types/user'

export const mockUser: User = {
  id: 'user1',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  goofyCoins: 342,
  totalSpent: 287.50,
  tier: calculateTier(342),
  joinDate: '2024-01-15',
}

export const mockCoinTransactions: CoinTransaction[] = [
  {
    id: 'tx1',
    userId: 'user1',
    amount: 50,
    type: 'earned',
    description: 'Purchase: Fortnite V-Bucks 1000',
    date: '2024-12-20',
    orderId: 'ORD-123456',
  },
  {
    id: 'tx2',
    userId: 'user1',
    amount: 75,
    type: 'earned',
    description: 'Purchase: Call of Duty: Modern Warfare III',
    date: '2024-12-18',
    orderId: 'ORD-123455',
  },
  {
    id: 'tx3',
    userId: 'user1',
    amount: 100,
    type: 'bonus',
    description: 'Welcome Bonus',
    date: '2024-01-15',
  },
  {
    id: 'tx4',
    userId: 'user1',
    amount: -25,
    type: 'spent',
    description: 'Redeemed: 5% Discount Coupon',
    date: '2024-12-15',
  },
  {
    id: 'tx5',
    userId: 'user1',
    amount: 62,
    type: 'earned',
    description: 'Purchase: PlayStation Store Gift Card €50',
    date: '2024-12-10',
    orderId: 'ORD-123454',
  },
]

export const mockRedemptionItems: RedemptionItem[] = [
  {
    id: 'redeem1',
    name: '5% Rabatt-Gutschein',
    description: 'Erhalte 5% Rabatt auf deinen nächsten Kauf',
    cost: 25,
    type: 'discount',
    value: '5% Rabatt',
    available: true,
  },
  {
    id: 'redeem2',
    name: '10% Rabatt-Gutschein',
    description: 'Erhalte 10% Rabatt auf deinen nächsten Kauf',
    cost: 75,
    type: 'discount',
    value: '10% Rabatt',
    available: true,
  },
  {
    id: 'redeem3',
    name: '15% Rabatt-Gutschein',
    description: 'Erhalte 15% Rabatt auf deinen nächsten Kauf',
    cost: 150,
    type: 'discount',
    value: '15% Rabatt',
    available: true,
  },
  {
    id: 'redeem6',
    name: 'Exklusives Simex Merch',
    description: 'Erhalte exklusives SimexMafia Merchandise',
    cost: 1000,
    type: 'product',
    value: 'Merchandise',
    available: true,
  },
]

export const getUserTransactions = (userId: string) => {
  return mockCoinTransactions.filter(tx => tx.userId === userId)
}







