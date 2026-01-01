import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, requireResourceOwnership, requireAdmin } from '@/lib/api-auth'
import { isAdmin as isAdminByEmail } from '@/data/admin'

// GET /api/users?email=xxx oder /api/users?id=xxx - User abrufen
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    const requestedId = searchParams.get('id')

    if (!email && !requestedId) {
      return NextResponse.json({ error: 'email or id is required' }, { status: 400 })
    }
    
    // Prüfe Authentifizierung
    const authResult = await getAuthenticatedUser(request)
    if (authResult?.error) {
      return authResult.error
    }
    
    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const { user: authenticatedUser } = authResult
    
    // Normale User können nur ihre eigenen Daten abrufen
    // Admins können alle User-Daten abrufen
    if (requestedId && requestedId !== authenticatedUser.id && !authenticatedUser.isAdmin) {
      return NextResponse.json({ error: 'You can only access your own user data' }, { status: 403 })
    }
    
    if (email && email !== authenticatedUser.email && !authenticatedUser.isAdmin) {
      return NextResponse.json({ error: 'You can only access your own user data' }, { status: 403 })
    }

    const where = email ? { email } : (requestedId ? { id: requestedId } : null)

    if (!where) {
      return NextResponse.json({ error: 'email or id is required' }, { status: 400 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const user = await prisma.user.findUnique({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        goofyCoins: true,
        totalSpent: true,
        tier: true,
        joinDate: true,
        avatar: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Erweitere User mit E-Mail-basierter Admin-Prüfung (Fallback für Migration)
    const isAdminUser = user.isAdmin || isAdminByEmail(user.email)
    
    // Aktualisiere isAdmin-Feld in Datenbank, falls es nicht stimmt
    if (isAdminUser !== user.isAdmin && prisma) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { isAdmin: isAdminUser },
        })
        console.log(`[Users API] Updated isAdmin for user ${user.email} to ${isAdminUser}`)
      } catch (updateError) {
        console.warn('[Users API] Failed to update isAdmin field:', updateError)
      }
    }

    return NextResponse.json({
      ...user,
      isAdmin: isAdminUser
    })
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// POST /api/users - Neuen User erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firstName, lastName, passwordHash, avatar } = body

    // Validierung
    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    // Prüfe ob User bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }

    // Prüfe ob E-Mail Admin-Rechte hat
    const isAdmin = isAdminByEmail(email)
    
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash: passwordHash || null,
        avatar: avatar || null,
        goofyCoins: 0,
        totalSpent: 0,
        tier: 'Bronze',
        isAdmin,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        goofyCoins: true,
        totalSpent: true,
        tier: true,
        joinDate: true,
        avatar: true,
        isAdmin: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

// PATCH /api/users - User aktualisieren
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, firstName, lastName, avatar, goofyCoins, totalSpent, tier } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
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
    
    // Normale User können nur ihre eigenen Daten aktualisieren (außer goofyCoins, totalSpent, tier - diese sind geschützt)
    // Admins können alle User-Daten aktualisieren
    if (id !== authenticatedUser.id && !authenticatedUser.isAdmin) {
      return NextResponse.json({ error: 'You can only update your own user data' }, { status: 403 })
    }
    
    // Nur Admins können goofyCoins, totalSpent und tier direkt ändern
    // (Diese sollten nur durch System-Operationen geändert werden)
    if ((goofyCoins !== undefined || totalSpent !== undefined || tier !== undefined) && !authenticatedUser.isAdmin) {
      return NextResponse.json({ 
        error: 'Only admins can update goofyCoins, totalSpent, or tier. These are managed by the system.' 
      }, { status: 403 })
    }

    const updateData: any = {}
    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (avatar !== undefined) updateData.avatar = avatar
    if (goofyCoins !== undefined) updateData.goofyCoins = parseInt(goofyCoins)
    if (totalSpent !== undefined) updateData.totalSpent = parseFloat(totalSpent)
    if (tier) updateData.tier = tier

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        goofyCoins: true,
        totalSpent: true,
        tier: true,
        joinDate: true,
        avatar: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}


