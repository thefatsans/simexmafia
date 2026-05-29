import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SIMEXMAFIA_SELLER_ID } from '@/lib/sellers'
import { getStorefrontProductCountForSeller } from '@/lib/sellers/storefront-product-count'

const SELLERS_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
}

function mapSeller(
  seller: {
    id: string
    name: string
    rating: number
    reviewCount: number
    verified: boolean
    avatar: string | null
  },
  productCount: number
) {
  return {
    id: seller.id,
    name: seller.name,
    rating: seller.rating,
    reviewCount: seller.reviewCount,
    verified: seller.verified,
    avatar: seller.avatar ?? undefined,
    productCount,
  }
}

// GET /api/sellers — aktuell nur SimexMafia mit echten Review-Daten
export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json([], { headers: SELLERS_CACHE_HEADERS })
    }

    const seller = await prisma.seller.findUnique({
      where: { id: SIMEXMAFIA_SELLER_ID },
    })

    if (!seller) {
      return NextResponse.json([], { headers: SELLERS_CACHE_HEADERS })
    }

    const productCount = await getStorefrontProductCountForSeller(SIMEXMAFIA_SELLER_ID)

    return NextResponse.json([mapSeller(seller, productCount)], { headers: SELLERS_CACHE_HEADERS })
  } catch (error: unknown) {
    console.error('Error fetching sellers:', error)
    return NextResponse.json({ error: 'Failed to fetch sellers' }, { status: 500 })
  }
}
