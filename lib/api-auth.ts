import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin as isAdminByEmail } from '@/data/admin'

/**
 * Prüft ob ein User authentifiziert ist und gibt den User zurück
 * Liest userId aus Query-Parameter oder Request-Body
 * 
 * WICHTIG: Wenn body bereits gelesen wurde, muss es als Parameter übergeben werden
 */
export async function getAuthenticatedUser(
  request: NextRequest,
  body?: any
): Promise<{ user: any; error?: NextResponse } | null> {
  try {
    // Hole userId aus Query-Parameter oder Request-Body
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    
    const bodyUserId = body?.userId || null
    const finalUserId = userId || bodyUserId
    
    if (!finalUserId) {
      return {
        user: null,
        error: NextResponse.json({ error: 'userId is required' }, { status: 400 }),
      }
    }
    
    // Prüfe ob User in der Datenbank existiert
    if (!prisma) {
      return null
    }
    const user = await prisma.user.findUnique({
      where: { id: finalUserId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        goofyCoins: true,
        totalSpent: true,
        tier: true,
      },
    })
    
    if (!user) {
      return {
        user: null,
        error: NextResponse.json({ error: 'User not found' }, { status: 404 }),
      }
    }
    
    // Erweitere User mit E-Mail-basierter Admin-Prüfung (Fallback für Migration)
    const isAdminUser = user.isAdmin || isAdminByEmail(user.email)
    
    return { 
      user: {
        ...user,
        isAdmin: isAdminUser
      }
    }
  } catch (error: any) {
    console.error('[API Auth] Error authenticating user:', error)
    return {
      user: null,
      error: NextResponse.json({ error: 'Authentication failed' }, { status: 500 }),
    }
  }
}

/**
 * Prüft ob ein User Admin ist
 */
export async function requireAdmin(
  request: NextRequest,
  body?: any
): Promise<{ user: any; error?: NextResponse } | null> {
  const authResult = await getAuthenticatedUser(request, body)
  
  if (!authResult || authResult.error) {
    return authResult
  }
  
  if (!authResult.user.isAdmin) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
    }
  }
  
  return authResult
}

/**
 * Prüft ob ein User auf eine Ressource zugreifen darf (z.B. nur seine eigenen Bestellungen)
 */
export async function requireResourceOwnership(
  request: NextRequest,
  resourceUserId: string,
  body?: any
): Promise<{ user: any; error?: NextResponse } | null> {
  const authResult = await getAuthenticatedUser(request, body)
  
  if (!authResult || authResult.error) {
    return authResult
  }
  
  // Admins können auf alle Ressourcen zugreifen
  if (authResult.user.isAdmin) {
    return authResult
  }
  
  // Normale User können nur auf ihre eigenen Ressourcen zugreifen
  if (authResult.user.id !== resourceUserId) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Access denied. You can only access your own resources.' }, { status: 403 }),
    }
  }
  
  return authResult
}

/**
 * Prüft ob ein User auf eine Bestellung zugreifen darf
 */
export async function requireOrderAccess(
  request: NextRequest,
  orderId: string,
  body?: any
): Promise<{ user: any; order: any; error?: NextResponse } | null> {
  try {
    const authResult = await getAuthenticatedUser(request, body)
    
    if (!authResult || authResult.error) {
      return { user: null, order: null, error: authResult?.error }
    }
    
    // Hole Bestellung
    if (!prisma) {
      return {
        user: null,
        order: null,
        error: NextResponse.json({ error: 'Database not available' }, { status: 503 }),
      }
    }
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    })
    
    if (!order) {
      return {
        user: null,
        order: null,
        error: NextResponse.json({ error: 'Order not found' }, { status: 404 }),
      }
    }
    
    // Admins können auf alle Bestellungen zugreifen
    if (authResult.user.isAdmin) {
      return { user: authResult.user, order }
    }
    
    // Normale User können nur auf ihre eigenen Bestellungen zugreifen
    if (authResult.user.id !== order.userId) {
      return {
        user: null,
        order: null,
        error: NextResponse.json({ error: 'Access denied. You can only access your own orders.' }, { status: 403 }),
      }
    }
    
    return { user: authResult.user, order }
  } catch (error: any) {
    console.error('[API Auth] Error checking order access:', error)
    return {
      user: null,
      order: null,
      error: NextResponse.json({ error: 'Failed to verify access' }, { status: 500 }),
    }
  }
}

