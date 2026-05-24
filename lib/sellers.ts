import { Seller } from '@/types'

/** Offizieller Marktplatz-Verkäufer (Simex Geheimer Discord-Server u. a.) */
export const SIMEXMAFIA_SELLER_ID = 'seller-simexmafia'

export const SELLER_NAMES: Record<string, string> = {
  seller1: 'GameDeals Pro',
  seller2: 'DigitalKeys Store',
  seller3: 'GiftCard Masters',
  seller4: 'Subscriptions Hub',
  [SIMEXMAFIA_SELLER_ID]: 'SimexMafia',
}

export const SIMEXMAFIA_SELLER: Seller = {
  id: SIMEXMAFIA_SELLER_ID,
  name: 'SimexMafia',
  rating: 5.0,
  reviewCount: 847,
  verified: true,
}

export const MARKETPLACE_SELLERS: Seller[] = [
  {
    id: 'seller1',
    name: 'GameDeals Pro',
    rating: 4.8,
    reviewCount: 1245,
    verified: true,
  },
  {
    id: 'seller2',
    name: 'DigitalKeys Store',
    rating: 4.9,
    reviewCount: 3421,
    verified: true,
  },
  {
    id: 'seller3',
    name: 'GiftCard Masters',
    rating: 4.7,
    reviewCount: 8923,
    verified: true,
  },
  {
    id: 'seller4',
    name: 'Subscriptions Hub',
    rating: 4.6,
    reviewCount: 2134,
    verified: true,
  },
  SIMEXMAFIA_SELLER,
]

const SELLER_RATINGS: Record<string, { rating: number; reviewCount: number }> = {
  seller1: { rating: 4.8, reviewCount: 1245 },
  seller2: { rating: 4.9, reviewCount: 3421 },
  seller3: { rating: 4.7, reviewCount: 8923 },
  seller4: { rating: 4.6, reviewCount: 2134 },
  [SIMEXMAFIA_SELLER_ID]: { rating: 5.0, reviewCount: 847 },
}

export function resolveSeller(sellerId?: string | null): Seller {
  const id = sellerId || 'seller1'

  if (id === SIMEXMAFIA_SELLER_ID) {
    return SIMEXMAFIA_SELLER
  }

  const meta = SELLER_RATINGS[id] || { rating: 4.7, reviewCount: 2000 }

  return {
    id,
    name: SELLER_NAMES[id] || 'SimexMafia Partner',
    rating: meta.rating,
    reviewCount: meta.reviewCount,
    verified: true,
  }
}

export function getSellerById(sellerId: string): Seller | undefined {
  return MARKETPLACE_SELLERS.find((s) => s.id === sellerId)
}

export const DEFAULT_SELLER_IDS = [
  'seller1',
  'seller2',
  'seller3',
  'seller4',
  SIMEXMAFIA_SELLER_ID,
] as const
