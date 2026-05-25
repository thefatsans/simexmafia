import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateEmailForRegistration } from '@/lib/email-validation'
import { issueEmailVerificationCode } from '@/lib/auth-email'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-ip'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const emailCheck = validateEmailForRegistration((body.email as string) || '')

    if (!emailCheck.valid) {
      return NextResponse.json({ success: false, error: emailCheck.error }, { status: 400 })
    }

    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Datenbank nicht verfügbar' },
        { status: 503 }
      )
    }

    const ip = getClientIp(request)
    const ipLimit = await checkRateLimit(`resend:ip:${ip}`, 10, 60 * 60 * 1000)
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Zu viele Anfragen. Bitte später erneut.' },
        { status: 429 }
      )
    }

    const emailLimit = await checkRateLimit(`resend:email:${emailCheck.email}`, 5, 60 * 60 * 1000)
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Für diese E-Mail wurden zu viele Codes angefordert.' },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: emailCheck.email },
      select: { id: true, email: true, firstName: true, emailVerified: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kein Konto mit dieser E-Mail gefunden.' },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'E-Mail ist bereits bestätigt.',
        alreadyVerified: true,
      })
    }

    const sent = await issueEmailVerificationCode(user.id, user.email, user.firstName)

    if (!sent.sent) {
      return NextResponse.json(
        { success: false, error: sent.error || 'E-Mail konnte nicht gesendet werden' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Neuer Bestätigungscode wurde gesendet.',
      ...(sent.devCode ? { devCode: sent.devCode } : {}),
    })
  } catch (error) {
    console.error('[Resend Verification] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Code konnte nicht gesendet werden' },
      { status: 500 }
    )
  }
}
