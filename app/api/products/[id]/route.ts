import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { finalizeProductForStorefront } from '@/lib/promotions/finalize-products'
import { loadGeneratedProductsCatalog } from '@/lib/products/format-generated'
import { ensureSimexDiscordServerInCatalog } from '@/lib/products/simex-discord-server'
import { resolveProductFromCatalog } from '@/lib/products/resolve-product'
import { resolveSeller } from '@/lib/sellers'
import { applySimexMafiaSellerToDiscordProducts } from '@/lib/products/simex-discord-server'
import {
  ensureSimexMafiaSellerInDatabase,
  linkDiscordServerProductToSimexMafia,
} from '@/lib/sellers/ensure-simexmafia-seller'
import { isProductAllowedInStorefront } from '@/lib/products/storefront-catalog'
import { enrichProductsWithStock } from '@/lib/product-keys/stock'

// GET /api/products/[id] - Einzelnes Produkt abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if DATABASE_URL is set
    if (process.env.DATABASE_URL && prisma) {
      try {
        await ensureSimexMafiaSellerInDatabase()
        await linkDiscordServerProductToSimexMafia()

        const product = await prisma.product.findUnique({
          where: { id: params.id },
          include: {
            seller: true,
            reviews: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        })

        if (product) {
          // Berechne durchschnittliche Bewertung
          const avgRating =
            product.reviews.length > 0
              ? product.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / product.reviews.length
              : product.rating

          const payload = finalizeProductForStorefront({
            ...product,
            rating: avgRating,
            reviewCount: product.reviews.length || product.reviewCount,
            originalPrice: product.originalPrice ?? undefined,
          } as any)

          const [withSeller] = applySimexMafiaSellerToDiscordProducts([payload])
          if (!isProductAllowedInStorefront(withSeller)) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
          }
          const [withStock] = await enrichProductsWithStock([withSeller])
          return NextResponse.json(withStock)
        }
      } catch (dbError) {
        console.warn('Database error, trying fallback:', dbError)
      }
    }

    try {
      const catalog = await ensureSimexDiscordServerInCatalog(await loadGeneratedProductsCatalog())
      const decodedId = decodeURIComponent(params.id)
      let foundProduct = resolveProductFromCatalog(catalog as any, decodedId) as any

      if (!foundProduct) {
        const { getProducts } = await import('@/data/products')
        foundProduct = resolveProductFromCatalog(getProducts() as any, decodedId)
      }

      if (foundProduct) {
        const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
        const correctImage = getCompleteProductImage(foundProduct.name) || foundProduct.image
        const seller = foundProduct.seller ?? resolveSeller(foundProduct.sellerId)

        const payload = finalizeProductForStorefront({
            id: foundProduct.id,
            name: foundProduct.name,
            description: foundProduct.description,
            price: foundProduct.price,
            originalPrice: foundProduct.originalPrice,
            discount: foundProduct.discount,
            image: correctImage,
            category: foundProduct.category,
            platform: foundProduct.platform,
            rating: foundProduct.rating || 0,
            reviewCount: foundProduct.reviewCount || 0,
            inStock: foundProduct.inStock,
            tags: foundProduct.tags || [],
            seller,
            reviews: [],
          } as any)

        const [withSeller] = applySimexMafiaSellerToDiscordProducts([payload])
        if (!isProductAllowedInStorefront(withSeller)) {
          return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }
        const [withStock] = await enrichProductsWithStock([withSeller])
        return NextResponse.json(withStock)
      }
    } catch (fallbackError) {
      console.warn('Fallback error:', fallbackError)
    }

    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  } catch (error: any) {
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
        ...(originalPrice !== undefined && { originalPrice: originalPrice ? parseFloat(originalPrice) : null }),
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
  } catch (error: any) {
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
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}




