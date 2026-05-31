import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dbUserToClientUser, publicUserSelect } from '@/lib/auth-user'
import { isAdmin as isAdminByEmail } from '@/data/admin'
import { setSessionCookie } from '@/lib/api-session'
import { validateEmailForRegistration } from '@/lib/email-validation'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-ip'
import { assertRegistrationAllowed } from '@/lib/security/limits'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body.email as string | undefined)?.trim().toLowerCase()
    const name = (body.name as string | undefined)?.trim() || 'User'
    const picture = body.picture as string | undefined

    const emailCheck = validateEmailForRegistration(email || '')
    if (!emailCheck.valid) {
      return NextResponse.json({ success: false, error: emailCheck.error }, { status: 400 })
    }

    const ip = getClientIp(request)
    const loginLimit = await checkRateLimit(`auth:google:ip:${ip}`, 20, 60 * 60 * 1000)
    if (!loginLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Zu viele Anmeldeversuche. Bitte später erneut versuchen.' },
        { status: 429 }
      )
    }

    const normalizedEmail = emailCheck.email

    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Datenbank nicht verfügbar' },
        { status: 503 }
      )
    }

    const nameParts = name.split(' ')
    const firstName = nameParts[0] || 'User'
    const lastName = nameParts.slice(1).join(' ') || ''

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: publicUserSelect,
    })

    if (!user) {
      const registrationLimit = await assertRegistrationAllowed(request)
      if (!registrationLimit.allowed) {
        return NextResponse.json({ success: false, error: registrationLimit.error }, { status: 429 })
      }

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          firstName,
          lastName,
          avatar: picture || null,
          goofyCoins: 100,
          totalSpent: 0,
          tier: 'Bronze',
          isAdmin: isAdminByEmail(normalizedEmail),
          emailVerified: true,
        },
        select: publicUserSelect,
      })
    } else if (!user.emailVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
        select: publicUserSelect,
      })
    } else if (picture) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatar: picture },
        select: publicUserSelect,
      })
    }

    const response = NextResponse.json({
      success: true,
      user: dbUserToClientUser(user),
    })
    setSessionCookie(response, {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin || isAdminByEmail(user.email),
    })
    return response
  } catch (error) {
    console.error('[Auth Google] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Google-Anmeldung fehlgeschlagen' },
      { status: 500 }
    )
  }
}
