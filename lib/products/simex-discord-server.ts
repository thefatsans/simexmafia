import { Product } from '@/types'
import { applyProductQueryFilters, type ProductQueryFilters } from '@/lib/products/query'
import { loadGeneratedProductsCatalog } from '@/lib/products/format-generated'
import { SIMEXMAFIA_SELLER } from '@/lib/sellers'

export const SIMEX_DISCORD_SERVER_NAME = 'Simex Geheimer Discord-Server'

export function isSimexDiscordServerProduct(product: Pick<Product, 'name'>): boolean {
  const name = product.name.toLowerCase()
  return (
    name.includes('simex') &&
    name.includes('discord') &&
    (name.includes('server') || name.includes('geheim'))
  )
}

function withSimexMafiaSeller<T extends Product>(product: T): T {
  return { ...product, seller: SIMEXMAFIA_SELLER }
}

export async function getSimexDiscordServerProduct(): Promise<Product | null> {
  const catalog = await loadGeneratedProductsCatalog()
  const found = catalog.find(isSimexDiscordServerProduct)
  return found ? withSimexMafiaSeller(found) : null
}

/** Discord-Produkt immer mit Verkäufer SimexMafia anzeigen */
export function applySimexMafiaSellerToDiscordProducts<T extends Product>(products: T[]): T[] {
  return products.map((p) =>
    isSimexDiscordServerProduct(p) ? withSimexMafiaSeller(p) : p
  )
}

/** Stellt sicher, dass das exklusive Discord-Produkt im Katalog sichtbar ist (auch wenn die DB es nicht enthält). */
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
