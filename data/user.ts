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

/** Keine Demo-Daten – Verlauf kommt aus der Datenbank */
export const mockCoinTransactions: CoinTransaction[] = []

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

export const getUserTransactions = (_userId: string) => {
  return [] as CoinTransaction[]
}







