import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-ip'
import { getSiteUrl } from '@/lib/site-url'
import { MAX_BULK_RECIPIENTS, sendBulkEmail } from '@/lib/admin-email-send'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  const ip = getClientIp(request)
  const rate = await checkRateLimit(`newsletter-send:ip:${ip}`, 5, 60 * 60 * 1000)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Newsletter-Kampagnen. Bitte später erneut.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const subject = (body.subject as string | undefined)?.trim()
    const message = (body.message as string | undefined)?.trim()
    const onlyActive = body.onlyActive !== false
    const explicitRecipients = Array.isArray(body.recipients) ? (body.recipients as string[]) : null

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Betreff und Nachricht sind erforderlich' },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY ist nicht gesetzt' },
        { status: 503 }
      )
    }

    let recipients: string[]
    if (explicitRecipients && explicitRecipients.length > 0) {
      recipients = explicitRecipients
    } else {
      const subs = await prisma.newsletter.findMany({
        where: onlyActive ? { active: true } : undefined,
        select: { email: true },
      })
      recipients = subs.map((s) => s.email)
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'Keine Empfänger gefunden.' }, { status: 400 })
    }

    if (recipients.length > MAX_BULK_RECIPIENTS) {
      return NextResponse.json(
        {
          error: `Maximal ${MAX_BULK_RECIPIENTS} Empfänger pro Sendung. Bitte in kleineren Gruppen senden.`,
        },
        { status: 400 }
      )
    }

    const siteUrl = getSiteUrl()
    const unsubscribeFooter = `<p style="text-align:center;font-size:11px;color:#aaa;margin-top:16px;">Du erhältst diese Mail, weil du dich für unseren Newsletter angemeldet hast. <a href="${siteUrl}/newsletter/unsubscribe" style="color:#667eea;">Abmelden</a></p>`

    const result = await sendBulkEmail({
      subject,
      message,
      recipients,
      unsubscribeFooter,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Admin Newsletter Send]', error)
    return NextResponse.json({ error: 'Newsletter-Versand fehlgeschlagen' }, { status: 500 })
  }
}
