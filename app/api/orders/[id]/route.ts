import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOrderAccess } from '@/lib/api-auth'

/**
 * Fügt GoofyCoins hinzu, wenn eine Bestellung auf 'completed' gesetzt wird
 * Nur wenn wirklich bezahlt wurde (nicht bei GoofyCoins-Zahlung)
 */
async function addCoinsForCompletedOrder(order: any) {
  try {
    if (!prisma) {
      console.warn('[Orders API] Prisma not available, cannot add coins')
      return
    }

    // Prüfe ob Coins bereits hinzugefügt wurden (durch Prüfung ob CoinTransaction existiert)
    const existingTransaction = await prisma.coinTransaction.findFirst({
      where: {
        orderId: order.id,
        type: 'earned',
      },
    })

    if (existingTransaction) {
      console.log(`[Orders API] Coins already added for order ${order.id}, skipping`)
      return
    }

    // Prüfe ob wirklich bezahlt wurde
    // Bei GoofyCoins-Zahlung werden keine Coins verdient
    if (order.paymentMethod === 'goofycoins') {
      console.log(`[Orders API] Order ${order.id} paid with GoofyCoins, no coins earned`)
      return
    }

    // Prüfe ob coinsEarned vorhanden und > 0
    // Hole coinsEarned direkt aus der Datenbank, falls es nicht im order-Objekt ist
    let coinsEarned = order.coinsEarned || 0
    
    // Falls coinsEarned nicht im order-Objekt ist, hole es direkt aus der DB
    if (!coinsEarned || coinsEarned === 0) {
      try {
        const orderFromDb = await prisma.order.findUnique({
          where: { id: order.id },
          select: { coinsEarned: true },
        })
        coinsEarned = orderFromDb?.coinsEarned || 0
      } catch (error) {
        console.error(`[Orders API] Error fetching coinsEarned for order ${order.id}:`, error)
      }
    }
    
    if (coinsEarned <= 0) {
      console.log(`[Orders API] Order ${order.id} has no coinsEarned (${coinsEarned}), skipping`)
      return
    }
    
    console.log(`[Orders API] Order ${order.id} has coinsEarned: ${coinsEarned}`)

    // Hole User
    const user = await prisma.user.findUnique({
      where: { id: order.userId },
    })

    if (!user) {
      console.error(`[Orders API] User not found for order ${order.id}`)
      return
    }

    // Berechne neuen Balance
    const newBalance = user.goofyCoins + coinsEarned

    // Erstelle CoinTransaction
    await prisma.coinTransaction.create({
      data: {
        userId: user.id,
        type: 'earned',
        amount: coinsEarned,
        balance: newBalance,
        description: `Bestellung ${order.id} abgeschlossen`,
        orderId: order.id,
      },
    })

    // Aktualisiere User goofyCoins
    await prisma.user.update({
      where: { id: user.id },
      data: {
        goofyCoins: newBalance,
      },
    })

    console.log(`[Orders API] Added ${coinsEarned} GoofyCoins to user ${user.id} for completed order ${order.id}. New balance: ${newBalance}`)
  } catch (error: any) {
    console.error(`[Orders API] Error adding coins for order ${order.id}:`, error.message)
    // Fehler nicht weiterwerfen, damit Order-Update nicht fehlschlägt
  }
}

// GET /api/orders/[id] - Einzelne Bestellung abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Prüfe Authentifizierung und Zugriff
    const accessCheck = await requireOrderAccess(request, params.id)
    if (accessCheck?.error) {
      return accessCheck.error
    }
    
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }
    
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Stelle sicher, dass statusReason zurückgegeben wird
    let orderWithStatusReason: any = order
    
    // Prüfe ob statusReason bereits vorhanden ist
    if (orderWithStatusReason.statusReason === undefined) {
      // Hole statusReason mit Raw Query, falls es nicht automatisch zurückgegeben wurde
      try {
        const result = await prisma.$queryRaw<Array<{ statusReason: string | null }>>`
          SELECT "statusReason" FROM "Order" WHERE "id" = ${params.id}
        `
        if (result && result.length > 0) {
          orderWithStatusReason.statusReason = result[0].statusReason
        } else {
          orderWithStatusReason.statusReason = null
        }
      } catch (rawError: any) {
        console.warn(`[Orders API] Could not fetch statusReason for order ${params.id}:`, rawError.message)
        orderWithStatusReason.statusReason = null
      }
    }

    return NextResponse.json(orderWithStatusReason)
  } catch (error: any) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

