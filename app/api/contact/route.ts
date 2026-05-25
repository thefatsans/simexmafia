import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTurnstile, isTurnstileEnabled } from '@/lib/captcha'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-ip'
import { sendEmailViaResend } from '@/lib/resend-mail'
import { SUPPORT_EMAIL } from '@/lib/company-info'

const VALID_CATEGORIES = new Set([
  'general',
  'order',
  'payment',
  'account',
  'product',
  'technical',
  'refund',
])

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface ContactBody {
  name?: string
  email?: string
  category?: string
  subject?: string
  message?: string
  captchaToken?: string
}

export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Datenbank nicht verfügbar' }, { status: 503 })
  }

  try {
    const body = (await request.json()) as ContactBody

    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const category = (body.category || 'general').trim()
    const subject = body.subject?.trim()
    const message = body.message?.trim()

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Bitte einen gültigen Namen angeben.' }, { status: 400 })
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Bitte eine gültige E-Mail-Adresse angeben.' }, { status: 400 })
    }
    if (!subject || subject.length < 3) {
      return NextResponse.json({ error: 'Betreff ist zu kurz.' }, { status: 400 })
    }
    if (!message || message.length < 10) {
      return NextResponse.json({ error: 'Nachricht muss mindestens 10 Zeichen lang sein.' }, { status: 400 })
    }
    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json({ error: 'Ungültige Kategorie.' }, { status: 400 })
    }

    const ip = getClientIp(request)
    const rate = await checkRateLimit(`contact:ip:${ip}`, 5, 60 * 60 * 1000)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte später erneut versuchen.' },
        { status: 429 }
      )
    }

    if (isTurnstileEnabled()) {
      const ok = await verifyTurnstile(body.captchaToken, ip)
      if (!ok) {
        return NextResponse.json({ error: 'Captcha-Verifizierung fehlgeschlagen.' }, { status: 400 })
      }
    }

    const created = await prisma.contactRequest.create({
      data: {
        name,
        email,
        category,
        subject,
        message,
        status: 'pending',
      },
    })

    const adminEmail =
      process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ||
      process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
      SUPPORT_EMAIL

    if (adminEmail) {
      const safeMessage = escapeHtml(message).replace(/\n/g, '<br>')
      const html = `<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; line-height: 1.6; color:#222;">
  <h2>Neue Kontaktanfrage</h2>
  <p><strong>Name:</strong> ${escapeHtml(name)}</p>
  <p><strong>E-Mail:</strong> ${escapeHtml(email)}</p>
  <p><strong>Kategorie:</strong> ${escapeHtml(category)}</p>
  <p><strong>Betreff:</strong> ${escapeHtml(subject)}</p>
  <hr>
  <div>${safeMessage}</div>
  <hr>
  <p style="font-size:12px;color:#888;">Anfrage-ID: ${created.id}</p>
</body></html>`

      sendEmailViaResend({
        to: adminEmail,
        subject: `[Kontakt] ${subject}`,
        html,
        text: `Name: ${name}\nE-Mail: ${email}\nKategorie: ${category}\nBetreff: ${subject}\n\n${message}\n\nID: ${created.id}`,
      }).catch((err) => {
        console.error('[Contact] Admin notification failed:', err)
      })
    }

    return NextResponse.json({ success: true, id: created.id }, { status: 201 })
  } catch (error) {
    console.error('[Contact POST]', error)
    return NextResponse.json({ error: 'Anfrage konnte nicht gespeichert werden.' }, { status: 500 })
  }
}
