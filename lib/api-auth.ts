import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureUserInDatabase, type AuthUserProfile } from '@/lib/user-sync'
import { readSessionPayload } from '@/lib/api-session'
import { publicUserSelect } from '@/lib/auth-user'
import { isAdmin as isAdminByEmail } from '@/data/admin'

function getProfileFromRequest(request: NextRequest, body?: any): AuthUserProfile {
  const searchParams = request.nextUrl.searchParams
  return {
    userId:
      searchParams.get('userId') ||
      searchParams.get('id') ||
      body?.userId ||
      body?.id ||
      null,
    email: searchParams.get('email') || body?.email || null,
    firstName: body?.firstName || null,
    lastName: body?.lastName || null,
    goofyCoins: body?.goofyCoins,
    avatar: body?.avatar || null,
  }
}

function isDatabaseConnectionError(error: unknown): boolean {
  const code = (error as { code?: string })?.code
  return (
    code === 'ECONNREFUSED' ||
    code === 'P1001' ||
    code === 'P1002' ||
    code === 'P1017' ||
    code === 'ETIMEDOUT'
  )
}

/**
 * Prüft ob ein User authentifiziert ist und gibt den User zurück.
 * Liest userId/id und optional email aus Query-Parameter oder Request-Body.
 * Erstellt den User in der DB, falls er nur in localStorage existiert.
 */
export async function getAuthenticatedUser(
  request: NextRequest,
  body?: any
): Promise<{ user: any; error?: NextResponse } | null> {
  try {
    const profile = getProfileFromRequest(request, body)

    if (!profile.userId && !profile.email) {
      return {
        user: null,
        error: NextResponse.json({ error: 'userId is required' }, { status: 400 }),
      }
    }

    if (!prisma) {
      return {
        user: null,
        error: NextResponse.json({ error: 'Database not available' }, { status: 503 }),
      }
    }

    const user = await ensureUserInDatabase(profile)

    if (
      profile.userId &&
      user &&
      profile.userId !== user.id &&
      profile.email &&
      profile.email.toLowerCase() === user.email.toLowerCase()
    ) {
      console.warn(
        '[API Auth] Resolved user by email; client should sync id:',
        profile.userId,
        '→',
        user.id
      )
    }

    if (!user) {
      return {
        user: null,
        error: NextResponse.json(
          {
            error:
              'User not found. Please log out and log in again to sync your account.',
          },
          { status: 404 }
        ),
      }
    }

    return { user }
  } catch (error: unknown) {
    console.error('[API Auth] Error authenticating user:', error)

    if (isDatabaseConnectionError(error)) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Database connection failed. Please try again later.' },
          { status: 503 }
        ),
      }
    }

    return {
      user: null,
      error: NextResponse.json({ error: 'Authentication failed' }, { status: 500 }),
    }
  }
}

/**
 * Verlangt ein gültiges signiertes Session-Cookie. Ignoriert userId/email aus Body/Query.
 * Nutzung für kritische Routen (Käufe, Zahlungen, Coin-Operationen).
 */
export async function requireSecureSession(
  request: NextRequest
): Promise<{ user: any; error?: NextResponse } | null> {
  try {
    const payload = readSessionPayload(request)
    if (!payload) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Authentifizierung erforderlich. Bitte erneut anmelden.', code: 'SESSION_MISSING' },
          { status: 401 }
        ),
      }
    }

    if (!prisma) {
      return {
        user: null,
        error: NextResponse.json({ error: 'Database not available' }, { status: 503 }),
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: publicUserSelect,
    })

    if (!user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Konto nicht gefunden. Bitte erneut anmelden.', code: 'SESSION_INVALID' },
          { status: 401 }
        ),
      }
    }

    return {
      user: { ...user, isAdmin: user.isAdmin || isAdminByEmail(user.email) },
    }
  } catch (error: unknown) {
    console.error('[API Auth] Secure session error:', error)
    if (isDatabaseConnectionError(error)) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Database connection failed. Please try again later.' },
          { status: 503 }
        ),
      }
    }
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
  const sessionResult = await requireSecureSession(request)
  if (sessionResult && !sessionResult.error && sessionResult.user?.isAdmin) {
    return sessionResult
  }

  // Fallback (older clients without cookie): legacy lookup
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

  if (authResult.user.isAdmin) {
    return authResult
  }

  if (authResult.user.id !== resourceUserId) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Access denied. You can only access your own resources.' },
        { status: 403 }
      ),
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

    if (authResult.user.isAdmin) {
      return { user: authResult.user, order }
    }

    if (authResult.user.id !== order.userId) {
      return {
        user: null,
        order: null,
        error: NextResponse.json(
          { error: 'Access denied. You can only access your own orders.' },
          { status: 403 }
        ),
      }
    }

    return { user: authResult.user, order }
  } catch (error: unknown) {
    console.error('[API Auth] Error checking order access:', error)
    return {
      user: null,
      order: null,
      error: NextResponse.json({ error: 'Failed to verify access' }, { status: 500 }),
    }
  }
}
