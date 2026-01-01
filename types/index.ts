export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  discount?: number
  image: string
  category: Category
  platform: Platform
  seller: Seller
  rating: number
  reviewCount: number
  inStock: boolean
  tags: string[]
}

export interface Seller {
  id: string
  name: string
  rating: number
  reviewCount: number
  verified: boolean
  avatar?: string
}

export type Category = 
  | 'games'
  | 'gift-cards'
  | 'subscriptions'
  | 'dlc'
  | 'in-game-currency'
  | 'top-ups'

export type Platform = 
  | 'Steam'
  | 'PlayStation'
  | 'Xbox'
  | 'Nintendo'
  | 'Epic Games'
  | 'Origin'
  | 'Battle.net'
  | 'Other'

export interface CartItem {
  product: Product
  quantity: number
}















