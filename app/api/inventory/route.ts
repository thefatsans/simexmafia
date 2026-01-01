import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, requireResourceOwnership } from '@/lib/api-auth'

// Prüfe ob Prisma verfügbar ist
function isPrismaAvailable(): boolean {
  try {
    return !!process.env.DATABASE_URL && prisma !== null && typeof (prisma as any).inventoryItem !== 'undefined'
  } catch {
    return false
  }
}

// GET - Hole alle Inventar-Items für einen User
export async function GET(request: NextRequest) {
  try {
    if (!isPrismaAvailable()) {
      console.warn('[Inventory API] Prisma not available, returning empty array')
      return NextResponse.json([])
    }

    const searchParams = request.nextUrl.searchParams
    const requestedUserId = searchParams.get('userId')

    if (!requestedUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }
    
    // Prüfe Authentifizierung und Zugriff
    const authResult = await requireResourceOwnership(request, requestedUserId)
    if (authResult?.error) {
      return authResult.error
    }
    
    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { userId: requestedUserId },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(inventoryItems)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

// POST - Füge ein neues Inventar-Item hinzu
export async function POST(request: NextRequest) {
  try {
    if (!isPrismaAvailable()) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { productId, source, orderId, sourceId, notes, userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }
    
    // Prüfe Authentifizierung und Zugriff
    const authResult = await requireResourceOwnership(request, userId, body)
    if (authResult?.error) {
      return authResult.error
    }
    
    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!productId || !source) {
      return NextResponse.json(
        { error: 'productId and source are required' },
        { status: 400 }
      )
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    // Prüfe ob Produkt existiert
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        userId,
        productId,
        source,
        orderId: orderId || null,
        sourceId: sourceId || null,
        notes: notes || null,
      },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
    })

    return NextResponse.json(inventoryItem, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    )
  }
}

// PATCH - Aktualisiere ein Inventar-Item (z.B. sourceId)
export async function PATCH(request: NextRequest) {
  try {
    if (!isPrismaAvailable()) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { itemId, sourceId, orderId, notes, userId } = body

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    // Prüfe ob Item dem User gehört
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        id: itemId,
        userId,
      },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    // Aktualisiere nur die übergebenen Felder
    const updateData: any = {}
    if (sourceId !== undefined) updateData.sourceId = sourceId
    if (orderId !== undefined) updateData.orderId = orderId
    if (notes !== undefined) updateData.notes = notes

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    )
  }
}

