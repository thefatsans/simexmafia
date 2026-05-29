import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { finalizeProductForStorefront } from '@/lib/promotions/finalize-products'
import { applySimexMafiaSellerToDiscordProducts } from '@/lib/products/simex-discord-server'
import { isProductAllowedInStorefront } from '@/lib/products/storefront-catalog'
import { enrichProductsWithStock } from '@/lib/product-keys/stock'
import { fetchStorefrontProductByIdFromDatabase } from '@/lib/products/fetch-storefront'
import { getStorefrontFallbackCatalog } from '@/lib/products/storefront-seeds'
import { resolveProductFromCatalog } from '@/lib/products/resolve-product'
import { resolveSeller } from '@/lib/sellers'

const PRODUCT_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
}

// GET /api/products/[id] - Einzelnes Storefront-Produkt
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decodedId = decodeURIComponent(params.id).trim()
    let foundProduct = await fetchStorefrontProductByIdFromDatabase(decodedId)

    if (!foundProduct) {
      const catalog = getStorefrontFallbackCatalog()
      foundProduct = resolveProductFromCatalog(catalog as any, decodedId) as any
    }

    if (!foundProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
    const correctImage =
      getCompleteProductImage((foundProduct as { name: string }).name) ||
      (foundProduct as { image?: string }).image

    const seller =
      (foundProduct as { seller?: unknown }).seller ??
      resolveSeller((foundProduct as { sellerId?: string }).sellerId)

    const payload = finalizeProductForStorefront({
      ...(foundProduct as object),
      image: correctImage,
      seller,
      reviews: (foundProduct as { reviews?: unknown[] }).reviews ?? [],
    } as any)

    const [withSeller] = applySimexMafiaSellerToDiscordProducts([payload])
    if (!isProductAllowedInStorefront(withSeller)) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const [withStock] = await enrichProductsWithStock([withSeller])
    return NextResponse.json(withStock, { headers: PRODUCT_CACHE_HEADERS })
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
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error: unknown) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
