import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { sackTypes, openSack } from '@/data/sacks'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sackType, purchaseMethod, userId: clientUserId } = body

    console.log('[Sacks Purchase] Received request:', {
      sackType,
      purchaseMethod,
      clientUserId
    })

    // Verify authentication - pass body so userId can be read
    const authResult = await getAuthenticatedUser(request, body)
    if (!authResult || authResult.error) {
      return authResult?.error || NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const authenticatedUser = authResult.user
    if (!authenticatedUser || !authenticatedUser.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify userId matches
    if (clientUserId && authenticatedUser.id !== clientUserId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: User ID mismatch' },
        { status: 403 }
      )
    }

    if (!sackType) {
      return NextResponse.json(
        { success: false, error: 'Sack type is required' },
        { status: 400 }
      )
    }

    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      )
    }

    // Get sack from types
    const sack = sackTypes.find(s => s.type === sackType)
    if (!sack) {
      return NextResponse.json(
        { success: false, error: 'Invalid sack type' },
        { status: 400 }
      )
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: authenticatedUser.id },
      select: {
        id: true,
        goofyCoins: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate purchase method
    if (purchaseMethod === 'coins') {
      // Check if user has enough coins
      if (dbUser.goofyCoins < sack.priceCoins) {
        return NextResponse.json(
          { success: false, error: 'Insufficient GoofyCoins', currentBalance: dbUser.goofyCoins, required: sack.priceCoins },
          { status: 400 }
        )
      }

      // Deduct coins from database
      const updatedUser = await prisma.user.update({
        where: { id: authenticatedUser.id },
        data: {
          goofyCoins: {
            decrement: sack.priceCoins,
          },
        },
        select: {
          goofyCoins: true,
        },
      })

      // Double-check balance after update (prevent race conditions)
      if (updatedUser.goofyCoins < 0) {
        // Rollback: Add coins back
        await prisma.user.update({
          where: { id: authenticatedUser.id },
          data: {
            goofyCoins: {
              increment: sack.priceCoins,
            },
          },
        })
        return NextResponse.json(
          { success: false, error: 'Insufficient GoofyCoins (race condition detected)' },
          { status: 400 }
        )
      }

      console.log('[Sacks Purchase] Coins deducted:', {
        userId: authenticatedUser.id,
        amount: sack.priceCoins,
        newBalance: updatedUser.goofyCoins,
      })
    } else if (purchaseMethod === 'money') {
      // For money purchases, we need to create an order first
      // This will be handled by the PaymentCheckout component
      // We just validate here that the sack exists
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid purchase method' },
        { status: 400 }
      )
    }

    // Generate reward (server-side to prevent manipulation)
    const reward = openSack(sack)

    // Create coin transaction for purchase
    if (purchaseMethod === 'coins') {
      await prisma.coinTransaction.create({
        data: {
          userId: authenticatedUser.id,
          type: 'spent',
          amount: -sack.priceCoins,
          balance: dbUser.goofyCoins - sack.priceCoins,
          description: `Sack purchase: ${sack.name}`,
        },
      })
    }

    // If reward is coins, add them to user balance
    if (reward.type === 'coins' && reward.coins) {
      const finalBalance = purchaseMethod === 'coins' 
        ? (await prisma.user.findUnique({ where: { id: authenticatedUser.id }, select: { goofyCoins: true } }))?.goofyCoins || 0
        : dbUser.goofyCoins

      await prisma.user.update({
        where: { id: authenticatedUser.id },
        data: {
          goofyCoins: {
            increment: reward.coins,
          },
        },
      })

      // Create coin transaction for reward
      await prisma.coinTransaction.create({
        data: {
          userId: authenticatedUser.id,
          type: 'earned',
          amount: reward.coins,
          balance: finalBalance + reward.coins,
          description: `Sack reward: ${sack.name}`,
        },
      })

      console.log('[Sacks Purchase] Coins added as reward:', {
        userId: authenticatedUser.id,
        amount: reward.coins,
      })
    }

    return NextResponse.json({
      success: true,
      reward,
      newBalance: purchaseMethod === 'coins' 
        ? (await prisma.user.findUnique({ where: { id: authenticatedUser.id }, select: { goofyCoins: true } }))?.goofyCoins || 0
        : dbUser.goofyCoins,
    })
  } catch (error: any) {
    console.error('[Sacks Purchase] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

