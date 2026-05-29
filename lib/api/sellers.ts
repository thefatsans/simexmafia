import { Seller } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export type SellerWithStats = Seller & {
  productCount: number
}

function mapSeller(data: Record<string, unknown>): SellerWithStats {
  return {
    id: data.id as string,
    name: data.name as string,
    rating: data.rating as number,
    reviewCount: data.reviewCount as number,
    verified: Boolean(data.verified),
    avatar: data.avatar as string | undefined,
    productCount: (data.productCount as number) ?? 0,
  }
}

export async function getSellersFromAPI(): Promise<SellerWithStats[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sellers`, { cache: 'no-store' })
    if (!response.ok) return []
    const data = await response.json()
    if (!Array.isArray(data)) return []
    return data.map(mapSeller)
  } catch (error) {
    console.warn('Could not load sellers:', error)
    return []
  }
}

export async function getSellerFromAPI(sellerId: string): Promise<SellerWithStats | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sellers/${encodeURIComponent(sellerId)}`, {
      cache: 'no-store',
    })
    if (!response.ok) return null
    const data = await response.json()
    if (data.error) return null
    return mapSeller(data)
  } catch (error) {
    console.warn('Could not load seller:', error)
    return null
  }
}
