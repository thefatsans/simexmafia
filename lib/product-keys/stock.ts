import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import {
  isKeyInventoryProductId,
  KEY_INVENTORY_PRODUCT_IDS,
} from '@/lib/products/key-inventory-catalog'

type TransactionClient = Prisma.TransactionClient

export async function productUsesKeyInventory(
  productId: string,
  tx?: TransactionClient
): Promise<boolean> {
  if (isKeyInventoryProductId(productId)) {
    return true
  }

  const db = tx ?? prisma
  if (!db) return false
  const count = await db.productStockKey.count({
    where: { productId },
  })
  return count > 0
}

export async function countAvailableKeys(productId: string): Promise<number> {
  if (!prisma) return 0
  return prisma.productStockKey.count({
    where: { productId, usedAt: null },
  })
}

export async function countAvailableKeysForProducts(
  productIds: string[]
): Promise<Map<string, number>> {
  const result = new Map<string, number>()
  if (!prisma || productIds.length === 0) return result

  const rows = await prisma.productStockKey.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds }, usedAt: null },
    _count: { id: true },
  })

  for (const id of productIds) {
    result.set(id, 0)
  }
  for (const row of rows) {
    result.set(row.productId, row._count.id)
  }
  return result
}

export async function getKeyInventoryStats(productId: string): Promise<{
  available: number
  used: number
  total: number
}> {
  if (!prisma) {
    return { available: 0, used: 0, total: 0 }
  }

  const [available, used] = await Promise.all([
    prisma.productStockKey.count({ where: { productId, usedAt: null } }),
    prisma.productStockKey.count({ where: { productId, usedAt: { not: null } } }),
  ])

  return { available, used, total: available + used }
}

export type ProductKeyStatus = 'available' | 'used' | 'all'

export type ProductKeyRow = {
  id: string
  code: string
  usedAt: string | null
  orderItemId: string | null
  createdAt: string
}

function keyStatusWhere(
  status: ProductKeyStatus
): { usedAt: null } | { usedAt: { not: null } } | undefined {
  if (status === 'available') return { usedAt: null }
  if (status === 'used') return { usedAt: { not: null } }
  return undefined
}

export async function listProductKeys(
  productId: string,
  options: {
    status?: ProductKeyStatus
    page?: number
    limit?: number
  } = {}
): Promise<{ keys: ProductKeyRow[]; total: number }> {
  if (!prisma) {
    return { keys: [], total: 0 }
  }

  const status = options.status ?? 'all'
  const page = Math.max(options.page ?? 1, 1)
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100)
  const skip = (page - 1) * limit
  const usedAtFilter = keyStatusWhere(status)
  const where = {
    productId,
    ...(usedAtFilter ?? {}),
  }

  const [rows, total] = await Promise.all([
    prisma.productStockKey.findMany({
      where,
      select: {
        id: true,
        code: true,
        usedAt: true,
        orderItemId: true,
        createdAt: true,
      },
      orderBy: [{ usedAt: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.productStockKey.count({ where }),
  ])

  return {
    keys: rows.map((row) => ({
      id: row.id,
      code: row.code,
      usedAt: row.usedAt ? row.usedAt.toISOString() : null,
      orderItemId: row.orderItemId,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
  }
}

export async function deleteAvailableProductKeys(
  productId: string,
  keyIds: string[]
): Promise<{ deleted: number; skipped: number }> {
  if (!prisma) {
    throw new Error('Database not available')
  }

  const uniqueIds = [...new Set(keyIds.filter(Boolean))]
  if (uniqueIds.length === 0) {
    return { deleted: 0, skipped: 0 }
  }

  const keys = await prisma.productStockKey.findMany({
    where: { productId, id: { in: uniqueIds } },
    select: { id: true, usedAt: true },
  })

  const deletableIds = keys.filter((k) => k.usedAt === null).map((k) => k.id)
  const skipped = uniqueIds.length - deletableIds.length

  if (deletableIds.length > 0) {
    await prisma.productStockKey.deleteMany({
      where: { productId, id: { in: deletableIds }, usedAt: null },
    })
    await syncProductInStock(productId)
  }

  return { deleted: deletableIds.length, skipped }
}

export async function getKeyInventoryStatsForProducts(
  productIds: string[]
): Promise<Map<string, { available: number; used: number; total: number }>> {
  const result = new Map<string, { available: number; used: number; total: number }>()
  if (!prisma || productIds.length === 0) return result

  for (const id of productIds) {
    result.set(id, { available: 0, used: 0, total: 0 })
  }

  try {
    const availableRows = await prisma.productStockKey.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds }, usedAt: null },
      _count: { id: true },
    })

    const usedRows = await prisma.productStockKey.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds }, usedAt: { not: null } },
      _count: { id: true },
    })

    for (const row of availableRows) {
      const current = result.get(row.productId) || { available: 0, used: 0, total: 0 }
      current.available = row._count.id
      current.total += row._count.id
      result.set(row.productId, current)
    }

    for (const row of usedRows) {
      const current = result.get(row.productId) || { available: 0, used: 0, total: 0 }
      current.used = row._count.id
      current.total += row._count.id
      result.set(row.productId, current)
    }
  } catch (error) {
    console.warn('[Stock] getKeyInventoryStatsForProducts failed:', error)
  }

  return result
}

