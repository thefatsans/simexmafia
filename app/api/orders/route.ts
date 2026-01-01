import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, requireAdmin } from '@/lib/api-auth'

// Prüfe ob Prisma verfügbar ist
function isPrismaAvailable(): boolean {
  try {
    return !!process.env.DATABASE_URL && prisma !== null && typeof (prisma as any).order !== 'undefined'
  } catch {
    return false
  }
}

// GET /api/orders - Bestellungen abrufen
export async function GET(request: NextRequest) {
  try {
    console.log('[Orders API] DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('[Orders API] Prisma client exists:', prisma !== null)
    
    if (!isPrismaAvailable()) {
      console.warn('[Orders API] Prisma not available, returning empty array')
      console.warn('[Orders API] DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
      return NextResponse.json([])
    }

    const searchParams = request.nextUrl.searchParams
    const requestedUserId = searchParams.get('userId')
    const status = searchParams.get('status')

    // Prüfe Authentifizierung
    const authResult = await getAuthenticatedUser(request)
    if (authResult?.error) {
      return authResult.error
    }
    
    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const { user } = authResult
    
    // Normale User können nur ihre eigenen Bestellungen abrufen
    // Admins können alle Bestellungen abrufen
    const where: any = {}
    if (user.isAdmin) {
      // Admin kann alle Bestellungen sehen, oder nach userId filtern
      if (requestedUserId) {
        where.userId = requestedUserId
      }
    } else {
      // Normale User können nur ihre eigenen Bestellungen sehen
      where.userId = user.id
    }
    
    if (status) where.status = status

    console.log('[Orders API] Fetching orders with params:', { requestedUserId, status, where })

    if (!prisma) {
      console.error('[Orders API] Prisma client is null!')
      return NextResponse.json([])
    }

    console.log('[Orders API] Attempting to query database...')
    const orders = await prisma.order.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`[Orders API] Found ${orders.length} orders`)
    
    // Füge statusReason zu jedem Order hinzu, falls es nicht automatisch zurückgegeben wurde
    const ordersWithStatusReason = await Promise.all(orders.map(async (order: any) => {
      // Prüfe ob statusReason bereits vorhanden ist
      if (order.statusReason !== undefined) {
        return order
      }
      
      // Hole statusReason mit Raw Query, falls es nicht automatisch zurückgegeben wurde
      try {
        if (!prisma) {
          order.statusReason = null
        } else {
          const result = await prisma.$queryRaw<Array<{ statusReason: string | null }>>`
            SELECT "statusReason" FROM "Order" WHERE "id" = ${order.id}
          `
          if (result && result.length > 0) {
            order.statusReason = result[0].statusReason
          } else {
            order.statusReason = null
          }
        }
      } catch (rawError: any) {
        console.warn(`[Orders API] Could not fetch statusReason for order ${order.id}:`, rawError.message)
        order.statusReason = null
      }
      
      return order
    }))
    
    console.log(`[Orders API] Returning ${ordersWithStatusReason.length} orders with statusReason`)
    return NextResponse.json(ordersWithStatusReason)
  } catch (error: any) {
    console.error('[Orders API] Error fetching orders:', error)
    console.error('[Orders API] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack?.substring(0, 500),
    })
    console.error('[Orders API] DATABASE_URL:', process.env.DATABASE_URL ? 'SET (length: ' + process.env.DATABASE_URL.length + ')' : 'NOT SET')
    
    // Wenn es ein Verbindungsfehler ist, gebe einen 503 zurück
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database')) {
      return NextResponse.json({ 
        error: 'Database connection error',
        message: 'Please check DATABASE_URL and database server status'
      }, { status: 503 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch orders',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// POST /api/orders - Neue Bestellung erstellen
export async function POST(request: NextRequest) {
  try {
    if (!isPrismaAvailable()) {
      console.warn('[Orders API] Prisma not available, cannot create order in database')
      return NextResponse.json({ 
        error: 'Database not available',
        message: 'Order will be saved to localStorage only'
      }, { status: 503 })
    }

    const body = await request.json()
    const {
      userId,
      items,
      subtotal,
      serviceFee,
      discount,
      total,
      paymentMethod,
      coinsEarned,
      discountCode,
    } = body

    // Validierung
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Prüfe Authentifizierung
    const authResult = await getAuthenticatedUser(request, body)
    if (authResult?.error) {
      return authResult.error
    }
    
    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const { user: authenticatedUser } = authResult
    
    // User kann nur Bestellungen für sich selbst erstellen
    // (Admins können auch für andere User erstellen, aber das sollte normalerweise nicht nötig sein)
    if (authenticatedUser.id !== userId && !authenticatedUser.isAdmin) {
      return NextResponse.json({ error: 'You can only create orders for yourself' }, { status: 403 })
    }

    if (!prisma) {
      return NextResponse.json({ 
        error: 'Database not available',
        message: 'Order will be saved to localStorage only'
      }, { status: 503 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const db = prisma

    // Prüfe ob User existiert, falls nicht erstelle einen
    let dbUser
    try {
      console.log('[Orders API] Checking if user exists:', userId)
      dbUser = await db.user.findUnique({ where: { id: userId } })
      console.log('[Orders API] User found:', !!dbUser)
    } catch (error: any) {
      console.error('[Orders API] Error checking user:', error)
      console.error('[Orders API] Error code:', error.code)
      console.error('[Orders API] Error message:', error.message)
      
      // Wenn der Fehler ein Verbindungsfehler ist, geben wir einen 503 zurück
      if (error.code === 'P1001' || error.message?.includes('Can\'t reach database') || error.message?.includes('invocation') || error.message?.includes('PrismaClient')) {
        return NextResponse.json({ 
          error: 'Database connection error',
          message: 'Please check DATABASE_URL and database server status',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 503 })
      }
      throw error
    }
    if (!dbUser) {
      console.log(`[Orders API] User ${userId} not found, creating...`)
      // Erstelle einen minimalen User (wird später durch Auth aktualisiert)
      dbUser = await db.user.create({
        data: {
          id: userId,
          email: `user-${userId}@example.com`,
          firstName: 'User',
          lastName: userId,
          goofyCoins: 0,
          totalSpent: 0,
        },
      })
    }

    // Erstelle OrderItems - prüfe ob Produkte existieren und validiere Preise
    const orderItemsData = await Promise.all(
      items.map(async (item: any) => {
        const productId = item.productId || item.id
        
        // Prüfe ob Produkt existiert
        let product = await db.product.findUnique({ where: { id: productId } })
        
        if (!product) {
          console.log(`[Orders API] Product ${productId} not found, creating placeholder...`)
          // Erstelle einen Platzhalter-Produkt (wird später durch Admin aktualisiert)
          // Wir brauchen einen Seller
          let seller = await db.seller.findFirst()
          if (!seller) {
            seller = await db.seller.create({
              data: {
                id: 'default-seller',
                name: 'Default Seller',
                rating: 0,
                reviewCount: 0,
                verified: false,
              },
            })
          }
          
          product = await db.product.create({
            data: {
              id: productId,
              name: item.name || 'Unknown Product',
              description: item.metadata?.productName || item.name || 'Product description',
              price: parseFloat(item.price || 0),
              originalPrice: item.metadata?.originalPrice ? parseFloat(item.metadata.originalPrice) : null,
              discount: item.metadata?.discount ? parseInt(item.metadata.discount) : null,
              image: item.metadata?.image || '/no-img.png',
              category: item.metadata?.category || 'games',
              platform: item.metadata?.platform || 'Other',
              rating: 0,
              reviewCount: 0,
              inStock: true,
              tags: item.metadata?.tags || [],
              sellerId: seller.id,
            },
          })
        }

        // WICHTIG: Serverseitige Preisvalidierung
        // Verwende immer den Datenbank-Preis, nicht den Client-Preis
        const clientPrice = parseFloat(item.price || 0)
        const dbPrice = parseFloat(product.price.toString())
        
        // Erlaube kleine Abweichungen (z.B. durch Rundung), aber nicht mehr als 1%
        const priceDifference = Math.abs(clientPrice - dbPrice)
        const maxDifference = dbPrice * 0.01 // 1% Toleranz
        
        if (priceDifference > maxDifference && priceDifference > 0.01) {
          console.warn(`[Orders API] Price mismatch for product ${productId}: client=${clientPrice}, db=${dbPrice}`)
          // Verwende Datenbank-Preis für Sicherheit
        }

        return {
          productId: product.id,
          type: item.type || 'product',
          name: product.name, // Verwende Datenbank-Name
          price: dbPrice, // WICHTIG: Verwende Datenbank-Preis, nicht Client-Preis
          quantity: parseInt(item.quantity || 1),
          metadata: item.metadata || null,
        }
      })
    )

    // WICHTIG: Berechne Total serverseitig neu mit validierten Preisen
    const validatedSubtotal = orderItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const validatedServiceFee = parseFloat(serviceFee || 0.99)
    const validatedDiscount = parseFloat(discount || 0)
    const validatedTotal = validatedSubtotal + validatedServiceFee - validatedDiscount

    // Prüfe ob berechneter Total mit Client-Total übereinstimmt (mit Toleranz)
    const clientTotal = parseFloat(total)
    const totalDifference = Math.abs(validatedTotal - clientTotal)
    if (totalDifference > 0.01) {
      console.warn(`[Orders API] Total mismatch: client=${clientTotal}, validated=${validatedTotal}`)
      // Verwende validierten Total
    }

    // WICHTIG: Für GoofyCoins-Zahlung: Validiere Balance serverseitig (aber ziehe erst nach Order-Erstellung ab)
    let requiredCoins = 0
    if (paymentMethod === 'goofycoins') {
      requiredCoins = Math.ceil(validatedTotal * 100) // 1 EUR = 100 Coins
      
      if (dbUser.goofyCoins < requiredCoins) {
        return NextResponse.json(
          { error: 'Insufficient GoofyCoins', currentBalance: dbUser.goofyCoins, required: requiredCoins },
          { status: 400 }
        )
      }
    }

    // Erstelle Bestellung mit Items (verwende validierte Werte)
    const order = await prisma.order.create({
      data: {
        userId,
        subtotal: validatedSubtotal,
        serviceFee: validatedServiceFee,
        discount: validatedDiscount,
        total: validatedTotal, // Verwende validierten Total
        paymentMethod: paymentMethod || 'paypal',
        coinsEarned: coinsEarned ? parseInt(coinsEarned) : 0,
        discountCode: discountCode || null,
        status: 'pending',
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: true,
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

    // Update User: GoofyCoins und totalSpent
    if (coinsEarned > 0) {
      await db.user.update({
        where: { id: userId },
        data: {
          goofyCoins: {
            increment: coinsEarned,
          },
          totalSpent: {
            increment: parseFloat(total),
          },
        },
      })

      // Erstelle Coin Transaction
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user) {
        await db.coinTransaction.create({
          data: {
            userId,
            type: 'earned',
            amount: coinsEarned,
            balance: user.goofyCoins + coinsEarned,
            description: `Earned from order ${order.id}`,
            orderId: order.id,
          },
        })
      }
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('[Orders API] Error creating order:', error)
    console.error('[Orders API] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    })
    return NextResponse.json({ 
      error: 'Failed to create order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}








