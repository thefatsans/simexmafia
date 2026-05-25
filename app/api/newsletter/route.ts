import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-ip'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Datenbank nicht verfügbar' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const email = (body.email as string | undefined)?.trim().toLowerCase()

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Bitte gültige E-Mail-Adresse angeben.' }, { status: 400 })
    }

    const ip = getClientIp(request)
    const rate = await checkRateLimit(`newsletter:ip:${ip}`, 10, 60 * 60 * 1000)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Zu viele Anmeldungen. Bitte später erneut versuchen.' },
        { status: 429 }
      )
    }

    const subscriber = await prisma.newsletter.upsert({
      where: { email },
      update: { active: true, unsubscribedAt: null },
      create: { email, active: true },
    })

    return NextResponse.json({
      success: true,
      subscribed: subscriber.active,
      email: subscriber.email,
    })
  } catch (error) {
    console.error('[Newsletter POST]', error)
    return NextResponse.json({ error: 'Anmeldung fehlgeschlagen' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Datenbank nicht verfügbar' }, { status: 503 })
  }

  try {
    const url = request.nextUrl
    let email = url.searchParams.get('email')?.trim().toLowerCase() || ''

    if (!email) {
      try {
        const body = await request.json()
        email = (body.email as string | undefined)?.trim().toLowerCase() || ''
      } catch {
        // ignore body parse errors
      }
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Bitte gültige E-Mail-Adresse angeben.' }, { status: 400 })
    }

    await prisma.newsletter.updateMany({
      where: { email },
      data: { active: false, unsubscribedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Newsletter DELETE]', error)
    return NextResponse.json({ error: 'Abmeldung fehlgeschlagen' }, { status: 500 })
  }
}
