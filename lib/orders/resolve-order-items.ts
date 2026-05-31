import type { PrismaClient } from '@prisma/client'
import { sackTypes } from '@/data/sacks'
import { getPackageById, calculateTotalCoins } from '@/data/goofyCoinsPackages'
import {
  ensureVirtualGoofyCoinsProductId,
  ensureVirtualSackProductId,
} from '@/lib/orders/virtual-product'

export type ResolvedOrderItem = {
  productId: string
  type: string
  name: string
  price: number
  quantity: number
  metadata: Record<string, unknown> | null
}

export async function resolveOrderItems(
  db: PrismaClient,
  items: Array<{
    productId?: string
    id?: string
    type?: string
    name?: string
    price?: number | string
    quantity?: number | string
    metadata?: Record<string, unknown> | null
  }>
): Promise<{ ok: true; items: ResolvedOrderItem[] } | { ok: false; error: string; status: number }> {
  const resolved: ResolvedOrderItem[] = []

  for (const item of items) {
    const itemType = item.type || 'product'
    const quantity = Math.max(1, parseInt(String(item.quantity ?? 1), 10) || 1)

    if (itemType === 'sack') {
      const sackType =
        (item.metadata?.sackType as string | undefined) ||
        (item.metadata?.sackId as string | undefined) ||
        item.id
      const sack = sackTypes.find((s) => s.type === sackType || s.id === sackType)
      if (!sack) {
        return { ok: false, error: `Invalid sack type: ${sackType}`, status: 400 }
      }
      const productId = await ensureVirtualSackProductId()
      resolved.push({
        productId,
        type: 'sack',
        name: sack.name,
        price: sack.priceMoney,
        quantity,
        metadata: {
          ...(item.metadata || {}),
          sackType: sack.type,
          sackId: sack.id,
        },
      })
      continue
    }

    if (itemType === 'goofycoins') {
      const packageId =
        (item.metadata?.packageId as string | undefined) || item.id || item.productId
      const pkg = packageId ? getPackageById(String(packageId)) : undefined
      if (!pkg) {
        return { ok: false, error: `Invalid GoofyCoins package: ${packageId}`, status: 400 }
      }
      const productId = await ensureVirtualGoofyCoinsProductId()
      resolved.push({
        productId,
        type: 'goofycoins',
        name: pkg.name,
        price: pkg.price,
        quantity: 1,
        metadata: {
          packageId: pkg.id,
          coins: pkg.coins,
          bonus: pkg.bonus || 0,
          totalCoins: calculateTotalCoins(pkg),
        },
      })
      continue
    }

    const productId = item.productId || item.id
    if (!productId) {
      return { ok: false, error: 'Missing product id', status: 400 }
    }

    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      return { ok: false, error: `Product not found: ${productId}`, status: 404 }
    }

    const clientPrice = parseFloat(String(item.price ?? 0))
    const dbPrice = parseFloat(product.price.toString())
    const priceDifference = Math.abs(clientPrice - dbPrice)
    const maxDifference = dbPrice * 0.01

    if (priceDifference > maxDifference && priceDifference > 0.01) {
      console.warn(
        `[Orders] Price mismatch for product ${productId}: client=${clientPrice}, db=${dbPrice}`
      )
    }

    const { productUsesKeyInventory, countAvailableKeys } = await import('@/lib/product-keys/stock')
    if (await productUsesKeyInventory(product.id)) {
      const available = await countAvailableKeys(product.id)
      if (quantity > available) {
        return {
          ok: false,
          error:
            available === 0
              ? `${product.name} ist derzeit ausverkauft.`
              : `Nur noch ${available} Stück von „${product.name}“ verfügbar.`,
          status: 400,
        }
      }
    }

    resolved.push({
      productId: product.id,
      type: itemType,
      name: product.name,
      price: dbPrice,
      quantity,
      metadata: item.metadata || null,
    })
  }

  return { ok: true, items: resolved }
}
