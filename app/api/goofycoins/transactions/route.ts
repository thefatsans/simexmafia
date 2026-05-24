import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if (!authResult || authResult.error) {
      return authResult?.error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!prisma) {
      return NextResponse.json([])
    }

    const transactions = await prisma.coinTransaction.findMany({
      where: { userId: authResult.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(
      transactions.map((tx) => ({
        id: tx.id,
        userId: tx.userId,
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        orderId: tx.orderId,
        balance: tx.balance,
        date: tx.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('[GoofyCoins] Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
