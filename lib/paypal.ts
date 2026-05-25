type PayPalMode = 'live' | 'sandbox'

function getBaseUrl(): string {
  const mode = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase() as PayPalMode
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

interface PayPalConfig {
  clientId: string
  clientSecret: string
}

function getConfig(): PayPalConfig | null {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim()
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getPayPalAccessToken(): Promise<string> {
  const cfg = getConfig()
  if (!cfg) {
    const err = new Error('PayPal not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.')
    ;(err as any).code = 'PAYPAL_NOT_CONFIGURED'
    throw err
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token
  }

  const credentials = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64')

  const response = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    const err = new Error(`PayPal OAuth failed (${response.status}): ${detail.slice(0, 200)}`)
    ;(err as any).code = 'PAYPAL_AUTH_FAILED'
    throw err
  }

  const data: { access_token: string; expires_in: number } = await response.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, data.expires_in - 60) * 1000,
  }
  return data.access_token
}

export interface PayPalOrder {
  id: string
  status: string
  intent?: string
  purchase_units?: Array<{
    amount?: { value?: string; currency_code?: string }
    payee?: { email_address?: string; merchant_id?: string }
  }>
  payer?: { email_address?: string; payer_id?: string }
}

export async function getPayPalOrder(orderId: string): Promise<PayPalOrder> {
  const token = await getPayPalAccessToken()
  const response = await fetch(`${getBaseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    const err = new Error(`PayPal order fetch failed (${response.status}): ${detail.slice(0, 200)}`)
    ;(err as any).code = response.status === 404 ? 'PAYPAL_ORDER_NOT_FOUND' : 'PAYPAL_ORDER_FETCH_FAILED'
    throw err
  }

  return (await response.json()) as PayPalOrder
}

export function isPayPalConfigured(): boolean {
  return Boolean(getConfig())
}
