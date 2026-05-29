import { Product } from '@/types'
import { finalizeProductForStorefront } from '@/lib/promotions/finalize-products'
import { applySimexMafiaSellerToDiscordProducts } from '@/lib/products/simex-discord-server'
import { isProductAllowedInStorefront } from '@/lib/products/storefront-catalog'
import { enrichProductsWithStock } from '@/lib/product-keys/stock'
import { fetchStorefrontProductByIdFromDatabase } from '@/lib/products/fetch-storefront'
import { getStorefrontFallbackCatalog } from '@/lib/products/storefront-seeds'
import { resolveProductFromCatalog } from '@/lib/products/resolve-product'
import { resolveSeller } from '@/lib/sellers'

export async function loadStorefrontProduct(id: string): Promise<Product | null> {
  const decodedId = decodeURIComponent(id).trim()
  if (!decodedId) return null

  let foundProduct = await fetchStorefrontProductByIdFromDatabase(decodedId)

  if (!foundProduct) {
    foundProduct = resolveProductFromCatalog(
      getStorefrontFallbackCatalog() as Parameters<typeof resolveProductFromCatalog>[0],
      decodedId
    ) as typeof foundProduct
  }

  if (!foundProduct) return null

  const productRecord = foundProduct as Product
  const { getCompleteProductImage } = await import('@/prisma/complete-product-images')
  const correctImage =
    getCompleteProductImage(productRecord.name) || productRecord.image

  const seller =
    productRecord.seller ?? resolveSeller((foundProduct as { sellerId?: string }).sellerId)

  const base = productRecord
  const payload = finalizeProductForStorefront({
    ...base,
    image: correctImage ?? base.image,
    seller: seller ?? base.seller,
  })

  const [withSeller] = applySimexMafiaSellerToDiscordProducts([payload])
  if (!isProductAllowedInStorefront(withSeller)) {
    return null
  }

  if (typeof (withSeller as Product).stockCount === 'number') {
    return withSeller as Product
  }

  const [withStock] = await enrichProductsWithStock([withSeller])
  return withStock as Product
}
