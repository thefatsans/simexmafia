import { sendEmailViaResend } from '@/lib/resend-mail'
import { getSiteUrl, sitePath } from '@/lib/site-url'
import { SUPPORT_EMAIL } from '@/lib/company-info'

export async function sendVerificationCodeEmail(
  email: string,
  firstName: string,
  code: string
) {
  const siteUrl = getSiteUrl()
  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">E-Mail bestätigen</h1>
        </div>
        <div style="background: #f9f9f9; padding: 28px; border-radius: 0 0 10px 10px;">
          <p>Hallo ${firstName},</p>
          <p>dein Bestätigungscode für SimexMafia lautet:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; color: #667eea; margin: 24px 0;">${code}</p>
          <p>Der Code ist <strong>15 Minuten</strong> gültig. Gib ihn auf der Website ein, um dein Konto zu aktivieren.</p>
          <p style="text-align: center; margin: 28px 0;">
            <a href="${sitePath('/auth/verify')}?email=${encodeURIComponent(email)}"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Code eingeben
            </a>
          </p>
          <p style="font-size: 14px; color: #666;">Wenn du dich nicht registriert hast, ignoriere diese E-Mail.</p>
          <p style="font-size: 14px; color: #666;">Fragen: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
        </div>
        <p style="text-align: center; font-size: 12px; color: #999;"><a href="${siteUrl}">${siteUrl}</a></p>
      </body>
    </html>
  `

  return sendEmailViaResend({
    to: email,
    subject: `${code} – Dein SimexMafia Bestätigungscode`,
    html,
  })
}

export async function sendWelcomeEmailServer(email: string, firstName: string) {
  const siteUrl = getSiteUrl()
  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Willkommen bei SimexMafia!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 28px; border-radius: 0 0 10px 10px;">
          <p>Hallo ${firstName},</p>
          <p>deine E-Mail wurde bestätigt. Dein Konto ist jetzt aktiv — viel Spaß beim Shoppen!</p>
          <p style="text-align: center;">
            <a href="${sitePath('/account')}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Zum Konto</a>
          </p>
        </div>
        <p style="text-align: center; font-size: 12px; color: #999;"><a href="${siteUrl}">${siteUrl}</a></p>
      </body>
    </html>
  `

  return sendEmailViaResend({
    to: email,
    subject: 'Willkommen bei SimexMafia! 🎮',
    html,
  })
}

export async function sendOrderConfirmationEmailServer(
  email: string,
  firstName: string,
  orderId: string,
  orderTotal: number,
  items: Array<{ name: string; quantity: number; price: number }>
) {
  const itemsHtml = items
    .map(
      (item) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #ddd">${item.name}</td>` +
        `<td style="padding:8px;text-align:center">${item.quantity}</td>` +
        `<td style="padding:8px;text-align:right">€${item.price.toFixed(2)}</td></tr>`
    )
    .join('')

  const html = `
    <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#667eea">Bestellbestätigung #${orderId}</h2>
      <p>Hallo ${firstName}, vielen Dank für deine Bestellung.</p>
      <table style="width:100%;border-collapse:collapse">${itemsHtml}
        <tr><td colspan="2" style="padding:8px;text-align:right;font-weight:bold">Gesamt</td>
        <td style="padding:8px;text-align:right;font-weight:bold">€${orderTotal.toFixed(2)}</td></tr>
      </table>
      <p><a href="${sitePath('/account/orders')}">Bestellungen anzeigen</a></p>
    </body></html>
  `

  return sendEmailViaResend({
    to: email,
    subject: `Bestellbestätigung – #${orderId}`,
    html,
  })
}
