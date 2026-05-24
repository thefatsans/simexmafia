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
