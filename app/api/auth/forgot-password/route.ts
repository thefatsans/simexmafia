import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateEmailForRegistration } from '@/lib/email-validation'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-ip'
import {
  generatePasswordResetCode,
  hashPasswordResetCode,
  passwordResetExpiresAt,
} from '@/lib/password-reset'
import { sendPasswordResetCodeEmail } from '@/lib/email-server'
import { verifyTurnstile, isTurnstileEnabled } from '@/lib/captcha'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawEmail = (body.email as string | undefined) || ''
    const captchaToken = (body.captchaToken as string | undefined) || ''

    const check = validateEmailForRegistration(rawEmail)
    if (!check.valid) {
      return NextResponse.json(
        { success: false, error: check.error || 'Ungültige E-Mail-Adresse' },
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

    if (isTurnstileEnabled()) {
      const ok = await verifyTurnstile(captchaToken, ip)
      if (!ok) {
        return NextResponse.json(
          { success: false, error: 'Captcha-Überprüfung fehlgeschlagen.' },
          { status: 400 }
        )
      }
    }

    const ipLimit = await checkRateLimit(`forgot:ip:${ip}`, 10, 60 * 60 * 1000)
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Zu viele Anfragen. Bitte später erneut.' },
        { status: 429 }
      )
    }

    const emailLimit = await checkRateLimit(`forgot:email:${check.email}`, 4, 60 * 60 * 1000)
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Zu viele Anfragen für diese E-Mail. Bitte später erneut.' },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: check.email },
      select: { id: true, email: true, firstName: true },
    })

    // Always return success to avoid email enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    const code = generatePasswordResetCode()
    const hash = hashPasswordResetCode(code)
    const expires = passwordResetExpiresAt(30)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetCodeHash: hash,
        passwordResetExpires: expires,
        passwordResetAttempts: 0,
      },
    })

    try {
      await sendPasswordResetCodeEmail(user.email, user.firstName || '', code)
    } catch (err) {
      console.error('[Forgot Password] Mail send failed:', err)
    }

    return NextResponse.json({
      success: true,
      devCode: process.env.NODE_ENV !== 'production' ? code : undefined,
    })
  } catch (error) {
    console.error('[Forgot Password] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Anfrage fehlgeschlagen.' },
      { status: 500 }
    )
  }
}
