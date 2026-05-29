import { cache } from 'react'
import { Product } from '@/types'
import { finalizeProductsForStorefront } from '@/lib/promotions/finalize-products'
import { fetchStorefrontProductsFromDatabase } from '@/lib/products/fetch-storefront'

/** Server-side storefront catalog — deduplicated per request, cached 60s in fetch-storefront. */
export const loadStorefrontCatalog = cache(async (): Promise<Product[]> => {
  const products = await fetchStorefrontProductsFromDatabase()
  return finalizeProductsForStorefront(products as Product[])
})
