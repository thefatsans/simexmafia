export const GOOFYCOINS_PER_EUR = 100
export const MIN_CASHOUT_EUR = 10
export const MAX_CASHOUT_EUR = 500

export type CashoutVariant = 'cash' | 'bank'

export const CASHOUT_VARIANTS: Record<
  CashoutVariant,
  { id: CashoutVariant; label: string; description: string }
> = {
  cash: {
    id: 'cash',
    label: 'Bargeld',
    description: 'Auszahlung in bar – Abholung oder Versand nach Absprache',
  },
  bank: {
    id: 'bank',
    label: 'Echtgeld',
    description: 'Überweisung auf dein Bankkonto (SEPA)',
  },
}

export function eurToCoins(eur: number): number {
  return Math.round(eur * GOOFYCOINS_PER_EUR)
}

export function coinsToEur(coins: number): number {
  return coins / GOOFYCOINS_PER_EUR
}

export function validateCashoutAmount(eur: number): string | null {
  if (!Number.isFinite(eur)) {
    return 'Ungültiger Betrag'
  }
  if (eur < MIN_CASHOUT_EUR) {
    return `Mindestbetrag: ${MIN_CASHOUT_EUR}€`
  }
  if (eur > MAX_CASHOUT_EUR) {
    return `Maximalbetrag: ${MAX_CASHOUT_EUR}€`
  }
  const coins = eurToCoins(eur)
  if (coins % GOOFYCOINS_PER_EUR !== 0) {
    return 'Betrag muss in ganzen Euro-Schritten angegeben werden'
  }
  return null
}

export function normalizeCashoutVariant(value: unknown): CashoutVariant | null {
  if (value === 'cash' || value === 'bank') return value
  return null
}
