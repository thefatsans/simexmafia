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

export async function sendPasswordResetCodeEmail(
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
        <div style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Passwort zurücksetzen</h1>
        </div>
        <div style="background: #f9f9f9; padding: 28px; border-radius: 0 0 10px 10px;">
          <p>Hallo ${firstName || 'Spieler'},</p>
          <p>du (oder jemand) hat ein neues Passwort für dein SimexMafia-Konto angefordert. Dein 6-stelliger Code lautet:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; color: #ef4444; margin: 24px 0;">${code}</p>
          <p>Der Code ist <strong>30 Minuten</strong> gültig. Gib ihn zusammen mit deinem neuen Passwort ein.</p>
          <p style="text-align: center; margin: 28px 0;">
            <a href="${sitePath('/auth/reset-password')}?email=${encodeURIComponent(email)}"
               style="background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Passwort zurücksetzen
            </a>
          </p>
          <p style="font-size: 14px; color: #666;">Wenn du das nicht warst, ignoriere diese Mail — dein Passwort bleibt unverändert.</p>
          <p style="font-size: 14px; color: #666;">Fragen: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
        </div>
        <p style="text-align: center; font-size: 12px; color: #999;"><a href="${siteUrl}">${siteUrl}</a></p>
      </body>
    </html>
  `

  return sendEmailViaResend({
    to: email,
    subject: `${code} – Passwort zurücksetzen bei SimexMafia`,
    html,
  })
}

export interface DeliveryItem {
  name: string
  quantity: number
  price: number
  key?: string | null
}

export async function sendOrderDeliveryEmailServer(
  email: string,
  firstName: string,
  orderId: string,
  items: DeliveryItem[]
) {
  const siteUrl = getSiteUrl()
  const rows = items
    .map((item) => {
      const keyHtml = item.key
        ? `<div style="background:#0f172a;border:1px solid #334155;border-radius:6px;padding:10px;margin-top:6px;color:#a5b4fc;font-family:monospace;word-break:break-all">${item.key}</div>`
        : '<div style="color:#9ca3af;font-size:12px;margin-top:6px">Wird vom Support manuell zugestellt.</div>'
      return `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #1f2937;color:#e5e7eb">
            <div style="font-weight:600">${item.name}</div>
            <div style="font-size:12px;color:#9ca3af">Menge: ${item.quantity} · €${item.price.toFixed(2)}</div>
            ${keyHtml}
          </td>
        </tr>
      `
    })
    .join('')

  const html = `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;background:#0b1020">
      <div style="background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);padding:20px;text-align:center;border-radius:10px 10px 0 0">
        <h1 style="color:white;margin:0">Deine Lieferung ist da!</h1>
      </div>
      <div style="background:#111827;padding:24px;border-radius:0 0 10px 10px;color:#e5e7eb">
        <p>Hallo ${firstName},</p>
        <p>vielen Dank für deinen Kauf bei SimexMafia. Deine Bestellung <strong>#${orderId}</strong> wurde freigeschaltet.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;background:#0f172a;border-radius:8px;overflow:hidden">
          ${rows}
        </table>
        <p style="margin-top:18px">Alle Keys/Invites findest du jederzeit in deinem Konto unter „Meine Bestellungen“.</p>
        <p style="text-align:center;margin-top:20px">
          <a href="${sitePath('/account/orders')}" style="background:#7c3aed;color:white;padding:12px 22px;text-decoration:none;border-radius:6px;font-weight:bold">Bestellungen ansehen</a>
        </p>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px">Fragen? <a href="mailto:${SUPPORT_EMAIL}" style="color:#a5b4fc">${SUPPORT_EMAIL}</a></p>
      </div>
      <p style="text-align:center;font-size:11px;color:#6b7280;margin-top:12px"><a href="${siteUrl}" style="color:#a5b4fc">${siteUrl}</a></p>
    </body></html>
  `

  return sendEmailViaResend({
    to: email,
    subject: `🎉 Lieferung – Bestellung #${orderId}`,
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
