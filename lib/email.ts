/**
 * E-Mail-Versand-Funktionen
 * Unterstützt Resend API oder Fallback für Development
 */

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Sendet eine E-Mail über die API-Route
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
        from: options.from || 'SimexMafia <noreply@simexmafia.com>',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.message || 'Fehler beim Senden der E-Mail',
      }
    }

    const data = await response.json()
    return {
      success: true,
      messageId: data.messageId,
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

/**
 * Sendet eine Bestätigungsmail nach der Registrierung
 */
export async function sendWelcomeEmail(email: string, firstName: string): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Willkommen bei SimexMafia</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Willkommen bei SimexMafia!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hallo ${firstName},</p>
          <p style="font-size: 16px;">vielen Dank für deine Registrierung bei SimexMafia! Wir freuen uns, dich in unserer Community begrüßen zu dürfen.</p>
          <p style="font-size: 16px;">Dein Konto wurde erfolgreich erstellt. Du kannst jetzt:</p>
          <ul style="font-size: 16px;">
            <li>Produkte durchstöbern und kaufen</li>
            <li>GoofyCoins sammeln und einlösen</li>
            <li>Von exklusiven Angeboten profitieren</li>
            <li>Teil unserer Gaming-Community werden</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/account" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Zum Konto
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Bei Fragen stehen wir dir gerne zur Verfügung.</p>
          <p style="font-size: 14px; color: #666;">Viel Spaß beim Shoppen!<br>Dein SimexMafia Team</p>
        </div>
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
          <p>Diese E-Mail wurde an ${email} gesendet.</p>
          <p>© ${new Date().getFullYear()} SimexMafia. Alle Rechte vorbehalten.</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Willkommen bei SimexMafia! 🎮',
    html,
  })
}

/**
 * Sendet eine Bestellbestätigungsmail
 */
export async function sendOrderConfirmationEmail(
  email: string,
  firstName: string,
  orderId: string,
  orderTotal: number,
  items: Array<{ name: string; quantity: number; price: number }>
): Promise<EmailResult> {
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">€${item.price.toFixed(2)}</td>
      </tr>
    `
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bestellbestätigung</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Bestellbestätigung</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hallo ${firstName},</p>
          <p style="font-size: 16px;">vielen Dank für deine Bestellung! Deine Bestellung wurde erfolgreich erhalten.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #667eea;">Bestellnummer: ${orderId}</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Produkt</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Menge</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Preis</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr>
                  <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">Gesamt:</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">€${orderTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/account/orders" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Bestellung anzeigen
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">Deine Bestellung wird so schnell wie möglich bearbeitet.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SimexMafia. Alle Rechte vorbehalten.</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `Bestellbestätigung - Bestellung #${orderId}`,
    html,
  })
}








