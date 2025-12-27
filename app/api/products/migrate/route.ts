import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError, checkDatabaseConfig } from '@/lib/api-error-handler'

// POST /api/products/migrate - Migrate products from localStorage to database
export async function POST(request: NextRequest) {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL is not configured. Please set it in .env.local' },
        { status: 500 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (e: any) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: e.message },
        { status: 400 }
      )
    }

    const { products } = body

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: 'Products must be an array' }, { status: 400 })
    }

    // Seed product IDs that already exist
    const seedProductIds = ['1', '2', '3', '4', '5', '6', '7', '8']
    
    // Filter out products that are already in the database (seed products)
    const productsToMigrate = products.filter(
      (p: any) => !seedProductIds.includes(p.id)
    )

    if (productsToMigrate.length === 0) {
      return NextResponse.json({ 
        message: 'No products to migrate (all products are already seed products)',
        migrated: 0 
      })
    }

    // Get all sellers to map seller names to IDs
    const sellers = await prisma.seller.findMany()
    const sellerMap = new Map(sellers.map(s => [s.name, s.id]))
    
    // Default seller if seller not found
    const defaultSellerId = sellers[0]?.id || 'seller1'

    const migratedProducts = []
    const errors = []

    for (const product of productsToMigrate) {
      try {
        // Check if product already exists (by name or by old ID)
        const existing = await prisma.product.findFirst({
          where: {
            OR: [
              { name: product.name },
              { id: product.id },
            ],
          },
        })

        if (existing) {
          console.log(`Product "${product.name}" already exists, skipping...`)
          continue
        }

        // Get seller ID
        const sellerId = product.seller?.id || 
                        sellerMap.get(product.seller?.name || '') || 
                        defaultSellerId

        // Create product in database
        const created = await prisma.product.create({
          data: {
            name: product.name,
            description: product.description || '',
            price: parseFloat(product.price) || 0,
            originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null,
            discount: product.discount ? parseInt(product.discount.toString()) : null,
            image: product.image || '',
            category: product.category || 'games',
            platform: product.platform || 'Steam',
            tags: product.tags || [],
            sellerId,
            inStock: product.inStock !== undefined ? product.inStock : true,
            rating: product.rating || 0,
            reviewCount: product.reviewCount || 0,
          },
          include: {
            seller: true,
          },
        })

        migratedProducts.push(created)
      } catch (error: any) {
        console.error(`Error migrating product "${product.name}":`, error)
        errors.push({
          product: product.name,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      message: `Successfully migrated ${migratedProducts.length} products`,
      migrated: migratedProducts.length,
      products: migratedProducts,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    return handleApiError(error, 'POST /api/products/migrate')
  }
}

