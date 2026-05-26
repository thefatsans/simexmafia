import { Product } from '@/types'

export function getProductStockCount(product: Pick<Product, 'stockCount' | 'inStock'>): number | null {
  if (product.stockCount !== undefined) {
    return product.stockCount
  }
  return null
}

export function isProductOutOfStock(product: Pick<Product, 'stockCount' | 'inStock'>): boolean {
  const stock = getProductStockCount(product)
  if (stock !== null) {
    return stock <= 0
  }
  return !product.inStock
}

export function getStockLabel(product: Pick<Product, 'stockCount' | 'inStock'>): string | null {
  const stock = getProductStockCount(product)
  if (stock === null) {
    return product.inStock ? null : 'Ausverkauft'
  }
  if (stock <= 0) return 'Ausverkauft'
  return stock === 1 ? 'Noch 1 verfügbar' : `Noch ${stock} verfügbar`
}
