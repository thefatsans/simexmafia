import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { invalidateStorefrontCache } from '@/lib/products/storefront-cache'
import { loadStorefrontProduct } from '@/lib/products/load-storefront-product'

const PRODUCT_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
}

// GET /api/products/[id] - Einzelnes Storefront-Produkt
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await loadStorefrontProduct(params.id)

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product, { headers: PRODUCT_CACHE_HEADERS })
  } catch (error: unknown) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

// PUT /api/products/[id] - Produkt aktualisieren (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      price,
      originalPrice,
      discount,
      image,
      category,
      platform,
      tags,
      inStock,
    } = body

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(originalPrice !== undefined && {
          originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        }),
        ...(discount !== undefined && { discount: discount ? parseInt(discount) : null }),
        ...(image && { image }),
        ...(category && { category }),
        ...(platform && { platform }),
        ...(tags && { tags }),
        ...(inStock !== undefined && { inStock }),
      },
      include: {
        seller: true,
      },
    })

    invalidateStorefrontCache(params.id)

    return NextResponse.json(product)
  } catch (error: unknown) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE /api/products/[id] - Produkt löschen (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    await prisma.product.delete({
      where: { id: params.id },
    })

    invalidateStorefrontCache(params.id)

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error: unknown) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
