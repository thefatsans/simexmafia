export const isStripeConfigured = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

/** PayPal vorübergehend aus — nur bei NEXT_PUBLIC_PAYPAL_ENABLED=true wieder aktiv */
export const isPayPalEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_PAYPAL_ENABLED === 'true'
