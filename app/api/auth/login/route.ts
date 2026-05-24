import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'
import { dbUserToClientUser, publicUserSelect } from '@/lib/auth-user'
import { isAdmin as isAdminByEmail } from '@/data/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body.email as string | undefined)?.trim().toLowerCase()
    const password = body.password as string | undefined

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      )
    }

    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Datenbank nicht verfügbar. Bitte versuchen Sie es später erneut.' },
        { status: 503 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        ...publicUserSelect,
        passwordHash: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Ungültige E-Mail oder Passwort' },
        { status: 401 }
      )
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'Für dieses Konto ist noch kein Passwort hinterlegt. Bitte nutzen Sie „Passwort vergessen“ oder melden Sie sich erneut an, nachdem Sie Ihr Passwort gesetzt haben.',
          code: 'NO_PASSWORD',
        },
        { status: 403 }
      )
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { success: false, error: 'Ungültige E-Mail oder Passwort' },
        { status: 401 }
      )
    }

    const { passwordHash: _, ...safeUser } = user

    return NextResponse.json({
      success: true,
      user: dbUserToClientUser(safeUser),
      isAdmin: safeUser.isAdmin || isAdminByEmail(safeUser.email),
    })
  } catch (error) {
    console.error('[Auth Login] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    )
  }
}
