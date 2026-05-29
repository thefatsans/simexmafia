import { CoinTransaction } from '@/types/user'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

type ApiCoinTransaction = {
  id: string
  userId: string
  amount: number
  type: string
  description: string
  orderId?: string | null
  date: string
}

function mapTransactionType(
  dbType: string,
  amount: number
): CoinTransaction['type'] {
  if (dbType === 'spent' || dbType === 'redeemed' || amount < 0) return 'spent'
  if (dbType === 'bonus') return 'bonus'
  return 'earned'
}

function mapApiTransaction(tx: ApiCoinTransaction): CoinTransaction {
  return {
    id: tx.id,
    userId: tx.userId,
    amount: tx.amount,
    type: mapTransactionType(tx.type, tx.amount),
    description: tx.description,
    date: tx.date,
    orderId: tx.orderId ?? undefined,
  }
}

export async function getCoinTransactionsFromAPI(
  userId: string,
  profile?: { email: string; firstName?: string; lastName?: string }
): Promise<CoinTransaction[]> {
  if (!userId) return []

  try {
    const params = new URLSearchParams({ userId })
    if (profile?.email) {
      params.set('email', profile.email)
      if (profile.firstName) params.set('firstName', profile.firstName)
      if (profile.lastName) params.set('lastName', profile.lastName)
    }

    const response = await fetch(
      `${API_BASE_URL}/api/goofycoins/transactions?${params.toString()}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      return []
    }

    const data: ApiCoinTransaction[] = await response.json()
    if (!Array.isArray(data)) return []

    return data.map(mapApiTransaction)
  } catch (error) {
    console.warn('[GoofyCoins] Failed to load transactions:', error)
    return []
  }
}

export type GoofyCoinCashoutRequest = {
  id: string
  variant: 'cash' | 'bank'
  variantLabel: string
  coinsAmount: number
  euroAmount: number
  status: string
  fullName: string
  email: string
  phone: string | null
  iban: string | null
  address: string | null
  notes: string | null
  createdAt: string
  processedAt: string | null
}

export async function getCashoutRequestsFromAPI(): Promise<GoofyCoinCashoutRequest[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/goofycoins/cashout`, {
      credentials: 'include',
      cache: 'no-store',
    })
    if (!response.ok) return []
    const data = await response.json()
    return Array.isArray(data.items) ? data.items : []
  } catch {
    return []
  }
}

export async function submitCashoutRequest(payload: {
  variant: 'cash' | 'bank'
  euroAmount: number
  fullName: string
  email: string
  phone?: string
  iban?: string
  address?: string
  notes?: string
}): Promise<{ success: boolean; error?: string; newBalance?: number; code?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/goofycoins/cashout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    return { success: false, error: data.error || 'Anfrage fehlgeschlagen', code: data.code }
  }
  return { success: true, newBalance: data.newBalance }
}
