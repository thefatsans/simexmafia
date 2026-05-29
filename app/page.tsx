import HomeClient from '@/components/HomeClient'
import { loadStorefrontCatalog } from '@/lib/products/load-storefront-catalog'

export const revalidate = 60

export default async function Home() {
  const initialCatalog = await loadStorefrontCatalog()
  return <HomeClient initialCatalog={initialCatalog} />
}
