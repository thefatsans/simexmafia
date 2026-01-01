import { NextRequest, NextResponse } from 'next/server'

/**
 * E-Mail-Versand API-Route
 * Unterstützt Resend API oder Fallback für Development
 */

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

    // Validierung
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

    // Prüfe, ob Resend API Key vorhanden ist
    const resendApiKey = process.env.RESEND_API_KEY

    if (resendApiKey) {
      // Verwende Resend API
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: body.from || 'SimexMafia <onboarding@resend.dev>',
            to: body.to,
            subject: body.subject,
            html: body.html,
            text: body.text || body.html.replace(/<[^>]*>/g, ''),
          }),
        })

        if (!resendResponse.ok) {
          const error = await resendResponse.json()
          throw new Error(error.message || 'Fehler beim Senden über Resend')
        }

        const data = await resendResponse.json()
        return NextResponse.json({
          success: true,
          messageId: data.id,
          message: 'E-Mail erfolgreich gesendet',
        })
      } catch (resendError) {
        console.error('Resend API Error:', resendError)
        // Fallback zu Development-Modus
      }
    }

    // Development-Modus: Speichere E-Mails in localStorage (nur für Development)
    if (process.env.NODE_ENV === 'development') {
      const emailLog = {
        id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        to: body.to,
        subject: body.subject,
        html: body.html,
        text: body.text,
        from: body.from || 'SimexMafia <noreply@simexmafia.com>',
        sentAt: new Date().toISOString(),
        status: 'sent',
      }

      // In Production würde man hier eine Datenbank verwenden
      // Für Development loggen wir nur
      console.log('📧 E-Mail würde gesendet werden (Development-Modus):', {
        to: body.to,
        subject: body.subject,
        from: body.from || 'SimexMafia <noreply@simexmafia.com>',
      })

      return NextResponse.json({
        success: true,
        messageId: emailLog.id,
        message: 'E-Mail im Development-Modus gesendet (siehe Konsole)',
        development: true,
      })
    }

    // Production ohne API Key: Fehler
    return NextResponse.json(
      {
        error: 'E-Mail-Versand ist nicht konfiguriert. Bitte RESEND_API_KEY in den Environment-Variablen setzen.',
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('Error in email send route:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Senden der E-Mail',
      },
      { status: 500 }
    )
  }
}








