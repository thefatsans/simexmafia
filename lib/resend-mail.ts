import { Resend } from 'resend'
import { SUPPORT_EMAIL } from '@/lib/company-info'

export interface ResendMailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export interface ResendMailResult {
  success: boolean
  messageId?: string
  error?: string
}

let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  if (!resendClient) {
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

function rootDomainFromSiteUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!url) return null
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
    if (!host || host === 'localhost' || host.endsWith('.vercel.app')) return null
    return host.replace(/^www\./, '')
  } catch {
    return null
  }
}

/** Absender – nach Domain-Verifizierung: noreply@deine-domain.de (nicht onboarding@resend.dev) */
export function getDefaultFromEmail(): string {
  const configured = process.env.RESEND_FROM_EMAIL?.trim()
  const domain = rootDomainFromSiteUrl()

  if (configured && !/onboarding@resend\.dev/i.test(configured)) {
    return configured
  }

  if (domain) {
    return `SimexMafia <noreply@${domain}>`
  }

  return configured || 'SimexMafia <onboarding@resend.dev>'
}

export async function sendEmailViaResend(
  options: ResendMailOptions
): Promise<ResendMailResult> {
  const client = getResendClient()
  if (!client) {
    return {
      success: false,
      error: 'RESEND_API_KEY ist nicht gesetzt',
    }
  }

  const to = Array.isArray(options.to) ? options.to : [options.to]

  const { data, error } = await client.emails.send({
    from: options.from || getDefaultFromEmail(),
    to,
    replyTo: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || SUPPORT_EMAIL,
    subject: options.subject,
    html: options.html,
    text: options.text ?? options.html.replace(/<[^>]*>/g, ''),
  })

  if (error) {
    const from = options.from || getDefaultFromEmail()
    console.error('[Resend] Send failed:', { from, to, message: error.message, name: error.name })
    return {
      success: false,
      error: error.message || 'Resend konnte die E-Mail nicht senden',
    }
  }

  return {
    success: true,
    messageId: data?.id,
  }
}
