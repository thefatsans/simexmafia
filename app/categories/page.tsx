import { Category } from '@/types'
import CategoriesPageClient from '@/components/CategoriesPageClient'
import { loadStorefrontCatalog } from '@/lib/products/load-storefront-catalog'

export const revalidate = 60

const CATEGORIES: Category[] = [
  'games',
  'gift-cards',
  'subscriptions',
  'dlc',
  'in-game-currency',
  'top-ups',
]

export default async function CategoriesPage() {
  const catalog = await loadStorefrontCatalog()
  const productCounts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<
    Category,
    number
  >

  for (const product of catalog) {
    const category = product.category as Category
    if (category in productCounts) {
      productCounts[category]++
    }
  }

  return <CategoriesPageClient productCounts={productCounts} />
}
