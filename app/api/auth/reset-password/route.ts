import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { validateEmailForRegistration } from '@/lib/email-validation'
import { isPasswordResetCodeValid } from '@/lib/password-reset'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-ip'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawEmail = (body.email as string | undefined) || ''
    const code = (body.code as string | undefined)?.trim()
    const newPassword = (body.newPassword as string | undefined) || (body.password as string | undefined)

    const check = validateEmailForRegistration(rawEmail)
    if (!check.valid) {
      return NextResponse.json(
        { success: false, error: check.error || 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      )
    }

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Code ist erforderlich.' },
        { status: 400 }
      )
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Neues Passwort muss mindestens 6 Zeichen haben.' },
        { status: 400 }
      )
    }

    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Datenbank nicht verfügbar' },
        { status: 503 }
      )
    }

    const ip = getClientIp(request)
    const rate = await checkRateLimit(`reset:ip:${ip}`, 20, 60 * 60 * 1000)
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Zu viele Versuche. Bitte später erneut.' },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: check.email },
      select: {
        id: true,
        passwordResetCodeHash: true,
        passwordResetExpires: true,
        passwordResetAttempts: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Ungültiger oder abgelaufener Code.' },
        { status: 400 }
      )
    }

    if ((user.passwordResetAttempts ?? 0) >= 8) {
      return NextResponse.json(
        { success: false, error: 'Zu viele Fehlversuche. Bitte neuen Code anfordern.' },
        { status: 429 }
      )
    }

    const ok = isPasswordResetCodeValid(
      code,
      user.passwordResetCodeHash,
      user.passwordResetExpires
    )

    if (!ok) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetAttempts: { increment: 1 } },
      })
      return NextResponse.json(
        { success: false, error: 'Ungültiger oder abgelaufener Code.' },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(newPassword),
        passwordResetCodeHash: null,
        passwordResetExpires: null,
        passwordResetAttempts: 0,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Reset Password] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Passwort konnte nicht zurückgesetzt werden.' },
      { status: 500 }
    )
  }
}
