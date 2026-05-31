import { prisma } from '@/lib/prisma'
import { isSimexDiscordServerProduct } from '@/lib/products/simex-discord-server'
import { sendOrderDeliveryEmailServer } from '@/lib/email-server'
import { rewardReferral } from '@/lib/referral'
import { resolveGoofyCoinsPackageCredit } from '@/lib/goofycoins/order-rewards'
import {
  VIRTUAL_GOOFYCOINS_PRODUCT_ID,
  VIRTUAL_SACK_PRODUCT_ID,
} from '@/lib/orders/virtual-product'
import {
  productUsesKeyInventory,
  reserveKeysForOrderItem,
  syncProductInStock,
} from '@/lib/product-keys/stock'

export interface CompleteOrderExtras {
  paymentIntentId?: string
  paypalPaymentId?: string
  paypalPayerId?: string | null
}

export interface CompletedOrderResult {
  id: string
  status: string
  alreadyComplete: boolean
}

interface DeliveryAssignment {
  itemId: string
  key: string
}

const REFERRAL_INVITER_REWARD = 100
const REFERRAL_INVITEE_REWARD = 50

function isLikelyDigitalGameKey(name: string): boolean {
  const lower = name.toLowerCase()
  return (
    lower.includes('steam') ||
    lower.includes('xbox') ||
    lower.includes('playstation') ||
    lower.includes('nintendo') ||
    lower.includes('roblox') ||
    lower.includes('robux') ||
    lower.includes('gift') ||
    lower.includes('voucher') ||
    lower.includes('key')
  )
}

function deriveDeliverable(name: string, productNameLower: string): string | null {
  if (productNameLower.includes('discord') || productNameLower.includes('simex')) {
    const url = process.env.DISCORD_INVITE_URL?.trim()
    if (url) return url
    return 'Bitte kontaktiere den Support für den Discord-Invite-Link.'
  }
  return null
}

