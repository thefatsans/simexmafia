import { Seller } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''
const SELLERS_CACHE_MS = 120_000

let sellersListCache: { data: SellerWithStats[]; ts: number } | null = null
const sellerByIdCache = new Map<string, { data: SellerWithStats; ts: number }>()

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
  if (sellersListCache && Date.now() - sellersListCache.ts < SELLERS_CACHE_MS) {
    return sellersListCache.data
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/sellers`)
    if (!response.ok) return sellersListCache?.data ?? []
    const data = await response.json()
    if (!Array.isArray(data)) return sellersListCache?.data ?? []
    const mapped = data.map(mapSeller)
    sellersListCache = { data: mapped, ts: Date.now() }
    return mapped
  } catch (error) {
    console.warn('Could not load sellers:', error)
    return sellersListCache?.data ?? []
  }
}

export async function getSellerFromAPI(sellerId: string): Promise<SellerWithStats | null> {
  const cached = sellerByIdCache.get(sellerId)
  if (cached && Date.now() - cached.ts < SELLERS_CACHE_MS) {
    return cached.data
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/sellers/${encodeURIComponent(sellerId)}`)
    if (!response.ok) return cached?.data ?? null
    const data = await response.json()
    if (data.error) return cached?.data ?? null
    const mapped = mapSeller(data)
    sellerByIdCache.set(sellerId, { data: mapped, ts: Date.now() })
    return mapped
  } catch (error) {
    console.warn('Could not load seller:', error)
    return cached?.data ?? null
  }
}
