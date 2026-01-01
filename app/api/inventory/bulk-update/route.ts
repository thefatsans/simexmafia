import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireResourceOwnership } from '@/lib/api-auth'

// Prüfe ob Prisma verfügbar ist
function isPrismaAvailable(): boolean {
  try {
    return !!process.env.DATABASE_URL && prisma !== null && typeof (prisma as any).inventoryItem !== 'undefined'
  } catch {
    return false
  }
}

// PATCH - Aktualisiere mehrere Inventar-Items auf einmal (z.B. sourceId für mehrere Items)
export async function PATCH(request: NextRequest) {
  try {
    if (!isPrismaAvailable()) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { updates, userId } = body // Array von { itemId, sourceId } Objekten

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

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'updates array is required' },
        { status: 400 }
      )
    }

    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    // Prüfe ob alle Items dem User gehören
    const itemIds = updates.map((u: any) => u.itemId)
    const existingItems = await prisma.inventoryItem.findMany({
      where: {
        id: { in: itemIds },
        userId,
      },
    })

    if (existingItems.length !== itemIds.length) {
      return NextResponse.json(
        { error: 'Some inventory items not found or do not belong to user' },
        { status: 404 }
      )
    }

    // Aktualisiere alle Items (prisma ist bereits geprüft)
    const updatePromises = updates.map((update: any) => {
      if (!prisma) {
        throw new Error('Database not available')
      }
      return prisma.inventoryItem.update({
        where: { id: update.itemId },
        data: {
          sourceId: update.sourceId || null,
          orderId: update.orderId || null,
        },
      })
    })

    await Promise.all(updatePromises)

    return NextResponse.json({ success: true, updated: updates.length })
  } catch (error) {
    console.error('Error bulk updating inventory items:', error)
    return NextResponse.json(
      { error: 'Failed to bulk update inventory items' },
      { status: 500 }
    )
  }
}

