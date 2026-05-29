import { Product } from '@/types'
import { isKeyInventoryProduct } from '@/lib/products/key-inventory-catalog'

export function getProductStockCount(
  product: Pick<Product, 'stockCount' | 'inStock' | 'id'>
): number | null {
  if (isKeyInventoryProduct(product)) {
    return product.stockCount ?? 0
  }
  if (product.stockCount !== undefined) {
    return product.stockCount
  }
  return null
}

export function isProductOutOfStock(
  product: Pick<Product, 'stockCount' | 'inStock' | 'id'>
): boolean {
  const stock = getProductStockCount(product)
  if (stock !== null) {
    return stock <= 0
  }
  return !product.inStock
}

export function getStockLabel(
  product: Pick<Product, 'stockCount' | 'inStock' | 'id'>
): string | null {
  if (isKeyInventoryProduct(product)) {
    const stock = product.stockCount ?? 0
    if (stock <= 0) return 'Ausverkauft'
    if (stock === 1) return '1 Code verfügbar'
    return `${stock} Codes verfügbar`
  }

  const stock = getProductStockCount(product)
  if (stock !== null) {
    if (stock <= 0) return 'Ausverkauft'
    if (stock === 1) return '1 Code verfügbar'
    return `${stock} Codes verfügbar`
  }

  return product.inStock ? null : 'Ausverkauft'
}

export function getStockDetailLabel(
  product: Pick<Product, 'stockCount' | 'inStock' | 'id'>
): string | null {
  if (!isKeyInventoryProduct(product)) {
    return product.inStock ? 'Digital verfügbar' : 'Ausverkauft'
  }

  const stock = product.stockCount ?? 0
  if (stock <= 0) {
    return 'Aktuell keine Codes auf Lager'
  }
  if (stock === 1) {
    return 'Aktueller Bestand: 1 Code'
  }
  return `Aktueller Bestand: ${stock} Codes`
}
