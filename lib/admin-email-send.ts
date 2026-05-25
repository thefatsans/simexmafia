import { sendEmailViaResend, getDefaultFromEmail } from '@/lib/resend-mail'
import { getSiteUrl } from '@/lib/site-url'

export const MAX_BULK_RECIPIENTS = 50
export const BULK_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function escapeBulkEmailHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildBulkEmailHtml(subject: string, message: string): string {
  const siteUrl = getSiteUrl()
  const safeMessage = escapeBulkEmailHtml(message).replace(/\n/g, '<br>')
  const safeSubject = escapeBulkEmailHtml(subject)

  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"><title>${safeSubject}</title></head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
      <a href="${siteUrl}" style="color: white; text-decoration: none;"><h1 style="color: white; margin: 0;">SimexMafia</h1></a>
    </div>
    <div style="background: #f9f9f9; padding: 28px; border-radius: 0 0 10px 10px;">
      <div style="font-size: 16px;">${safeMessage}</div>
    </div>
    <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
      <a href="${siteUrl}" style="color: #667eea;">${siteUrl}</a><br>
      © ${new Date().getFullYear()} SimexMafia
    </p>
  </body>
</html>`
}

export interface BulkSendOptions {
  subject: string
  message: string
  recipients: string[]
  from?: string
  unsubscribeFooter?: string
}

export interface BulkSendResult {
  success: boolean
  successCount: number
  errorCount: number
  total: number
  failures: Array<{ email: string; error: string }>
  from: string
}

export async function sendBulkEmail(options: BulkSendOptions): Promise<BulkSendResult> {
  const recipients = [
    ...new Set(
      options.recipients.map((e) => e.trim().toLowerCase()).filter((e) => BULK_EMAIL_REGEX.test(e))
    ),
  ]

  const from = options.from || getDefaultFromEmail()
  const baseHtml = buildBulkEmailHtml(options.subject, options.message)
  const html = options.unsubscribeFooter ? baseHtml.replace('</body>', `${options.unsubscribeFooter}</body>`) : baseHtml
  const text = options.message

  let successCount = 0
  const failures: Array<{ email: string; error: string }> = []

  for (const to of recipients) {
    const result = await sendEmailViaResend({
      to,
      subject: options.subject,
      html,
      text,
      from,
    })
    if (result.success) {
      successCount++
    } else {
      failures.push({ email: to, error: result.error || 'Unbekannter Fehler' })
    }
  }

  return {
    success: successCount > 0,
    successCount,
    errorCount: failures.length,
    total: recipients.length,
    failures: failures.slice(0, 10),
    from,
  }
}

export function normalizeRecipientList(rawRecipients: unknown): string[] | null {
  if (!Array.isArray(rawRecipients)) return null
  return [
    ...new Set(
      (rawRecipients as unknown[])
        .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
        .filter((e) => BULK_EMAIL_REGEX.test(e))
    ),
  ]
}
