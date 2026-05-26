import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { finalizeProductsForStorefront } from '@/lib/promotions/finalize-products'
import {
  applyProductQueryFilters,
  parseProductQueryFromSearchParams,
} from '@/lib/products/query'
import { ensureSimexDiscordServerInCatalog } from '@/lib/products/simex-discord-server'
import {
  ensureSimexMafiaSellerInDatabase,
  linkDiscordServerProductToSimexMafia,
} from '@/lib/sellers/ensure-simexmafia-seller'
import { applySimexMafiaSellerToDiscordProducts } from '@/lib/products/simex-discord-server'
import { searchProducts } from '@/lib/search-utils'
import { filterStorefrontCatalog } from '@/lib/products/storefront-catalog'
import { enrichProductsWithStock } from '@/lib/product-keys/stock'

function buildPrismaWhere(filters: ReturnType<typeof parseProductQueryFromSearchParams>) {
  const where: Record<string, unknown> = {}

  if (filters.category) where.category = filters.category
  if (filters.platform) where.platform = filters.platform
  if (filters.inStock) where.inStock = true

  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {}
    const price = where.price as Record<string, number>
    if (filters.minPrice != null) price.gte = filters.minPrice
    if (filters.maxPrice != null) price.lte = filters.maxPrice
  }

  return where
}

function normalizeDbProducts(products: Array<Record<string, any>>) {
  return products.map((product) => {
    const avgRating =
      product.reviews?.length > 0
        ? product.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) /
          product.reviews.length
        : product.rating

    return {
      ...product,
      rating: avgRating,
      reviewCount: product.reviews?.length || product.reviewCount,
      originalPrice: product.originalPrice ?? undefined,
      reviews: undefined,
    }
  })
}

async function loadMockCatalogWithFilters(
  filters: ReturnType<typeof parseProductQueryFromSearchParams>
) {
  const { getProducts } = await import('@/data/products')
  return applyProductQueryFilters(getProducts(), filters)
}

async function fetchProducts(
  filters: ReturnType<typeof parseProductQueryFromSearchParams>
) {
  if (!process.env.DATABASE_URL || !prisma) {
    return loadMockCatalogWithFilters(filters)
  }

  try {
    await ensureSimexMafiaSellerInDatabase()
    await linkDiscordServerProductToSimexMafia()
    const where = buildPrismaWhere(filters)
    const products = await prisma.product.findMany({
      where,
      include: {
        seller: true,
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return normalizeDbProducts(products as any)
  } catch (error) {
    console.warn('Database error, using mock catalog:', error)
    return loadMockCatalogWithFilters(filters)
  }
}

// GET /api/products - Alle Produkte abrufen
export async function GET(request: NextRequest) {
  try {
    const filters = parseProductQueryFromSearchParams(request.nextUrl.searchParams)
    const { search, ...catalogFilters } = filters
    let products = await fetchProducts(catalogFilters)
    products = await ensureSimexDiscordServerInCatalog(products as any, catalogFilters)
    products = applySimexMafiaSellerToDiscordProducts(products as any)

    if (search?.trim()) {
      products = searchProducts(products as any, search.trim(), {
        minScore: 45,
        maxResults: 200,
      }) as typeof products
    }

    const storefrontProducts = filterStorefrontCatalog(products as any[])
    const withStock = await enrichProductsWithStock(storefrontProducts as any[])

    return NextResponse.json(finalizeProductsForStorefront(withStock as any))
  } catch (error: unknown) {
    console.error('Error fetching products:', error)
    try {
      const filters = parseProductQueryFromSearchParams(request.nextUrl.searchParams)
      const { search, ...catalogFilters } = filters
      let fallback = await loadMockCatalogWithFilters(catalogFilters)
      fallback = await ensureSimexDiscordServerInCatalog(fallback as any, catalogFilters)
      if (search?.trim()) {
        fallback = searchProducts(fallback as any, search.trim(), {
          minScore: 45,
          maxResults: 200,
        }) as typeof fallback
      }
      fallback = filterStorefrontCatalog(fallback as any)
      const fallbackStock = await enrichProductsWithStock(fallback as any[])
      return NextResponse.json(finalizeProductsForStorefront(fallbackStock as any))
    } catch {
      const { getProducts } = await import('@/data/products')
      const filters = parseProductQueryFromSearchParams(request.nextUrl.searchParams)
      const { search, ...catalogFilters } = filters
      let mock = applyProductQueryFilters(getProducts(), catalogFilters)
      mock = await ensureSimexDiscordServerInCatalog(mock as any, catalogFilters)
      if (search?.trim()) {
        mock = searchProducts(mock as any, search.trim(), {
          minScore: 45,
          maxResults: 200,
        }) as typeof mock
      }
      mock = filterStorefrontCatalog(mock as any)
      const mockStock = await enrichProductsWithStock(mock as any[])
      return NextResponse.json(finalizeProductsForStorefront(mockStock as any))
    }
  }
}

// POST /api/products - Neues Produkt erstellen (Admin only)
export async function POST(request: NextRequest) {
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
      sellerId,
      inStock,
    } = body

    if (!name || !description || !price || !category || !platform || !sellerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        discount: discount ? parseInt(discount) : null,
        image,
        category,
        platform,
        tags: tags || [],
        sellerId,
        inStock: inStock !== undefined ? inStock : true,
      },
      include: {
        seller: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