export async function completeOrder(
  orderId: string,
  paymentMethod: string,
  extras: CompleteOrderExtras = {}
): Promise<CompletedOrderResult> {
  if (!prisma) {
    throw new Error('Database not available')
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        user: true,
      },
    })

    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }

    if (order.status === 'completed' && order.completedAt) {
      return { id: order.id, status: order.status, alreadyComplete: true }
    }

    const deliveries: DeliveryAssignment[] = []
    const productsNeedingStockSync = new Set<string>()

    for (const item of order.items) {
      if (item.key) continue
      const productId = item.productId
      if (!productId) continue

      const usesKeyPool = await productUsesKeyInventory(productId, tx)
      if (usesKeyPool) {
        const reserved = await reserveKeysForOrderItem(
          tx,
          productId,
          item.id,
          item.quantity
        )
        productsNeedingStockSync.add(productId)
        if (reserved) {
          deliveries.push({ itemId: item.id, key: reserved })
        }
        continue
      }

      const baseName = item.product?.name || item.name || ''
      const productNameLower = baseName.toLowerCase()
      const deliverable =
        deriveDeliverable(baseName, productNameLower) ||
        (isSimexDiscordServerProduct({ name: baseName })
          ? process.env.DISCORD_INVITE_URL?.trim() || 'Discord-Invite folgt per Support'
          : isLikelyDigitalGameKey(productNameLower)
            ? null
            : null)

      if (deliverable) {
        deliveries.push({ itemId: item.id, key: deliverable })
      }
    }

    for (const delivery of deliveries) {
      await tx.orderItem.update({
        where: { id: delivery.itemId },
        data: { key: delivery.key },
      })
    }

    const statusReason = [
      paymentMethod === 'stripe' && extras.paymentIntentId
        ? `Stripe PaymentIntent ${extras.paymentIntentId}`
        : null,
      paymentMethod === 'paypal' && extras.paypalPaymentId
        ? `PayPal ${extras.paypalPaymentId}`
        : null,
    ]
      .filter(Boolean)
      .join(' | ') || null

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        statusReason,
      },
    })

    for (const item of order.items) {
      const productId = item.productId
      if (!productId) continue
      if (productId === VIRTUAL_SACK_PRODUCT_ID || productId === VIRTUAL_GOOFYCOINS_PRODUCT_ID) {
        continue
      }
      const exists = await tx.inventoryItem.findFirst({
        where: { userId: order.userId, productId, orderId: order.id },
        select: { id: true },
      })
      if (!exists) {
        await tx.inventoryItem
          .create({
            data: {
              userId: order.userId,
              productId,
              source: 'purchase',
              orderId: order.id,
              sourceId: order.id,
              notes: item.product?.name || item.name || null,
            },
          })
          .catch((err) => console.error('[completeOrder] inventoryItem create failed:', err))
      }
    }

    if (order.coinsEarned && order.coinsEarned > 0) {
      const alreadyRewarded = await tx.coinTransaction.findFirst({
        where: { orderId: order.id, type: 'earned' },
        select: { id: true },
      })
      if (!alreadyRewarded) {
        const updatedUser = await tx.user.update({
          where: { id: order.userId },
          data: {
            goofyCoins: { increment: order.coinsEarned },
            totalSpent: { increment: order.total ?? 0 },
          },
          select: { goofyCoins: true },
        })
        await tx.coinTransaction.create({
          data: {
            userId: order.userId,
            type: 'earned',
            amount: order.coinsEarned,
            balance: updatedUser.goofyCoins,
            description: `Order ${order.id} completed`,
            orderId: order.id,
          },
        })
      }
    }

    let packageCoinsTotal = 0
    for (const item of order.items) {
      if (item.type !== 'goofycoins') continue
      packageCoinsTotal += resolveGoofyCoinsPackageCredit(item.metadata)
    }

    if (packageCoinsTotal > 0) {
      const alreadyPackageCredit = await tx.coinTransaction.findFirst({
        where: {
          orderId: order.id,
          type: 'earned',
          description: { contains: 'GoofyCoins package purchase' },
        },
        select: { id: true },
      })
      if (!alreadyPackageCredit) {
        const updatedUser = await tx.user.update({
          where: { id: order.userId },
          data: { goofyCoins: { increment: packageCoinsTotal } },
          select: { goofyCoins: true },
        })
        await tx.coinTransaction.create({
          data: {
            userId: order.userId,
            type: 'earned',
            amount: packageCoinsTotal,
            balance: updatedUser.goofyCoins,
            description: `GoofyCoins package purchase (Order ${order.id})`,
            orderId: order.id,
          },
        })
      }
    }

    return {
      id: updated.id,
      status: updated.status,
      alreadyComplete: false,
      _productsNeedingStockSync: productsNeedingStockSync,
      _userEmail: order.user?.email,
      _userFirstName: order.user?.firstName,
      _userId: order.userId,
      _items: order.items.map((it) => ({
        name: it.product?.name || it.name,
        quantity: it.quantity,
        price: Number(it.price),
        key:
          deliveries.find((d) => d.itemId === it.id)?.key ?? it.key ?? null,
      })),
    } as any
  })

  if (!result.alreadyComplete && result._productsNeedingStockSync) {
    for (const productId of result._productsNeedingStockSync as Set<string>) {
      await syncProductInStock(productId).catch((err) => {
        console.warn('[completeOrder] syncProductInStock failed:', err)
      })
    }
  }

  if (!result.alreadyComplete) {
    try {
      await rewardReferral(result._userId, REFERRAL_INVITER_REWARD, REFERRAL_INVITEE_REWARD)
    } catch (err) {
      console.warn('[completeOrder] referral reward failed:', err)
    }

    if (result._userEmail) {
      sendOrderDeliveryEmailServer(
        result._userEmail,
        result._userFirstName || 'Spieler',
        result.id,
        result._items
      ).catch((err) => {
        console.warn('[completeOrder] delivery email failed:', err)
      })
    }
  }

  return {
    id: result.id,
    status: result.status,
    alreadyComplete: result.alreadyComplete,
  }
}
