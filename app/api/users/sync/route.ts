import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureUserInDatabase } from '@/lib/user-sync'
import { requireSecureSession } from '@/lib/api-auth'

/**
 * POST /api/users/sync - Ensures a session user exists in the database
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSecureSession(request)
    if (!authResult || authResult.error) {
      return authResult?.error || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const body = await request.json()
    const { userId, email, firstName, lastName, avatar, passwordHash } = body

    if (userId !== authResult.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
      avatar,
    })

    if (!user) {
      return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 })
    }

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
