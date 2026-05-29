import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { invalidateStorefrontCache } from '@/lib/products/storefront-cache'
import { finalizeProductsForStorefront } from '@/lib/promotions/finalize-products'
import {
  applyProductQueryFilters,
  parseProductQueryFromSearchParams,
} from '@/lib/products/query'
import { searchProducts } from '@/lib/search-utils'
import { fetchStorefrontProductsFromDatabase } from '@/lib/products/fetch-storefront'
import { getStorefrontFallbackCatalog } from '@/lib/products/storefront-seeds'

const STOREFRONT_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
}

// GET /api/products - Storefront-Produkte (PSN, Roblox, Discord)
export async function GET(request: NextRequest) {
  try {
    const filters = parseProductQueryFromSearchParams(request.nextUrl.searchParams)
    const { search, ...catalogFilters } = filters

    let products = await fetchStorefrontProductsFromDatabase()
    products = applyProductQueryFilters(products as any, catalogFilters) as typeof products

    if (search?.trim()) {
      products = searchProducts(products as any, search.trim(), {
        minScore: 45,
        maxResults: 50,
      }) as any[]
    }

    return NextResponse.json(finalizeProductsForStorefront(products as any), {
      headers: STOREFRONT_CACHE_HEADERS,
    })
  } catch (error: unknown) {
    console.error('Error fetching products:', error)
    try {
      const filters = parseProductQueryFromSearchParams(request.nextUrl.searchParams)
      const { search, ...catalogFilters } = filters
      let fallback = applyProductQueryFilters(getStorefrontFallbackCatalog(), catalogFilters)
      if (search?.trim()) {
        fallback = searchProducts(fallback as any, search.trim(), {
          minScore: 45,
          maxResults: 50,
        }) as typeof fallback
      }
      return NextResponse.json(finalizeProductsForStorefront(fallback as any), {
        headers: STOREFRONT_CACHE_HEADERS,
      })
    } catch {
      return NextResponse.json([], { headers: STOREFRONT_CACHE_HEADERS })
    }
  }
}

// POST /api/products - Neues Produkt erstellen (Admin only)
export async function POST(request: NextRequest) {
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

    invalidateStorefrontCache()

    return NextResponse.json(product, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