// PATCH /api/orders/[id] - Bestellstatus aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Lese Body zuerst (kann nur einmal gelesen werden)
    const body = await request.json().catch(() => ({}))
    const { status, statusReason } = body
    
    // Prüfe Authentifizierung und Zugriff
    const accessCheck = await requireOrderAccess(request, params.id, body)
    if (accessCheck?.error) {
      return accessCheck.error
    }
    
    const { user, order: existingOrder } = accessCheck!
    
    // Nur Admins können den Status ändern
    if (!user.isAdmin) {
      return NextResponse.json({ error: 'Only admins can update order status' }, { status: 403 })
    }

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    // Hole die aktuelle Bestellung, um den aktuellen Status zu prüfen
    // Verwende $queryRaw um statusReason zu holen, falls es existiert
    let currentOrder: any = null
    try {
      // Hole zuerst nur den Status mit findUnique (sicher)
      currentOrder = await prisma.order.findUnique({
        where: { id: params.id },
        select: { status: true },
      })
      
      if (!currentOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      
      // Versuche statusReason mit Raw Query zu holen (umgeht Prisma Schema Validierung)
      try {
        const result = await prisma.$queryRaw<Array<{ statusReason: string | null }>>`
          SELECT "statusReason" FROM "Order" WHERE "id" = ${params.id}
        `
        if (result && result.length > 0) {
          currentOrder.statusReason = result[0].statusReason
        } else {
          currentOrder.statusReason = null
        }
      } catch (rawError: any) {
        // Falls Raw Query fehlschlägt, setze statusReason auf null
        console.warn('[Orders API] Could not fetch statusReason via raw query:', rawError.message)
        currentOrder.statusReason = null
      }
    } catch (error: any) {
      console.error('[Orders API] Error fetching current order:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch order',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 })
    }

    const updateData: any = { status }
    if (status === 'completed') {
      updateData.completedAt = new Date()
    }
    
    // Setze statusReason nur wenn Status failed oder cancelled ist
    // Versuche statusReason zu setzen, aber ignoriere Fehler falls Spalte noch nicht existiert
    if (status === 'failed' || status === 'cancelled') {
      // Wenn statusReason übergeben wurde, verwende ihn (auch wenn leer, dann null)
      if (statusReason !== undefined) {
        updateData.statusReason = statusReason || null
      } else if (currentOrder && (currentOrder.status === 'failed' || currentOrder.status === 'cancelled')) {
        // Wenn statusReason nicht übergeben wurde, aber Status ist bereits failed/cancelled, behalte den alten Wert
        updateData.statusReason = currentOrder.statusReason || null
      } else {
        // Neuer Status ist failed/cancelled, aber kein Grund übergeben
        updateData.statusReason = null
      }
    } else {
      // Entferne statusReason wenn Status nicht mehr failed/cancelled ist
      updateData.statusReason = null
    }
    
    console.log('[Orders API] Update data:', JSON.stringify(updateData, null, 2))
    console.log('[Orders API] Current order status:', currentOrder?.status)
    console.log('[Orders API] Received statusReason:', statusReason)

    try {
      const order = await prisma.order.update({
        where: { id: params.id },
        data: updateData,
        select: {
          id: true,
          userId: true,
          subtotal: true,
          serviceFee: true,
          discount: true,
          total: true,
          paymentMethod: true,
          status: true,
          coinsEarned: true,
          statusReason: true,
          createdAt: true,
          completedAt: true,
          updatedAt: true,
          items: {
            include: {
              product: {
                include: {
                  seller: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      // Stelle sicher, dass statusReason zurückgegeben wird
      let orderWithStatusReason: any = order
      
      // Prüfe ob statusReason bereits vorhanden ist
      if (orderWithStatusReason.statusReason === undefined) {
        // Hole statusReason mit Raw Query, falls es nicht automatisch zurückgegeben wurde
        try {
          const result = await prisma.$queryRaw<Array<{ statusReason: string | null }>>`
            SELECT "statusReason" FROM "Order" WHERE "id" = ${params.id}
          `
          if (result && result.length > 0) {
            orderWithStatusReason.statusReason = result[0].statusReason
          } else {
            orderWithStatusReason.statusReason = null
          }
        } catch (rawError: any) {
          console.warn(`[Orders API] Could not fetch statusReason for order ${params.id}:`, rawError.message)
          orderWithStatusReason.statusReason = null
        }
      }
      
      // Wenn Status auf 'completed' gesetzt wurde, füge GoofyCoins hinzu
      if (status === 'completed' && currentOrder?.status !== 'completed') {
        await addCoinsForCompletedOrder(orderWithStatusReason)
      }
      
      console.log('[Orders API] Order updated successfully, statusReason:', orderWithStatusReason.statusReason)
      return NextResponse.json(orderWithStatusReason)
    } catch (updateError: any) {
      console.error('[Orders API] Update error:', updateError.message)
      console.error('[Orders API] Error code:', updateError.code)
      
      // Falls statusReason Spalte nicht existiert, versuche Update ohne statusReason
      if (updateError.message?.includes('statusReason') || 
          updateError.message?.includes('Unknown column') ||
          updateError.message?.includes('Unknown field') ||
          updateError.code === 'P2009' ||
          updateError.code === 'P2011') {
        console.warn('[Orders API] statusReason column may not exist, trying without it')
        console.warn('[Orders API] WICHTIG: Führe diese SQL-Migration in Supabase aus:')
        console.warn('[Orders API] ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "statusReason" TEXT;')
        
        // Entferne statusReason aus updateData
        const fallbackData: any = { status }
        if (status === 'completed') {
          fallbackData.completedAt = new Date()
        }
        // Versuche Update ohne statusReason
        
        const order = await prisma.order.update({
          where: { id: params.id },
          data: fallbackData,
          select: {
            id: true,
            userId: true,
            subtotal: true,
            serviceFee: true,
            discount: true,
            total: true,
            paymentMethod: true,
            status: true,
            coinsEarned: true,
            statusReason: true,
            createdAt: true,
            completedAt: true,
            updatedAt: true,
            items: {
              include: {
                product: {
                  include: {
                    seller: true,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        })
        
        // Füge statusReason hinzu, falls es nicht automatisch zurückgegeben wurde
        let orderWithStatusReason: any = order
        if (orderWithStatusReason.statusReason === undefined) {
          try {
            const result = await prisma.$queryRaw<Array<{ statusReason: string | null }>>`
              SELECT "statusReason" FROM "Order" WHERE "id" = ${params.id}
            `
            if (result && result.length > 0) {
              orderWithStatusReason.statusReason = result[0].statusReason
            } else {
              orderWithStatusReason.statusReason = null
            }
          } catch (rawError: any) {
            orderWithStatusReason.statusReason = null
          }
        }
        
        // Wenn Status auf 'completed' gesetzt wurde, füge GoofyCoins hinzu
        if (status === 'completed' && currentOrder?.status !== 'completed') {
          await addCoinsForCompletedOrder(orderWithStatusReason)
        }
        
        return NextResponse.json(orderWithStatusReason)
      }
      throw updateError
    }
  } catch (error: any) {
    console.error('[Orders API] Error updating order:', error)
    console.error('[Orders API] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json({ 
      error: 'Failed to update order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}









