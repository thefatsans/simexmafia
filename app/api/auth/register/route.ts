import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { dbUserToClientUser, publicUserSelect } from '@/lib/auth-user'
import { isAdmin as isAdminByEmail } from '@/data/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body.email as string | undefined)?.trim().toLowerCase()
    const password = body.password as string | undefined
    const firstName = (body.firstName as string | undefined)?.trim()
    const lastName = (body.lastName as string | undefined)?.trim()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'Bitte füllen Sie alle Felder aus' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Passwort muss mindestens 6 Zeichen lang sein' },
        { status: 400 }
      )
    }

    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Datenbank nicht verfügbar. Bitte versuchen Sie es später erneut.' },
        { status: 503 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Diese E-Mail ist bereits registriert. Bitte melden Sie sich an.',
        },
        { status: 409 }
      )
    }

    const isAdmin = isAdminByEmail(email)
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash: hashPassword(password),
        goofyCoins: 100,
        totalSpent: 0,
        tier: 'Bronze',
        isAdmin,
      },
      select: publicUserSelect,
    })

    return NextResponse.json(
      {
        success: true,
        user: dbUserToClientUser(user),
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Diese E-Mail ist bereits registriert. Bitte melden Sie sich an.',
        },
        { status: 409 }
      )
    }

    console.error('[Auth Register] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    )
  }
}
