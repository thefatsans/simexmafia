import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

/**
 * Setzt ein neues Passwort für ein bestehendes Konto (Passwort vergessen).
 * In Produktion sollte dies per E-Mail-Link abgesichert werden.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body.email as string | undefined)?.trim().toLowerCase()
    const password = body.password as string | undefined

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'E-Mail ist erforderlich' },
        { status: 400 }
      )
    }

    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Datenbank nicht verfügbar' },
        { status: 503 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    // Immer Erfolg melden (kein Enumeration von E-Mail-Adressen)
    if (!user) {
      return NextResponse.json({ success: true })
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Passwort muss mindestens 6 Zeichen lang sein' },
          { status: 400 }
        )
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(password) },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Auth Reset Password] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Passwort konnte nicht zurückgesetzt werden' },
      { status: 500 }
    )
  }
}
