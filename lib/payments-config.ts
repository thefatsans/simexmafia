export const isStripeConfigured = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
