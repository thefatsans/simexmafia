import { updateProductImages } from '@/lib/image-updater'
import { applySummerVoucherSaleList } from '@/lib/promotions/summer-voucher-sale'
import { Product } from '@/types'

/** Bilder aktualisieren + aktive Aktionen (Sommer-Gutschein-Sale) anwenden */
export function finalizeProductsForStorefront<T extends Product>(products: T[]): T[] {
  const withImages = updateProductImages(products) as T[]
  return applySummerVoucherSaleList(withImages) as T[]
}

export function finalizeProductForStorefront<T extends Product>(product: T): T {
  const [single] = finalizeProductsForStorefront([product])
  return single
}
