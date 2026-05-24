import { getOrdersFromAPI } from '@/lib/api/orders'
import { getInventoryFromAPI } from '@/lib/api/inventory'
import { getUserOrders, type Order } from '@/data/payments'
import { getSackHistoryForUser, getSackStatisticsForHistory } from '@/data/sackHistory'
import { getInventory, type InventoryItem } from '@/data/inventory'
import type { User } from '@/types/user'

export interface AccountStats {
  totalOrders: number
  totalSpent: number
  sacksOpened: number
  itemsWon: number
}

function mergeOrders(apiOrders: Order[], localOrders: Order[]): Order[] {
  const byId = new Map<string, Order>()
  for (const order of [...apiOrders, ...localOrders]) {
    byId.set(order.id, order)
  }
  return Array.from(byId.values())
}

function mapApiInventoryItem(raw: Record<string, unknown>): InventoryItem | null {
  const product = raw.product as InventoryItem['product'] | undefined
  if (!product?.id) return null

  return {
    id: String(raw.id),
    product,
    obtainedAt: String(raw.createdAt || raw.obtainedAt || new Date().toISOString()),
    obtainedFrom: (raw.source as InventoryItem['obtainedFrom']) || 'other',
    sourceId: raw.sourceId ? String(raw.sourceId) : undefined,
    sourceName: raw.notes ? String(raw.notes) : undefined,
    isRedeemed: Boolean(raw.isRedeemed),
    redeemedAt: raw.redeemedAt ? String(raw.redeemedAt) : undefined,
    redemptionCode: raw.redemptionCode ? String(raw.redemptionCode) : undefined,
  }
}

async function loadInventoryForUser(user: User): Promise<InventoryItem[]> {
  try {
    const apiItems = await getInventoryFromAPI(user.id, {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    })
    return apiItems
      .map((item) => mapApiInventoryItem(item as Record<string, unknown>))
      .filter((item): item is InventoryItem => item !== null)
  } catch {
    return getInventory()
  }
}

export async function loadAccountStats(user: User): Promise<AccountStats> {
  const profile = {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  }

  let apiOrders: Order[] = []
  try {
    apiOrders = (await getOrdersFromAPI(user.id, profile)) as Order[]
  } catch {
    apiOrders = []
  }

  const localOrders = getUserOrders(user.id)
  const orders = mergeOrders(apiOrders, localOrders)

  const totalOrders = orders.length
  const spentFromOrders = orders.reduce((sum, order) => sum + (order.total || 0), 0)
  const totalSpent =
    spentFromOrders > 0 ? spentFromOrders : user.totalSpent ?? 0

  const sackHistory = getSackHistoryForUser(user.id)
  const sackStats = getSackStatisticsForHistory(sackHistory)

  const sackOrdersCount = orders.filter((order) =>
    order.items?.some((item) => item.type === 'sack')
  ).length

  const sacksOpened = Math.max(sackStats.totalOpened, sackOrdersCount)

  const inventory = await loadInventoryForUser(user)
  const sackInventoryItems = inventory.filter((item) => item.obtainedFrom === 'sack').length
  const productWinsFromHistory = sackStats.rewards.products

  const itemsWon = Math.max(productWinsFromHistory, sackInventoryItems)

  return {
    totalOrders,
    totalSpent,
    sacksOpened,
    itemsWon,
  }
}
