import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/orders/[id]/items/[itemId] - OrderItem Key aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const body = await request.json()
    const { key } = body

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    // Prüfe ob OrderItem existiert und zur Order gehört
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: params.itemId,
        orderId: params.id,
      },
    })

    if (!orderItem) {
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
    }

    // Aktualisiere Key
    const updatedItem = await prisma.orderItem.update({
      where: { id: params.itemId },
      data: {
        key: key || null,
      },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
    })

    return NextResponse.json(updatedItem)
  } catch (error: any) {
    console.error('[OrderItem API] Error updating order item:', error)
    console.error('[OrderItem API] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json({ 
      error: 'Failed to update order item',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}



