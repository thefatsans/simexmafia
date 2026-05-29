import { CASHOUT_VARIANTS } from '@/lib/goofycoins/cashout'

export type CashoutRow = {
  id: string
  variant: string
  coinsAmount: number
  euroAmount: number
  status: string
  fullName: string
  email: string
  phone: string | null
  iban: string | null
  address: string | null
  notes: string | null
  adminNotes?: string | null
  processedAt: Date | null
  createdAt: Date
}

export function maskIban(iban: string): string {
  const clean = iban.replace(/\s/g, '')
  if (clean.length <= 8) return clean
  return `${clean.slice(0, 4)}****${clean.slice(-4)}`
}

export function mapCashoutForUser(row: CashoutRow) {
  const variantInfo = CASHOUT_VARIANTS[row.variant as keyof typeof CASHOUT_VARIANTS]
  return {
    id: row.id,
    variant: row.variant as 'cash' | 'bank',
    variantLabel: variantInfo?.label ?? row.variant,
    coinsAmount: row.coinsAmount,
    euroAmount: row.euroAmount,
    status: row.status,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    iban: row.iban ? maskIban(row.iban) : null,
    address: row.address,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    processedAt: row.processedAt?.toISOString() ?? null,
  }
}

export function mapCashoutForAdmin(
  row: CashoutRow & {
    userId: string
    user?: {
      id: string
      email: string
      firstName: string
      lastName: string
    } | null
  }
) {
  return {
    id: row.id,
    userId: row.userId,
    variant: row.variant as 'cash' | 'bank',
    coinsAmount: row.coinsAmount,
    euroAmount: row.euroAmount,
    status: row.status,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    iban: row.iban,
    address: row.address,
    notes: row.notes,
    adminNotes: row.adminNotes ?? null,
    processedAt: row.processedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    user: row.user
      ? {
          id: row.user.id,
          email: row.user.email,
          firstName: row.user.firstName,
          lastName: row.user.lastName,
        }
      : null,
  }
}
