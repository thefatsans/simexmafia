import { Product } from '@/types'
import { applyProductQueryFilters, type ProductQueryFilters } from '@/lib/products/query'
import { createSimexDiscordServerProduct } from '@/lib/products/storefront-seeds'
import { SIMEXMAFIA_SELLER } from '@/lib/sellers'
import { isSimexDiscordServerProduct } from '@/lib/products/discord-product'

export { isSimexDiscordServerProduct, SIMEX_DISCORD_SERVER_NAME } from '@/lib/products/discord-product'

function withSimexMafiaSeller<T extends Product>(product: T): T {
  return { ...product, seller: SIMEXMAFIA_SELLER }
}

export async function getSimexDiscordServerProduct(): Promise<Product | null> {
  return withSimexMafiaSeller(createSimexDiscordServerProduct())
}

/** Discord-Produkt immer mit Verkäufer SimexMafia anzeigen */
export function applySimexMafiaSellerToDiscordProducts<T extends Product>(products: T[]): T[] {
  return products.map((p) =>
    isSimexDiscordServerProduct(p) ? withSimexMafiaSeller(p) : p
  )
}

/** Stellt sicher, dass das exklusive Discord-Produkt im Katalog sichtbar ist. */
export async function ensureSimexDiscordServerInCatalog<T extends Product>(
  products: T[],
  filters: ProductQueryFilters = {}
): Promise<T[]> {
  let list = applySimexMafiaSellerToDiscordProducts(products)

  if (!list.some(isSimexDiscordServerProduct)) {
    const discordProduct = await getSimexDiscordServerProduct()
    if (!discordProduct) {
      return list
    }

    const matched = applyProductQueryFilters([discordProduct], filters)
    if (matched.length === 0) {
      return list
    }

    return [discordProduct as T, ...list]
  }

  return list
}
