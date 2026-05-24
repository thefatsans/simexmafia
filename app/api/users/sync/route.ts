import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureUserInDatabase } from '@/lib/user-sync'

/**
 * POST /api/users/sync - Ensures a localStorage user exists in the database
 */
export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const body = await request.json()
    const { userId, email, firstName, lastName, goofyCoins, avatar, passwordHash } = body

    if (!userId || !email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'userId, email, firstName and lastName are required' },
        { status: 400 }
      )
    }

    const user = await ensureUserInDatabase({
      userId,
      email,
      firstName,
      lastName,
      goofyCoins,
      avatar,
    })

    if (!user) {
      return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 })
    }

    // Legacy: Passwort aus localStorage in DB übernehmen, falls noch keines gesetzt
    if (passwordHash && prisma) {
      const existing = await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
      })
      if (existing && !existing.passwordHash) {
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
        })
      }
    }

    return NextResponse.json(user)
  } catch (error: unknown) {
    console.error('[Users Sync API] Error:', error)
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 })
  }
}
