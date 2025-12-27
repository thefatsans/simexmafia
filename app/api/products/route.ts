import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError, checkDatabaseConfig } from '@/lib/api-error-handler'

// GET /api/products - Alle Produkte abrufen
export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set, using fallback to generated products')
      // Importiere generierte Produkte als Fallback
      const { generateProducts } = await import('@/prisma/product-data')
      const { updateProductImages } = await import('@/lib/image-updater')
      const sellerIds = ['seller1', 'seller2', 'seller3', 'seller4']
      const generatedProducts = generateProducts(sellerIds)
      
      // Konvertiere zu Product-Format
      const formattedProducts = generatedProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        discount: p.discount,
        image: p.image,
        category: p.category,
        platform: p.platform,
        rating: p.rating,
        reviewCount: p.reviewCount,
        inStock: p.inStock,
        tags: p.tags,
        seller: {
          id: p.sellerId,
          name: p.sellerId === 'seller1' ? 'GameDeals Pro' : p.sellerId === 'seller2' ? 'DigitalKeys Store' : p.sellerId === 'seller3' ? 'GiftCard Masters' : 'Subscriptions Hub',
          rating: 4.7,
          reviewCount: 2000,
          verified: true,
        },
      }))
      
      // Aktualisiere alle Bilder mit den neuesten aus complete-product-images.ts
      const productsWithUpdatedImages = updateProductImages(formattedProducts)
      
      return NextResponse.json(productsWithUpdatedImages)
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const platform = searchParams.get('platform')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const inStock = searchParams.get('inStock')
    const search = searchParams.get('search')

    const where: any = {}

    if (category) where.category = category
    if (platform) where.platform = platform
    if (inStock === 'true') where.inStock = true
    
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    if (search) {
      // Use intelligent search with multiple patterns
      const searchLower = search.toLowerCase().trim()
      const searchPatterns = [
        search, // Original search term
        searchLower, // Lowercase
        search.replace(/[^\w\s-]/g, ''), // Without special chars
        search.replace(/\s+/g, ' '), // Normalized whitespace
      ]
      
      // Remove duplicates
      const uniquePatterns = Array.from(new Set(searchPatterns))
      
      // Build OR conditions for each pattern
      where.OR = uniquePatterns.flatMap(pattern => [
        { name: { contains: pattern, mode: 'insensitive' } },
        { description: { contains: pattern, mode: 'insensitive' } },
        { tags: { has: pattern } },
        { platform: { contains: pattern, mode: 'insensitive' } },
        { category: { contains: pattern, mode: 'insensitive' } },
      ])
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        seller: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Wenn keine Produkte in der Datenbank, verwende generierte Produkte
    if (products.length === 0) {
      console.warn('No products in database, using fallback to generated products')
      const { generateProducts } = await import('@/prisma/product-data')
      const { updateProductImages } = await import('@/lib/image-updater')
      const sellerIds = ['seller1', 'seller2', 'seller3', 'seller4']
      const generatedProducts = generateProducts(sellerIds)
      
      // Konvertiere zu Product-Format
      const formattedProducts = generatedProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        discount: p.discount,
        image: p.image,
        category: p.category,
        platform: p.platform,
        rating: p.rating,
        reviewCount: p.reviewCount,
        inStock: p.inStock,
        tags: p.tags,
        seller: {
          id: p.sellerId,
          name: p.sellerId === 'seller1' ? 'GameDeals Pro' : p.sellerId === 'seller2' ? 'DigitalKeys Store' : p.sellerId === 'seller3' ? 'GiftCard Masters' : 'Subscriptions Hub',
          rating: 4.7,
          reviewCount: 2000,
          verified: true,
        },
      }))
      
      // Aktualisiere alle Bilder mit den neuesten aus complete-product-images.ts
      const productsWithUpdatedImages = updateProductImages(formattedProducts)
      
      return NextResponse.json(productsWithUpdatedImages)
    }

    // Berechne durchschnittliche Bewertung und aktualisiere Bilder
    const { updateProductImages } = await import('@/lib/image-updater')
    const productsWithRating = products.map((product) => {
      const avgRating =
        product.reviews.length > 0
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
          : product.rating

      return {
        ...product,
        rating: avgRating,
        reviewCount: product.reviews.length || product.reviewCount,
        reviews: undefined, // Entferne reviews aus der Antwort
      }
    })

    // Aktualisiere alle Bilder mit den neuesten aus complete-product-images.ts
    // Konvertiere null zu undefined für originalPrice
    const productsNormalized = productsWithRating.map((p: any) => ({
      ...p,
      originalPrice: p.originalPrice ?? undefined,
    }))
    const productsWithUpdatedImages = updateProductImages(productsNormalized as any)

    return NextResponse.json(productsWithUpdatedImages)
  } catch (error: any) {
    console.warn('Database error, using fallback to generated products:', error.message)
    // Fallback zu generierten Produkten bei Datenbankfehler
    try {
      const { generateProducts } = await import('@/prisma/product-data')
      const { updateProductImages } = await import('@/lib/image-updater')
      const sellerIds = ['seller1', 'seller2', 'seller3', 'seller4']
      const generatedProducts = generateProducts(sellerIds)
      
      // Konvertiere zu Product-Format
      const formattedProducts = generatedProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        discount: p.discount,
        image: p.image,
        category: p.category,
        platform: p.platform,
        rating: p.rating,
        reviewCount: p.reviewCount,
        inStock: p.inStock,
        tags: p.tags,
        seller: {
          id: p.sellerId,
          name: p.sellerId === 'seller1' ? 'GameDeals Pro' : p.sellerId === 'seller2' ? 'DigitalKeys Store' : p.sellerId === 'seller3' ? 'GiftCard Masters' : 'Subscriptions Hub',
          rating: 4.7,
          reviewCount: 2000,
          verified: true,
        },
      }))
      
      // Aktualisiere alle Bilder mit den neuesten aus complete-product-images.ts
      const productsWithUpdatedImages = updateProductImages(formattedProducts)
      
      return NextResponse.json(productsWithUpdatedImages)
    } catch (fallbackError) {
      // Letzter Fallback zu Mock-Daten
      const { getProducts } = await import('@/data/products')
      const mockProducts = getProducts()
      return NextResponse.json(mockProducts)
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

    // Validierung
    if (!name || !description || !price || !category || !platform || !sellerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
  } catch (error: any) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

