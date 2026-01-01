import { Seller } from '@/types'
import { mockProducts } from './products'

export const mockSellers: Seller[] = [
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
]

export const getSellerProducts = (sellerId: string) => {
  return mockProducts.filter(product => product.seller.id === sellerId)
}

export const getSellerById = (sellerId: string) => {
  return mockSellers.find(seller => seller.id === sellerId)
}















