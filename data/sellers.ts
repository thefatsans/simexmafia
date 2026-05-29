import {
  SIMEXMAFIA_SELLER,
  SIMEXMAFIA_SELLER_ID,
  getSellerById as getMarketplaceSellerById,
} from '@/lib/sellers'

export { SIMEXMAFIA_SELLER_ID }

export const mockSellers = [SIMEXMAFIA_SELLER]

export const getSellerById = getMarketplaceSellerById

export const getSellerProducts = (sellerId: string) => {
  if (sellerId !== SIMEXMAFIA_SELLER_ID) return []
  const { getProducts } = require('./products') as typeof import('./products')
  return getProducts()
}
