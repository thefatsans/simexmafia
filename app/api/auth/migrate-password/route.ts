import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

/**
 * Sets a password for legacy accounts that were synced to the DB without a passwordHash.
 * Only works when passwordHash is still null.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body.email as string | undefined)?.trim().toLowerCase()
    const password = body.password as string | undefined

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Passwort muss mindestens 6 Zeichen lang sein' },
        { status: 400 }
      )
    }

    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 503 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Account already has a password' },
        { status: 409 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(password) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Auth Migrate Password] Error:', error)
    return NextResponse.json({ success: false, error: 'Migration failed' }, { status: 500 })
  }
}
