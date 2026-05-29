import {
  PSN_10_DE_PRODUCT_ID,
  ROBLOX_800_PRODUCT_ID,
} from '@/lib/products/storefront-ids'

/** Produkte, deren Lagerbestand aus unbenutzten ProductStockKey-Codes kommt. */
export const KEY_INVENTORY_PRODUCT_IDS = new Set<string>([
  PSN_10_DE_PRODUCT_ID,
  ROBLOX_800_PRODUCT_ID,
])

export function isKeyInventoryProductId(productId: string): boolean {
  return KEY_INVENTORY_PRODUCT_IDS.has(productId)
}

export function isKeyInventoryProduct(product: { id: string }): boolean {
  return isKeyInventoryProductId(product.id)
}
