import { Seller } from '@/types'

/** Einziger Marktplatz-Verkäufer */
export const SIMEXMAFIA_SELLER_ID = 'seller-simexmafia'

export const SIMEXMAFIA_SELLER: Seller = {
  id: SIMEXMAFIA_SELLER_ID,
  name: 'SimexMafia',
  rating: 0,
  reviewCount: 0,
  verified: true,
}

export function resolveSeller(_sellerId?: string | null): Seller {
  return { ...SIMEXMAFIA_SELLER }
}

export function getSellerById(sellerId: string): Seller | undefined {
  if (sellerId === SIMEXMAFIA_SELLER_ID) {
    return { ...SIMEXMAFIA_SELLER }
  }
  return undefined
}

export const DEFAULT_SELLER_IDS = [SIMEXMAFIA_SELLER_ID] as const
