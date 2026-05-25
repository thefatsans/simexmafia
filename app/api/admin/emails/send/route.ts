import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-ip'
import {
  MAX_BULK_RECIPIENTS,
  normalizeRecipientList,
  sendBulkEmail,
} from '@/lib/admin-email-send'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth || auth.error) {
    return auth?.error || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ip = getClientIp(request)
  const rate = await checkRateLimit(`admin-email:ip:${ip}`, 5, 60 * 60 * 1000)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Zu viele E-Mail-Kampagnen. Bitte später erneut.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const subject = (body.subject as string | undefined)?.trim()
    const message = (body.message as string | undefined)?.trim()
    const rawRecipients = body.recipients

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Betreff und Nachricht sind erforderlich' },
        { status: 400 }
      )
    }

    const recipients = normalizeRecipientList(rawRecipients)
    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Keine gültigen E-Mail-Adressen' },
        { status: 400 }
      )
    }

    if (recipients.length > MAX_BULK_RECIPIENTS) {
      return NextResponse.json(
        {
          error: `Maximal ${MAX_BULK_RECIPIENTS} Empfänger pro Sendung. Bitte in kleineren Gruppen senden.`,
        },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY ist nicht gesetzt' },
        { status: 503 }
      )
    }

    const result = await sendBulkEmail({ subject, message, recipients })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Admin Email Send] Error:', error)
    return NextResponse.json({ error: 'E-Mail-Versand fehlgeschlagen' }, { status: 500 })
  }
}
