import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SIMEXMAFIA_SELLER_ID } from '@/lib/sellers'
import {
  ensureSimexMafiaSellerInDatabase,
  linkAllProductsToSimexMafia,
  removeNonSimexMafiaSellers,
} from '@/lib/sellers/ensure-simexmafia-seller'
import { syncSellerRatingFromReviews } from '@/lib/sellers/sync-seller-rating'
import { getStorefrontProductCountForSeller } from '@/lib/sellers/storefront-product-count'

// GET /api/sellers/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (params.id !== SIMEXMAFIA_SELLER_ID) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    await ensureSimexMafiaSellerInDatabase()
    await linkAllProductsToSimexMafia()
    await removeNonSimexMafiaSellers()
    await syncSellerRatingFromReviews(SIMEXMAFIA_SELLER_ID)

    const seller = await prisma.seller.findUnique({
      where: { id: params.id },
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const productCount = await getStorefrontProductCountForSeller(params.id)

    return NextResponse.json({
      id: seller.id,
      name: seller.name,
      rating: seller.rating,
      reviewCount: seller.reviewCount,
      verified: seller.verified,
      avatar: seller.avatar ?? undefined,
      productCount,
    })
  } catch (error: unknown) {
    console.error('Error fetching seller:', error)
    return NextResponse.json({ error: 'Failed to fetch seller' }, { status: 500 })
  }
}
