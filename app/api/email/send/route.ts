import { NextRequest, NextResponse } from 'next/server'
import { sendEmailViaResend } from '@/lib/resend-mail'

interface EmailRequest {
  to: string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json()

    if (!body.to || !Array.isArray(body.to) || body.to.length === 0) {
      return NextResponse.json(
        { error: 'Empfänger-E-Mail-Adresse ist erforderlich' },
        { status: 400 }
      )
    }

    if (!body.subject || !body.html) {
      return NextResponse.json(
        { error: 'Betreff und HTML-Inhalt sind erforderlich' },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[email/send] Development ohne RESEND_API_KEY:', {
          to: body.to,
          subject: body.subject,
        })
        return NextResponse.json({
          success: true,
          messageId: `dev-${Date.now()}`,
          message: 'Development-Modus: E-Mail nur in der Konsole geloggt',
          development: true,
        })
      }

      return NextResponse.json(
        {
          error:
            'E-Mail-Versand ist nicht konfiguriert. Bitte RESEND_API_KEY setzen.',
        },
        { status: 500 }
      )
    }

    const result = await sendEmailViaResend({
      to: body.to,
      subject: body.subject,
      html: body.html,
      text: body.text,
      from: body.from,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Fehler beim Senden der E-Mail' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'E-Mail erfolgreich gesendet',
    })
  } catch (error) {
    console.error('[email/send] Unexpected error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unbekannter Fehler beim Senden der E-Mail',
      },
      { status: 500 }
    )
  }
}
