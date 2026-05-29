import { fetchStorefrontProductsFromDatabase } from '@/lib/products/fetch-storefront'
import { Product } from '@/types'

/** Anzahl sichtbarer Storefront-Produkte eines Verkäufers (ohne archivierte DB-Einträge). */
export async function getStorefrontProductCountForSeller(sellerId: string): Promise<number> {
  const products = (await fetchStorefrontProductsFromDatabase()) as Product[]
  return products.filter((product) => product.seller?.id === sellerId).length
}
