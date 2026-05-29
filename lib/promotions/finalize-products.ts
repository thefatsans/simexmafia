import { updateProductImages } from '@/lib/image-updater'
import { Product } from '@/types'

/** Bilder aktualisieren für Storefront-Anzeige */
export function finalizeProductsForStorefront<T extends Product>(products: T[]): T[] {
  return updateProductImages(products) as T[]
}

export function finalizeProductForStorefront<T extends Product>(product: T): T {
  const [single] = finalizeProductsForStorefront([product])
  return single
}
