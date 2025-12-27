import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/users?email=xxx oder /api/users?id=xxx - User abrufen
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    const id = searchParams.get('id')

    if (!email && !id) {
      return NextResponse.json({ error: 'email or id is required' }, { status: 400 })
    }

    const where = email ? { email } : (id ? { id } : null)

    if (!where) {
      return NextResponse.json({ error: 'email or id is required' }, { status: 400 })
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

    return NextResponse.json(user)
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

    // Prüfe ob User bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }

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

    const updateData: any = {}
    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (avatar !== undefined) updateData.avatar = avatar
    if (goofyCoins !== undefined) updateData.goofyCoins = parseInt(goofyCoins)
    if (totalSpent !== undefined) updateData.totalSpent = parseFloat(totalSpent)
    if (tier) updateData.tier = tier

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


