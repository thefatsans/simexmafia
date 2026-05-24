import { Product } from '@/types'

/** Einheitliche Produkt-URL – immer per stabiler ID */
export function getProductUrl(product: Pick<Product, 'id'>): string {
  return `/products/${encodeURIComponent(product.id)}`
}
