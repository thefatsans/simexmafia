import type { InventoryItem } from '@/data/inventory'

function mapObtainedFrom(source: unknown): InventoryItem['obtainedFrom'] {
  const s = String(source || '')
  if (s === 'sack') return 'sack'
  if (s === 'purchase') return 'purchase'
  if (s === 'gift') return 'gift'
  return 'other'
}

/** Maps a Prisma/API inventory row to the client InventoryItem shape. */
export function mapDbInventoryItem(raw: Record<string, unknown>): InventoryItem | null {
  const product = raw.product as InventoryItem['product'] | undefined
  if (!product?.id) return null

  return {
    id: String(raw.id),
    product,
    obtainedAt: String(raw.createdAt || raw.obtainedAt || new Date().toISOString()),
    obtainedFrom: mapObtainedFrom(raw.source),
    sourceId: raw.sourceId ? String(raw.sourceId) : raw.orderId ? String(raw.orderId) : undefined,
    sourceName: raw.notes ? String(raw.notes) : undefined,
    isRedeemed: Boolean(raw.isRedeemed),
    redeemedAt: raw.redeemedAt ? String(raw.redeemedAt) : undefined,
    redemptionCode: raw.redemptionCode ? String(raw.redemptionCode) : undefined,
    redemptionStatus: raw.redemptionStatus ? String(raw.redemptionStatus) : undefined,
  }
}
