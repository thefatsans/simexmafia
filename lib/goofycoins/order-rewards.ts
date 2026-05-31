import type { Tier } from '@/types/user'
import { calculateCoinsEarned } from '@/types/user'
import { calculateTotalCoins, getPackageById } from '@/data/goofyCoinsPackages'

export function calculateServerOrderCoinsEarned(
  orderTotal: number,
  tier: Tier,
  paymentMethod: string
): number {
  if (paymentMethod === 'goofycoins') return 0
  if (orderTotal <= 0) return 0
  return calculateCoinsEarned(orderTotal, tier)
}

export function resolveGoofyCoinsPackageCredit(metadata: unknown): number {
  if (!metadata || typeof metadata !== 'object') return 0
  const meta = metadata as Record<string, unknown>
  const packageId = typeof meta.packageId === 'string' ? meta.packageId : null
  if (packageId) {
    const pkg = getPackageById(packageId)
    if (pkg) return calculateTotalCoins(pkg)
  }
  const totalCoins = Number(meta.totalCoins)
  if (Number.isFinite(totalCoins) && totalCoins > 0 && totalCoins <= 50_000) {
    return Math.floor(totalCoins)
  }
  return 0
}
