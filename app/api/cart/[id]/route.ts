import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/cart/[id] - Warenkorb-Artikel aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { quantity } = body

    if (quantity === undefined) {
      return NextResponse.json({ error: 'quantity is required' }, { status: 400 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    if (quantity <= 0) {
      // Lösche Artikel wenn Menge 0 oder weniger
      await prisma.cartItem.delete({
        where: { id: params.id },
      })
      return NextResponse.json({ message: 'Item removed from cart' })
    }

    const cartItem = await prisma.cartItem.update({
      where: { id: params.id },
      data: { quantity },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
    })

    return NextResponse.json(cartItem)
  } catch (error: any) {
    console.error('Error updating cart item:', error)
    return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 })
  }
}

// DELETE /api/cart/[id] - Artikel aus Warenkorb entfernen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    await prisma.cartItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Item removed from cart' })
  } catch (error: any) {
    console.error('Error removing cart item:', error)
    return NextResponse.json({ error: 'Failed to remove cart item' }, { status: 500 })
  }
}











