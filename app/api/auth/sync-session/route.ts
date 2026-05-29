import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setSessionCookie } from '@/lib/api-session'
import { isAdmin as isAdminByEmail } from '@/data/admin'

/** Stellt Session-Cookie für bestehende localStorage-Logins wieder her. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = (body.userId as string | undefined)?.trim()
    const email = (body.email as string | undefined)?.trim().toLowerCase()

    if (!userId || !email) {
      return NextResponse.json({ error: 'userId and email required' }, { status: 400 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        email,
      },
      select: {
        id: true,
        email: true,
        isAdmin: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = user.isAdmin || isAdminByEmail(user.email)
    const response = NextResponse.json({ success: true, isAdmin })
    setSessionCookie(response, { id: user.id, email: user.email, isAdmin })
    return response
  } catch (error) {
    console.error('[Auth sync-session] Error:', error)
    return NextResponse.json({ error: 'Failed to sync session' }, { status: 500 })
  }
}
