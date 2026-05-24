import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { finalizeProductsForStorefront } from '@/lib/promotions/finalize-products'
import { loadGeneratedProductsCatalog } from '@/lib/products/format-generated'
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

async function loadCatalogWithFilters(
  filters: ReturnType<typeof parseProductQueryFromSearchParams>
) {
  const generated = await loadGeneratedProductsCatalog()
  return applyProductQueryFilters(generated as any, filters)
}

async function fetchProducts(
  filters: ReturnType<typeof parseProductQueryFromSearchParams>
) {
  if (!process.env.DATABASE_URL || !prisma) {
    return loadCatalogWithFilters(filters)
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

    if (products.length === 0) {
      return loadCatalogWithFilters(filters)
    }

    return normalizeDbProducts(products as any)
  } catch (error) {
    console.warn('Database error, using generated catalog:', error)
    return loadCatalogWithFilters(filters)
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

    return NextResponse.json(finalizeProductsForStorefront(products as any))
  } catch (error: unknown) {
    console.error('Error fetching products:', error)
    try {
      const filters = parseProductQueryFromSearchParams(request.nextUrl.searchParams)
      const { search, ...catalogFilters } = filters
      let fallback = await loadCatalogWithFilters(catalogFilters)
      fallback = await ensureSimexDiscordServerInCatalog(fallback as any, catalogFilters)
      if (search?.trim()) {
        fallback = searchProducts(fallback as any, search.trim(), {
          minScore: 45,
          maxResults: 200,
        }) as typeof fallback
      }
      return NextResponse.json(finalizeProductsForStorefront(fallback as any))
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
      return NextResponse.json(finalizeProductsForStorefront(mock as any))
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
