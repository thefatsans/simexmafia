const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export function isTurnstileEnabled(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
      process.env.TURNSTILE_SECRET_KEY.trim().length > 0
  )
}

export async function verifyTurnstile(
  token: string | undefined | null,
  ip?: string | null
): Promise<boolean> {
  if (!isTurnstileEnabled()) return true // Captcha disabled (no secret)
  if (!token || token.length < 5) return false

  try {
    const body = new URLSearchParams()
    body.set('secret', process.env.TURNSTILE_SECRET_KEY as string)
    body.set('response', token)
    if (ip) body.set('remoteip', ip)

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const data: { success?: boolean; 'error-codes'?: string[] } = await response.json()
    if (!data.success) {
      console.warn('[Captcha] Turnstile failed:', data['error-codes'])
    }
    return Boolean(data.success)
  } catch (error) {
    console.error('[Captcha] Turnstile verify error:', error)
    return false
  }
}
