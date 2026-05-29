import { notFound } from 'next/navigation'
import { Category } from '@/types'
import CategoryPageContent from '@/components/CategoryPageContent'
import { loadStorefrontCatalog } from '@/lib/products/load-storefront-catalog'

export const revalidate = 60

const categoryNames: Record<Category, string> = {
  games: 'Videospiele',
  'gift-cards': 'Gutscheine',
  subscriptions: 'Abonnements',
  dlc: 'DLC & Erweiterungen',
  'in-game-currency': 'Spielwährung',
  'top-ups': 'Aufladungen',
}

export default async function CategoryPage({
  params,
}: {
  params: { category: string }
}) {
  const category = params.category as Category
  if (!categoryNames[category]) {
    notFound()
  }

  const catalog = await loadStorefrontCatalog()
  const initialProducts = catalog.filter((product) => product.category === category)

  return <CategoryPageContent category={category} initialProducts={initialProducts} />
}
