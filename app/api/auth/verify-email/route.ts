import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isVerificationCodeValid } from '@/lib/verification-code'
import { dbUserToClientUser, publicUserSelect } from '@/lib/auth-user'
import { sendWelcomeEmailServer } from '@/lib/email-server'
import { validateEmailForRegistration } from '@/lib/email-validation'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-ip'
import { setSessionCookie } from '@/lib/api-session'
import { isAdmin as isAdminByEmail } from '@/data/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const emailRaw = body.email as string | undefined
    const code = (body.code as string | undefined)?.trim()

    const emailCheck = validateEmailForRegistration(emailRaw || '')
    if (!emailCheck.valid) {
      return NextResponse.json({ success: false, error: emailCheck.error }, { status: 400 })
    }

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Bestätigungscode ist erforderlich' },
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
    const rate = await checkRateLimit(`verify:ip:${ip}`, 20, 60 * 60 * 1000)
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Zu viele Versuche. Bitte später erneut.' },
        { status: 429 }
      )
    }

    const email = emailCheck.email

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        ...publicUserSelect,
        emailVerified: true,
        emailVerifyCodeHash: true,
        emailVerifyExpires: true,
        emailVerifyAttempts: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kein Konto mit dieser E-Mail gefunden.' },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      const response = NextResponse.json({
        success: true,
        user: dbUserToClientUser(user),
        alreadyVerified: true,
      })
      setSessionCookie(response, {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin || isAdminByEmail(user.email),
      })
      return response
    }

    if ((user.emailVerifyAttempts ?? 0) >= 8) {
      return NextResponse.json(
        {
          success: false,
          error: 'Zu viele falsche Codes. Bitte fordere einen neuen Code an.',
        },
        { status: 429 }
      )
    }

    const valid = isVerificationCodeValid(
      code,
      user.emailVerifyCodeHash,
      user.emailVerifyExpires
    )

    if (!valid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifyAttempts: { increment: 1 } },
      })
      return NextResponse.json(
        { success: false, error: 'Ungültiger oder abgelaufener Code.' },
        { status: 400 }
      )
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyCodeHash: null,
        emailVerifyExpires: null,
        emailVerifyAttempts: 0,
        goofyCoins: user.goofyCoins > 0 ? user.goofyCoins : 100,
      },
      select: publicUserSelect,
    })

    sendWelcomeEmailServer(updated.email, updated.firstName).catch((err) => {
      console.warn('[Verify Email] Welcome mail failed:', err)
    })

    const response = NextResponse.json({
      success: true,
      user: dbUserToClientUser(updated),
    })
    setSessionCookie(response, {
      id: updated.id,
      email: updated.email,
      isAdmin: updated.isAdmin || isAdminByEmail(updated.email),
    })
    return response
  } catch (error) {
    console.error('[Verify Email] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Bestätigung fehlgeschlagen' },
      { status: 500 }
    )
  }
}
