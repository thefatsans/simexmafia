import { mockProducts } from './products'
import {
  MARKETPLACE_SELLERS,
  SIMEXMAFIA_SELLER_ID,
  getSellerById as getMarketplaceSellerById,
} from '@/lib/sellers'

export { SIMEXMAFIA_SELLER_ID }

export const mockSellers = MARKETPLACE_SELLERS

export const getSellerProducts = (sellerId: string) => {
  return mockProducts.filter((product) => product.seller.id === sellerId)
}

export const getSellerById = getMarketplaceSellerById
