export async function productsWithKeyInventory(
  productIds: string[]
): Promise<Set<string>> {
  const set = new Set<string>()
  if (!prisma || productIds.length === 0) return set

  const rows = await prisma.productStockKey.findMany({
    where: { productId: { in: productIds } },
    select: { productId: true },
    distinct: ['productId'],
  })

  for (const row of rows) {
    set.add(row.productId)
  }
  return set
}

function normalizeCodes(codes: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of codes) {
    const code = raw.trim()
    if (!code) continue
    const key = code.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(code)
  }
  return result
}

export async function addProductKeys(
  productId: string,
  codes: string[]
): Promise<{ added: number; skipped: number }> {
  if (!prisma) {
    throw new Error('Database not available')
  }

  const normalized = normalizeCodes(codes)
  if (normalized.length === 0) {
    return { added: 0, skipped: 0 }
  }

  const existing = await prisma.productStockKey.findMany({
    where: {
      productId,
      code: { in: normalized },
    },
    select: { code: true },
  })
  const existingSet = new Set(existing.map((e) => e.code.toLowerCase()))

  const toInsert = normalized.filter((c) => !existingSet.has(c.toLowerCase()))
  if (toInsert.length > 0) {
    await prisma.productStockKey.createMany({
      data: toInsert.map((code) => ({ productId, code })),
    })
  }

  await syncProductInStock(productId)

  return {
    added: toInsert.length,
    skipped: normalized.length - toInsert.length,
  }
}

export async function syncProductInStock(productId: string): Promise<void> {
  if (!prisma) return
  const available = await countAvailableKeys(productId)
  await prisma.product.update({
    where: { id: productId },
    data: { inStock: available > 0 },
  })
}

export async function reserveKeysForOrderItem(
  tx: TransactionClient,
  productId: string,
  orderItemId: string,
  quantity: number
): Promise<string | null> {
  if (quantity < 1) return null

  const keys = await tx.productStockKey.findMany({
    where: { productId, usedAt: null },
    orderBy: { createdAt: 'asc' },
    take: quantity,
  })

  if (keys.length < quantity) {
    return null
  }

  const now = new Date()
  const codes: string[] = []

  for (let i = 0; i < keys.length; i++) {
    await tx.productStockKey.update({
      where: { id: keys[i].id },
      data: { usedAt: now, orderItemId },
    })
    codes.push(keys[i].code)
  }

  return codes.join('\n')
}

export function enrichProductWithStock<T extends { id: string; inStock?: boolean }>(
  product: T,
  stockMap: Map<string, number>
): T & { stockCount?: number; inStock: boolean } {
  if (isKeyInventoryProductId(product.id)) {
    const stockCount = stockMap.get(product.id) ?? 0
    return {
      ...product,
      stockCount,
      inStock: stockCount > 0,
    }
  }

  if (stockMap.has(product.id)) {
    const stockCount = stockMap.get(product.id) ?? 0
    return {
      ...product,
      stockCount,
      inStock: stockCount > 0,
    }
  }

  return { ...product, inStock: product.inStock ?? true }
}

export async function enrichProductsWithStock<T extends { id: string; inStock?: boolean }>(
  products: T[]
): Promise<Array<T & { stockCount?: number; inStock: boolean }>> {
  if (products.length === 0) {
    return []
  }

  const idsToCount = new Set<string>()
  for (const product of products) {
    if (isKeyInventoryProductId(product.id)) {
      idsToCount.add(product.id)
    }
  }

  if (!prisma) {
    return products.map((p) => {
      if (isKeyInventoryProductId(p.id)) {
        return { ...p, stockCount: 0, inStock: false }
      }
      return { ...p, inStock: p.inStock ?? true }
    })
  }

  try {
    const stockMap = await countAvailableKeysForProducts([...idsToCount])

    return products.map((p) => enrichProductWithStock(p, stockMap))
  } catch (error) {
    console.warn('[Stock] enrichProductsWithStock failed:', error)
    return products.map((p) => {
      if (isKeyInventoryProductId(p.id)) {
        return { ...p, stockCount: 0, inStock: false }
      }
      return { ...p, inStock: p.inStock ?? true }
    })
  }
}
