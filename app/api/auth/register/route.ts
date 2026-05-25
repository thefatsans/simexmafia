import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, isDatabaseConnectionError } from '@/lib/password'
import { isAdmin as isAdminByEmail } from '@/data/admin'
import { validateEmailForRegistration } from '@/lib/email-validation'
import { issueEmailVerificationCode } from '@/lib/auth-email'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-ip'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const emailCheck = validateEmailForRegistration((body.email as string) || '')
    const password = body.password as string | undefined
    const firstName = (body.firstName as string | undefined)?.trim()
    const lastName = (body.lastName as string | undefined)?.trim()

    if (!emailCheck.valid) {
      return NextResponse.json({ success: false, error: emailCheck.error }, { status: 400 })
    }

    if (!password || !firstName || !lastName) {
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
        {
          success: false,
          error: 'Datenbank nicht verfügbar. Bitte versuchen Sie es später erneut.',
          code: 'DB_UNAVAILABLE',
        },
        { status: 503 }
      )
    }

    const ip = getClientIp(request)
    const ipLimit = await checkRateLimit(`register:ip:${ip}`, 5, 60 * 60 * 1000)
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Zu viele Registrierungen von dieser Verbindung. Bitte später erneut.',
        },
        { status: 429 }
      )
    }

    const email = emailCheck.email

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        passwordHash: true,
        emailVerified: true,
      },
    })

    if (existingUser?.passwordHash && existingUser.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Diese E-Mail ist bereits registriert. Bitte melden Sie sich an.',
        },
        { status: 409 }
      )
    }

    const isAdmin = isAdminByEmail(email)
    const passwordHash = hashPassword(password)

    let userId: string
    let displayName: string

    if (existingUser) {
      await prisma.user.update({
        where: { email },
        data: {
          firstName,
          lastName,
          passwordHash,
          emailVerified: false,
          goofyCoins: 0,
        },
      })
      userId = existingUser.id
      displayName = firstName
    } else {
      const created = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash,
          goofyCoins: 0,
          totalSpent: 0,
          tier: 'Bronze',
          isAdmin,
          emailVerified: false,
        },
        select: { id: true, firstName: true },
      })
      userId = created.id
      displayName = created.firstName
    }

    const mail = await issueEmailVerificationCode(userId, email, displayName)

    if (!mail.sent) {
      return NextResponse.json(
        {
          success: false,
          error:
            mail.error ||
            'Konto angelegt, aber Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte RESEND_API_KEY prüfen.',
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        needsVerification: true,
        email,
        message: 'Bestätigungscode wurde an deine E-Mail gesendet.',
        ...(mail.devCode ? { devCode: mail.devCode } : {}),
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

    if (isDatabaseConnectionError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datenbank nicht verfügbar. Bitte versuchen Sie es später erneut.',
          code: 'DB_UNAVAILABLE',
        },
        { status: 503 }
      )
    }

    console.error('[Auth Register] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    )
  }
}
